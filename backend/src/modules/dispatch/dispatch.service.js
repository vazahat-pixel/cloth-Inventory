const DeliveryChallan = require('../../models/deliveryChallan.model');
const Sale = require('../../models/sale.model');
const Warehouse = require('../../models/warehouse.model');
const Store = require('../../models/store.model');
const { withTransaction } = require('../../services/transaction.service');
const challanService = require('../deliveryChallan/deliveryChallan.service');
const salesService = require('../sales/sales.service');
const { DocumentType } = require('../../core/enums');

const Dispatch = require('../../models/dispatch.model');
const { getNextSequence } = require('../../services/sequence.service');

/**
 * UNIFIED DISPATCH SYSTEM
 * Routes dispatches between same GSTIN (Delivery Challan)
 * and different GSTIN (Tax Invoice / Sale)
 */
const createDispatch = async (dispatchData, userId) => {
    return await withTransaction(async (session) => {
        const { sourceWarehouseId, destinationStoreId, products, ...rest } = dispatchData;

        // 1. Resolve source and destination entities
        const source = await Warehouse.findById(sourceWarehouseId).session(session) 
                    || await Store.findById(sourceWarehouseId).session(session);
        const destination = await Store.findById(destinationStoreId).session(session);

        if (!source || !destination) {
            throw new Error('Source or Destination not found');
        }

        // 2. Compare GSTINs
        const sourceGst = (source.gstNumber || '').trim().toUpperCase();
        const destGst = (destination.gstNumber || '').trim().toUpperCase();
        const isSameEntity = sourceGst === destGst;

        // 3. Prepare items with Prices (CRITICAL: Every move needs a price for model validation)
        const Product = require('../../models/product.model');
        const enrichedItems = [];
        for (const p of products) {
            let rate = p.rate;
            if (!rate || rate <= 0) {
                const product = await Product.findById(p.productId).session(session);
                rate = product ? product.salePrice : 0;
            }
            enrichedItems.push({
                productId: p.productId,
                quantity: p.quantity,
                price: Number(rate || 0),
                appliedPrice: Number(rate || 0),
                total: Number((rate || 0) * (p.quantity || 0))
            });
        }
        const totalAmount = enrichedItems.reduce((sum, item) => sum + item.total, 0);

        let generatedDoc = null;

        if (isSameEntity) {
            // ACTION: CREATE DELIVERY CHALLAN (Stock Transfer)
            const challan = await challanService.createChallan({
                ...rest,
                storeId: destinationStoreId,
                sourceId: sourceWarehouseId,
                items: enrichedItems,
                type: 'STOCK_TRANSFER'
            }, userId, session);

            generatedDoc = {
                type: 'DELIVERY_CHALLAN',
                documentNumber: challan.dcNumber,
                documentId: challan._id
            };
        } else {
            // ACTION: CREATE TAX INVOICE (Internal Sale)
            const sale = await salesService.createSale({
                ...rest,
                storeId: sourceWarehouseId,
                destinationStoreId,
                items: enrichedItems,
                type: 'INTERNAL_SALE',
                subTotal: totalAmount,
                grandTotal: totalAmount,
                customerId: null,
                paymentMode: 'CREDIT',
                amountPaid: 0,
                discount: 0
            }, userId, session);

            generatedDoc = {
                type: 'TAX_INVOICE',
                documentNumber: sale.saleNumber,
                documentId: sale._id
            };
        }

        // 4. Create Dispatch Master Record
        const dispatchYear = new Date().getFullYear();
        const sequence = await getNextSequence(`DISPATCH_${dispatchYear}`, session);
        const dispatchNumber = `DSP-${dispatchYear}-${sequence.toString().padStart(5, '0')}`;

        const isDraft = rest.status === 'DRAFT';
        const finalStatus = isDraft ? 'PENDING' : 'DISPATCHED';

        const dispatchMaster = new Dispatch({
            dispatchNumber,
            sourceWarehouseId,
            destinationStoreId,
            items: products.map(p => ({
                variantId: p.productId,
                qty: p.quantity
            })),
            status: finalStatus,
            referenceId: generatedDoc.documentId,
            referenceType: generatedDoc.type === 'TAX_INVOICE' ? 'Sale' : 'DeliveryChallan',
            dispatchedAt: isDraft ? null : new Date(),
            vehicleNumber: rest.vehicleNumber,
            driverName: rest.driverName,
            notes: rest.notes || `Auto-generated ${generatedDoc.type}: ${generatedDoc.documentNumber}`,
            createdBy: userId
        });

        await dispatchMaster.save({ session });

        // 5. INVENTORY LOGIC: Reserve if Draft, Remove if Sent
        const stockService = require('../../services/stock.service');
        if (isDraft) {
            // Reserve stock in Warehouse
            for (const p of products) {
                await stockService.reserveStock({
                    variantId: p.productId,
                    locationId: sourceWarehouseId,
                    locationType: 'WAREHOUSE',
                    qty: p.quantity,
                    session
                });
            }
        } else {
            // Actual deduct happened inside createChallan/createSale for SENT status
            // No extra action needed here as those services already call removeStock
        }

        return {
            ...generatedDoc,
            dispatchId: dispatchMaster._id,
            dispatchNumber: dispatchMaster.dispatchNumber,
            status: finalStatus,
            message: `Successfully generated ${generatedDoc.type}: ${generatedDoc.documentNumber} (${isDraft ? 'RESERVED' : 'DISPATCHED'})`
        };
    });
};

