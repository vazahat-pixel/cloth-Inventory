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

        // Standard ERP Logic: Same GSTIN = Stock Transfer (DC), Different GSTIN = Sale (Invoice)
        const isSameEntity = sourceGst === destGst;
        let generatedDoc = null;

        if (isSameEntity) {
            // ACTION: CREATE DELIVERY CHALLAN
            const challan = await challanService.createChallan({
                ...rest,
                storeId: destinationStoreId, // Target
                sourceId: sourceWarehouseId, // From
                items: products,
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
                items: products.map(p => ({
                    productId: p.productId,
                    quantity: p.quantity,
                    price: p.rate || 0,
                })),
                type: 'INTERNAL_SALE',
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

        // 3. Create Dispatch Master Record
        const dispatchYear = new Date().getFullYear();
        const { sequence } = await getNextSequence(`DISPATCH_${dispatchYear}`, session);
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
            dispatchedAt: new Date(),
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

const updateDispatchStatus = async (id, status, userId) => {
    const dispatch = await Dispatch.findById(id);
    if (!dispatch) throw new Error('Dispatch not found');

    dispatch.status = status;
    if (status === 'RECEIVED') {
        dispatch.receivedAt = new Date();
    }
    
    return await dispatch.save();
};

module.exports = {
    createDispatch,
    getDispatches,
    getDispatchById,
    updateDispatchStatus,
    processDispatch: createDispatch // for compatibility
};
