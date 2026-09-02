const StockReturn = require('../../models/stockReturn.model');
const { DispatchStatus, StockMovementType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { removeStock, addStock, addInTransit, removeInTransit } = require('../../services/stock.service');
const { getNextSequence } = require('../../services/sequence.service');

const generateReturnNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const seq = await getNextSequence(`PURCHASE_RETURN_${year}`, session);
    return `PR-${year}-${seq.toString().padStart(5, '0')}`;
};

/**
 * INITIATE RETURN (Store -> In-Transit)
 * Deducts from Store Physical, Adds to Warehouse In-Transit
 */
const initiateReturn = async (returnData, userId) => {
    return await withTransaction(async (session) => {
        const { sourceStoreId, destinationWarehouseId, items, reason } = returnData;

        const returnNumber = await generateReturnNumber(session);

        const stockReturn = new StockReturn({
            returnNumber,
            sourceStoreId,
            destinationWarehouseId,
            items: items.map(it => ({
                variantId: it.variantId,
                qty: it.qty
            })),
            reason,
            status: DispatchStatus.DISPATCHED, // Immediately dispatched upon creation
            createdBy: userId
        });

        await stockReturn.save({ session });

        // Stock Movement
        for (const item of items) {
            // 1. Remove from Store Physical Stock
            await removeStock({
                variantId: item.variantId,
                locationId: sourceStoreId,
                locationType: 'STORE',
                qty: item.qty,
                type: StockMovementType.TRANSFER,
                referenceId: stockReturn._id,
                referenceType: 'StockReturn',
                performedBy: userId,
                session
            });

            // 2. Add to Virtual In-Transit Pool for Warehouse
            await addInTransit({
                variantId: item.variantId,
                locationId: destinationWarehouseId,
                locationType: 'WAREHOUSE',
                qty: item.qty,
                session
            });
        }

        return stockReturn;
    });
};

/**
 * RECEIVE RETURN (In-Transit -> Warehouse)
 * Deducts from Warehouse In-Transit, Adds to Warehouse Physical
 */
const receiveReturn = async (id, userId) => {
    return await withTransaction(async (session) => {
        const stockReturn = await StockReturn.findById(id).session(session);
        if (!stockReturn) throw new Error('Return record not found');
        if (stockReturn.status === DispatchStatus.RECEIVED) throw new Error('Return already received');

        // Stock Movement
        for (const item of stockReturn.items) {
            // 1. Remove from Virtual In-Transit Pool
            await removeInTransit({
                variantId: item.variantId,
                locationId: stockReturn.destinationWarehouseId,
                locationType: 'WAREHOUSE',
                qty: item.qty,
                session
            });

            // 2. Add to Warehouse Physical Stock
            await addStock({
                variantId: item.variantId,
                locationId: stockReturn.destinationWarehouseId,
                locationType: 'WAREHOUSE',
                qty: item.qty,
                type: StockMovementType.TRANSFER,
                referenceId: stockReturn._id,
                referenceType: 'StockReturn',
                performedBy: userId,
                session
            });
        }

        stockReturn.status = DispatchStatus.RECEIVED;
        stockReturn.receivedAt = new Date();
        await stockReturn.save({ session });

        return stockReturn;
    });
};

const enrichReturnItems = async (returns) => {
    const Item = require('../../models/item.model');
    const mongoose = require('mongoose');
    const list = Array.isArray(returns) ? returns : [returns];
    const allVariantIds = [];

    for (const doc of list) {
        if (!doc?.items?.length) continue;
        for (const line of doc.items) {
            const variantRef = line.variantId;
            const variantIdStr = String(variantRef?._id || variantRef || '');
            if (variantIdStr && mongoose.Types.ObjectId.isValid(variantIdStr)) {
                allVariantIds.push(new mongoose.Types.ObjectId(variantIdStr));
            }
        }
    }

    if (allVariantIds.length === 0) return returns;

    const items = await Item.find({
        $or: [
            { 'sizes._id': { $in: allVariantIds } },
            { _id: { $in: allVariantIds } }
        ]
    }).select('itemName sizes itemCode').lean();

    const variantMap = new Map();
    items.forEach(it => {
        variantMap.set(it._id.toString(), { item: it, sizeRow: it.sizes?.[0] });
        (it.sizes || []).forEach(sz => {
            variantMap.set(sz._id.toString(), { item: it, sizeRow: sz });
        });
    });

    for (const doc of list) {
        if (!doc?.items?.length) continue;
        for (const line of doc.items) {
            const variantRef = line.variantId;
            const variantIdStr = String(variantRef?._id || variantRef || '');
            if (!variantIdStr) continue;

            const matched = variantMap.get(variantIdStr);
            const item = matched?.item;
            const sizeRow = matched?.sizeRow;

            line.variantId = {
                _id: variantIdStr,
                name: item?.itemName || variantRef?.name || variantRef?.itemName || 'Returned Item',
                itemName: item?.itemName || variantRef?.name || variantRef?.itemName || 'Returned Item',
                sku: sizeRow?.sku || variantRef?.sku || item?.itemCode || '-',
                barcode: sizeRow?.barcode || variantRef?.barcode || '',
                size: sizeRow?.size || variantRef?.size || 'UNI',
                color: sizeRow?.color || variantRef?.color || '-',
            };
        }
    }
    return returns;
};

const getReturns = async (query = {}, user = null) => {
    const filter = {};
    if (user && user.role === 'store_staff') {
        filter.sourceStoreId = user.shopId;
    }
    
    if (query.status) filter.status = query.status;
    if (query.sourceId) filter.sourceStoreId = query.sourceId;
    if (query.destinationId) filter.destinationWarehouseId = query.destinationId;

    const results = await StockReturn.find(filter)
        .sort({ createdAt: -1 })
        .populate('sourceStoreId', 'name')
        .populate('destinationWarehouseId', 'name')
        .lean();
    await enrichReturnItems(results);
    return results;
};

const getReturnById = async (id) => {
    const doc = await StockReturn.findById(id)
        .populate('sourceStoreId', 'name')
        .populate('destinationWarehouseId', 'name')
        .lean();
    await enrichReturnItems(doc);
    return doc;
};

module.exports = {
    initiateReturn,
    receiveReturn,
    getReturns,
    getReturnById
};