const updateDispatch = async (id, dispatchData, userId) => {
    return await withTransaction(async (session) => {
        const dispatchMaster = await Dispatch.findById(id).session(session);
        if (!dispatchMaster) throw new Error('Dispatch record not found');
        if (dispatchMaster.status !== 'PENDING') throw new Error('Only Draft/Pending dispatches can be updated');

        const { products, vehicleNumber, driverName, notes } = dispatchData;
        const stockService = require('../../services/stock.service');

        // 1. Release OLD Reservations
        for (const item of dispatchMaster.items) {
            await stockService.releaseStock({
                variantId: item.variantId,
                locationId: dispatchMaster.sourceWarehouseId,
                locationType: 'WAREHOUSE',
                qty: item.qty,
                session
            });
        }

        // 2. Prepare new items with Prices
        const Product = require('../../models/product.model');
        const enrichedItems = [];
        for (const p of products) {
            let rate = p.rate;
            if (!rate || rate <= 0) {
                const product = await Product.findById(p.productId).session(session);
                rate = product ? product.salePrice : 0;
            }
            enrichedItems.push({
                productId: p.productId,
                quantity: p.quantity,
                price: Number(rate || 0),
                appliedPrice: Number(rate || 0),
                total: Number((rate || 0) * (p.quantity || 0))
            });
        }
        const totalAmount = enrichedItems.reduce((sum, item) => sum + item.total, 0);

        // 3. Update parent Document
        const DeliveryChallan = require('../../models/deliveryChallan.model');
        const Sale = require('../../models/sale.model');

        if (dispatchMaster.referenceType === 'DeliveryChallan') {
            await DeliveryChallan.findByIdAndUpdate(dispatchMaster.referenceId, {
                vehicleNumber: vehicleNumber || dispatchMaster.vehicleNumber,
                driverName: driverName || dispatchMaster.driverName,
                notes: notes,
                items: enrichedItems,
                totalValue: totalAmount
            }, { session });
        } else if (dispatchMaster.referenceType === 'Sale') {
            await Sale.findByIdAndUpdate(dispatchMaster.referenceId, {
                vehicleNumber: vehicleNumber || dispatchMaster.vehicleNumber,
                driverName: driverName || dispatchMaster.driverName,
                notes: notes,
                items: enrichedItems,
                subTotal: totalAmount,
                grandTotal: totalAmount
            }, { session });
        }

        // 4. Update Dispatch Record
        dispatchMaster.vehicleNumber = vehicleNumber || dispatchMaster.vehicleNumber;
        dispatchMaster.driverName = driverName || dispatchMaster.driverName;
        dispatchMaster.notes = notes || dispatchMaster.notes;
        dispatchMaster.items = products.map(p => ({
            variantId: p.productId,
            qty: p.quantity
        }));
        await dispatchMaster.save({ session });

        // 5. Apply NEW Reservations
        for (const p of products) {
            await stockService.reserveStock({
                variantId: p.productId,
                locationId: dispatchMaster.sourceWarehouseId,
                locationType: 'WAREHOUSE',
                qty: p.quantity,
                session
            });
        }

        return {
            dispatchId: dispatchMaster._id,
            dispatchNumber: dispatchMaster.dispatchNumber,
            status: dispatchMaster.status,
            message: `Successfully updated draft dispatch: ${dispatchMaster.dispatchNumber}`
        };
    });
};

const confirmDispatch = async (id, userId) => {
    const stockService = require('../../services/stock.service');
    const DeliveryChallan = require('../../models/deliveryChallan.model');
    const Sale = require('../../models/sale.model');

    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch record not found');
        if (dispatch.status !== 'PENDING') throw new Error(`Cannot confirm dispatch with status: ${dispatch.status}`);

        // 1. Release Reservation and Deduct Physical Stock
        for (const item of dispatch.items) {
            // First release the logical reservation
            await stockService.releaseStock({
                variantId: item.variantId,
                locationId: dispatch.sourceWarehouseId,
                locationType: 'WAREHOUSE',
                qty: item.qty,
                session
            });

            // Then physically deduct from source warehouse
            await stockService.removeStock({
                variantId: item.variantId,
                locationId: dispatch.sourceWarehouseId,
                locationType: 'WAREHOUSE',
                qty: item.qty,
                type: 'TRANSFER',
                referenceId: dispatch.referenceId,
                referenceType: dispatch.referenceType,
                performedBy: userId,
                session
            });
        }

        // 2. Update Dispatch Status
        dispatch.status = 'DISPATCHED';
        dispatch.dispatchedAt = new Date();
        await dispatch.save({ session });

        // 3. Update related document (Challan or Sale)
        if (dispatch.referenceType === 'DeliveryChallan') {
            await DeliveryChallan.findByIdAndUpdate(dispatch.referenceId, { status: 'DISPATCHED' }, { session });
        } else if (dispatch.referenceType === 'Sale') {
            await Sale.findByIdAndUpdate(dispatch.referenceId, { deliveryStatus: 'DISPATCHED' }, { session });
        }

        return dispatch;
    });
};

