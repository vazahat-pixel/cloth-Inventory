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

        const dispatchMaster = new Dispatch({
            dispatchNumber,
            sourceWarehouseId,
            destinationStoreId,
            items: products.map(p => ({
                variantId: p.productId,
                qty: p.quantity
            })),
            status: 'DISPATCHED',
            referenceId: generatedDoc.documentId,
            referenceType: generatedDoc.type === 'TAX_INVOICE' ? 'Sale' : 'DeliveryChallan',
            dispatchedAt: new Date(),
            vehicleNumber: rest.vehicleNumber,
            driverName: rest.driverName,
            notes: rest.notes || `Auto-generated ${generatedDoc.type}: ${generatedDoc.documentNumber}`,
            createdBy: userId
        });

        await dispatchMaster.save({ session });

        return {
            ...generatedDoc,
            dispatchId: dispatchMaster._id,
            dispatchNumber: dispatchMaster.dispatchNumber,
            message: `Successfully created ${generatedDoc.type} (${generatedDoc.documentNumber})`
        };
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
    getDispatches,
    getDispatchById,
    receiveDispatch,
    processDispatch: createDispatch // for compatibility
};
