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

module.exports = {
    getStoreInventory,
    getProductInStore
};
