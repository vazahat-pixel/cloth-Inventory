const storeInventoryService = require('./storeInventory.service');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');

const getStoreInventory = async (req, res, next) => {
    try {
        const { inventory, total, page, limit } = await storeInventoryService.getStoreInventory(req.query, req.user);
        const meta = buildPaginationMeta(total, page, limit);
        return sendSuccess(res, { inventory, meta }, 'Store inventory retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getProductInStore = async (req, res, next) => {
    try {
        const { storeId } = req.query;
        if (!storeId) return sendError(res, 'storeId is required', 400);

        const item = await storeInventoryService.getProductInStore(storeId, req.params.productId);
        return sendSuccess(res, { item }, 'Product inventory details retrieved');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const adjustInventory = async (req, res, next) => {
    try {
        const result = await storeInventoryService.adjustInventory(req.body, req.user._id);
        return sendSuccess(res, result, 'Inventory adjusted successfully');
    } catch (err) {
        next(err);
    }
};

const inventoryService = require('../../services/inventory.service');

const reconcileStock = async (req, res, next) => {
    try {
        const { storeId, items } = req.body;
        if (!storeId || !items || !Array.isArray(items)) {
            return sendError(res, 'storeId and items array are required', 400);
        }
        const results = await inventoryService.reconcileStock(storeId, items, req.user._id);
        return sendSuccess(res, { results }, 'Stock reconciliation completed successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getStoreInventory,
    getProductInStore,
    adjustInventory,
    reconcileStock
};