const cancelDispatch = async (id, userId) => {
    const stockService = require('../../services/stock.service');
    const DeliveryChallan = require('../../models/deliveryChallan.model');
    const Sale = require('../../models/sale.model');

    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch record not found');
        if (dispatch.status !== 'PENDING') throw new Error(`Only PENDING (Draft) dispatches can be cancelled. Current status is ${dispatch.status}`);

        // 1. Release Reservation
        for (const item of dispatch.items) {
            await stockService.releaseStock({
                variantId: item.variantId,
                locationId: dispatch.sourceWarehouseId,
                locationType: 'WAREHOUSE',
                qty: item.qty,
                session
            });
        }

        // 2. Mark Dispatch as Cancelled
        dispatch.status = 'CANCELLED';
        await dispatch.save({ session });

        // 3. Cancel corresponding document
        if (dispatch.referenceType === 'DeliveryChallan') {
            await DeliveryChallan.findByIdAndUpdate(dispatch.referenceId, { status: 'CANCELLED' }, { session });
        } else if (dispatch.referenceType === 'Sale') {
            await Sale.findByIdAndUpdate(dispatch.referenceId, { status: 'CANCELLED', deliveryStatus: 'CANCELED' }, { session });
        }

        return dispatch;
    });
};

const getDispatches = async (query) => {
    const { status, sourceId, destinationId } = query;
    const filter = {};
    if (status) filter.status = status;
    if (sourceId) filter.sourceWarehouseId = sourceId;
    if (destinationId) filter.destinationStoreId = destinationId;

    return await Dispatch.find(filter)
        .sort({ createdAt: -1 })
        .populate('sourceWarehouseId', 'name')
        .populate('destinationStoreId', 'name')
        .populate('createdBy', 'name');
};

const getDispatchById = async (id) => {
    const dispatch = await Dispatch.findById(id)
        .populate('sourceWarehouseId')
        .populate('destinationStoreId')
        .populate('createdBy', 'name')
        .lean();
    
    if (!dispatch) throw new Error('Dispatch record not found');

    // MANUAL POPULATION: Since variantId actually refers to a subdocument in Item.sizes
    // and cannot be effortlessly populated via standard Mongoose 'Product' ref
    const Item = require('../../models/item.model');
    const variantIds = dispatch.items.map(it => it.variantId);
    const parentItems = await Item.find({ "sizes._id": { $in: variantIds } }).lean();

    dispatch.items = dispatch.items.map(it => {
        const parent = parentItems.find(p => 
            p.sizes && p.sizes.some(s => s._id.toString() === it.variantId.toString())
        );
        const sizeInfo = parent ? parent.sizes.find(s => s._id.toString() === it.variantId.toString()) : null;

        return {
            ...it,
            variantId: {
                _id: it.variantId,
                name: parent ? parent.itemName : (it.variantId ? 'Unknown Product' : '-'),
                sku: (sizeInfo ? sizeInfo.sku : (parent ? parent.itemCode : '-')),
                size: sizeInfo ? sizeInfo.size : '-',
                color: parent ? parent.shade : '-',
                salePrice: sizeInfo ? sizeInfo.salePrice : 0
            }
        };
    });

    return dispatch;
};

const receiveDispatch = async (id, userId) => {
    const stockService = require('../../services/stock.service');
    
    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch record not found');
        if (dispatch.status === 'RECEIVED') throw new Error('Dispatch already received');

        // 1. Add Stock to Destination Store
        for (const item of dispatch.items) {
            await stockService.addStock({
                variantId: item.variantId,
                locationId: dispatch.destinationStoreId,
                locationType: 'STORE',
                qty: item.qty,
                type: 'TRANSFER',
                referenceId: dispatch._id,
                referenceType: 'Dispatch',
                performedBy: userId,
                session
            });
        }

        // 2. Update Status
        dispatch.status = 'RECEIVED';
        dispatch.receivedAt = new Date();
        await dispatch.save({ session });

        return dispatch;
    });
};

module.exports = {
    createDispatch,
    updateDispatch,
    confirmDispatch,
    cancelDispatch,
    getDispatches,
    getDispatchById,
    receiveDispatch,
    processDispatch: createDispatch // for compatibility
};
