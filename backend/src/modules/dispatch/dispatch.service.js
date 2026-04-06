const DeliveryChallan = require('../../models/deliveryChallan.model');
const Sale = require('../../models/sale.model');
const Warehouse = require('../../models/warehouse.model');
const Store = require('../../models/store.model');
const { withTransaction } = require('../../services/transaction.service');
const challanService = require('../deliveryChallan/deliveryChallan.service');
const salesService = require('../sales/sales.service');
const { DocumentType } = require('../../core/enums');

const Dispatch = require('../../models/dispatch.model');
const Item = require('../../models/item.model');
const { getNextSequence } = require('../../services/sequence.service');

const populateDispatchItemsManual = async (dispatches) => {
    const isSingle = !Array.isArray(dispatches);
    const docs = isSingle ? [dispatches] : dispatches;

    for (const doc of docs) {
        if (!doc.items || doc.items.length === 0) continue;

        const variantIds = doc.items.map(i => i.variantId ? (i.variantId._id || i.variantId) : null).filter(Boolean);

        // Find Items containing these variations
        const items = await Item.find({ "sizes._id": { $in: variantIds } })
            .populate('brand', 'name brandName')
            .populate('groupIds', 'name groupType groupName')
            .lean();

        // Map them back to the dispatch items
        doc.items = doc.items.map(di => {
            const vid = String(di.variantId?._id || di.variantId);
            const parentItem = items.find(it => it.sizes.some(sz => String(sz._id) === vid));
            if (parentItem) {
                const variant = parentItem.sizes.find(sz => String(sz._id) === vid);
                return {
                    ...di.toObject ? di.toObject() : di,
                    variantId: {
                        _id: variant._id,
                        name: `${parentItem.itemName} (${variant.size})`,
                        sku: variant.sku || parentItem.itemCode,
                        barcode: variant.barcode || variant.sku || parentItem.itemCode,
                        size: variant.size,
                        color: variant.color || parentItem.shade || 'N/A',
                        brand: parentItem.brand || { name: 'Main' },
                        category: parentItem.groupIds?.[0] || { name: 'General' }
                    }
                };
            }
            return di;
        });
    }

    return isSingle ? docs[0] : docs;
};

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
            const productDoc = await Product.findById(p.productId).populate('itemId').session(session);
            if (productDoc && (productDoc.itemId?.type === 'FABRIC' || productDoc.itemType === 'FABRIC')) {
                throw new Error(`Item ${productDoc.itemName || ''} is a FABRIC and cannot be dispatched to a store.`);
            }

            let rate = p.rate;
            if (!rate || rate <= 0) {
                rate = productDoc ? productDoc.mrp || productDoc.salePrice : 0;
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

            // 3. Move to In-Transit pool for destination store
            await stockService.addInTransit({
                variantId: item.variantId,
                locationId: dispatch.destinationStoreId,
                locationType: 'STORE',
                qty: item.qty,
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

const getDispatches = async (query, user) => {
    const { status, sourceId, destinationId } = query;
    const filter = {};

    // Security: Filter by shopId for store staff
    if (user && user.role === 'store_staff') {
        if (!user.shopId) throw new Error('User is not linked to any store.');
        filter.$or = [
            { sourceWarehouseId: user.shopId },
            { destinationStoreId: user.shopId }
        ];
    }

    if (status) filter.status = status;
    if (sourceId) filter.sourceWarehouseId = sourceId;
    if (destinationId) filter.destinationStoreId = destinationId;

    const dispatches = await Dispatch.find(filter)
        .sort({ createdAt: -1 })
        .populate('sourceWarehouseId', 'name')
        .populate('destinationStoreId', 'name')
        .populate('createdBy', 'name');

    return await populateDispatchItemsManual(dispatches);
};

const getDispatchById = async (id, user) => {
    const dispatch = await Dispatch.findById(id)
        .populate('sourceWarehouseId')
        .populate('destinationStoreId')
        .populate('createdBy', 'name')
        .populate('items.variantId', 'name sku barcode');

    if (!dispatch) throw new Error('Dispatch record not found');
    return dispatch;
};

const receiveDispatch = async (id, userId) => {
    const stockService = require('../../services/stock.service');

    return await withTransaction(async (session) => {
        const dispatch = await Dispatch.findById(id).session(session);
        if (!dispatch) throw new Error('Dispatch record not found');
        if (dispatch.status === 'RECEIVED') throw new Error('Dispatch already received');

        // 1. Transition Stock from In-Transit to Store Physical Inventory
        const Item = require('../../models/item.model');

        for (const item of dispatch.items) {
            // Fetch the actual Item and Variant to get the correct SKU/Barcode
            const parentItem = await Item.findOne({ "sizes._id": item.variantId }).session(session);
            if (!parentItem) throw new Error(`Parent item not found for variant ${item.variantId}`);
            
            const variant = parentItem.sizes.id(item.variantId);
            const originalBarcode = variant.sku || parentItem.itemCode;

            // A. Remove from virtual in-transit pool
            await stockService.removeInTransit({
                itemId: parentItem._id,
                barcode: originalBarcode, 
                variantId: item.variantId,
                locationId: dispatch.destinationStoreId,
                locationType: 'STORE',
                qty: item.qty,
                session
            });

            // B. Add to physical store inventory
            const systemConfigService = require('../systemConfig/systemConfig.service');
            const relabelOnTransfer = await systemConfigService.getConfigByKey('relabelOnTransfer', false);
            
            let targetBarcode = originalBarcode;
            if (relabelOnTransfer) {
                const store = await Store.findById(dispatch.destinationStoreId).session(session);
                const storeCode = store ? store.storeCode : 'STR';
                targetBarcode = `${storeCode}-${originalBarcode}`;
                console.log(`[RELABEL] New Barcode generated for Store: ${targetBarcode}`);
            }

            await stockService.addStock({
                itemId: parentItem._id,
                barcode: targetBarcode, 
                variantId: item.variantId,
                locationId: dispatch.destinationStoreId,
                locationType: 'STORE',
                qty: item.qty,
                type: 'RECEIVE',
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
