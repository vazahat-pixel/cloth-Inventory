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
        .populate('createdBy', 'name');
    
    if (!dispatch) throw new Error('Dispatch record not found');

    // Security: Check ownership for store staff
    if (user && user.role === 'store_staff') {
        const isSource = String(dispatch.sourceWarehouseId?._id || dispatch.sourceWarehouseId) === String(user.shopId);
        const isDest = String(dispatch.destinationStoreId?._id || dispatch.destinationStoreId) === String(user.shopId);
        if (!isSource && !isDest) {
            throw new Error('Access denied: You can only view dispatches related to your store.');
        }
    }

    return await populateDispatchItemsManual(dispatch);
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
