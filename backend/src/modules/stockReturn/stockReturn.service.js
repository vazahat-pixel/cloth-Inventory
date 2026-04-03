const StockReturn = require('../../models/stockReturn.model');
const { DispatchStatus, StockMovementType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { removeStock, addStock, addInTransit, removeInTransit } = require('../../services/stock.service');
const { getNextSequence } = require('../../services/sequence.service');

const generateReturnNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const seq = await getNextSequence(`STOCK_RETURN_${year}`, session);
    return `STRT-${year}-${seq.toString().padStart(5, '0')}`;
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

const getReturns = async (query = {}, user = null) => {
    const filter = {};
    if (user && user.role === 'store_staff') {
        filter.sourceStoreId = user.shopId;
    }
    
    if (query.status) filter.status = query.status;
    if (query.sourceId) filter.sourceStoreId = query.sourceId;
    if (query.destinationId) filter.destinationWarehouseId = query.destinationId;

    return await StockReturn.find(filter)
        .sort({ createdAt: -1 })
        .populate('sourceStoreId', 'name')
        .populate('destinationWarehouseId', 'name')
        .populate('items.variantId', 'name sku barcode');
};

const getReturnById = async (id) => {
    return await StockReturn.findById(id)
        .populate('sourceStoreId')
        .populate('destinationWarehouseId')
        .populate('items.variantId', 'name sku barcode');
};

module.exports = {
    initiateReturn,
    receiveReturn,
    getReturns,
    getReturnById
};
