const storeInventoryService = require('./storeInventory.service');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');

const getStoreInventory = async (req, res, next) => {
    try {
        const { inventory, total, totalQuantity, page, limit } = await storeInventoryService.getStoreInventory(req.query, req.user);
        const meta = buildPaginationMeta(total, page, limit);
        return sendSuccess(res, { inventory, meta, totalQuantity }, 'Store inventory retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getProductInStore = async (req, res, next) => {
    try {
        let { storeId } = req.query;

        // Enforce store scoping for store staff
        if (req.user.role === 'store_staff') {
            if (!req.user.shopId) {
                return sendError(res, 'User is not linked to any store. Please contact administrator.', 400);
            }
            storeId = req.user.shopId.toString();
        }

        if (!storeId) return sendError(res, 'storeId is required', 400);

        const item = await storeInventoryService.getProductInStore(storeId, req.params.productId);
        return sendSuccess(res, { item }, 'Product inventory details retrieved');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const adjustInventory = async (req, res, next) => {
    try {
        const payload = { ...req.body };

        // Store staff can only adjust their own store inventory
        if (req.user.role === 'store_staff') {
            if (!req.user.shopId) {
                return sendError(res, 'User is not linked to any store. Please contact administrator.', 400);
            }
            if (payload.storeId && payload.storeId.toString() !== req.user.shopId.toString()) {
                return sendError(res, 'You can only adjust inventory for your own store.', 403);
            }
            payload.storeId = req.user.shopId;
        }

        const result = await storeInventoryService.adjustInventory(payload, req.user._id);
        return sendSuccess(res, result, 'Inventory adjusted successfully');
    } catch (err) {
        next(err);
    }
};

const inventoryService = require('../../services/inventory.service');

const reconcileStock = async (req, res, next) => {
    try {
        let { storeId, items } = req.body;

        // Store staff can only reconcile their own store
        if (req.user.role === 'store_staff') {
            if (!req.user.shopId) {
                return sendError(res, 'User is not linked to any store. Please contact administrator.', 400);
            }
            if (storeId && storeId.toString() !== req.user.shopId.toString()) {
                return sendError(res, 'You can only reconcile stock for your own store.', 403);
            }
            storeId = req.user.shopId;
        }

        if (!storeId || !items || !Array.isArray(items)) {
            return sendError(res, 'storeId and items array are required', 400);
        }
        const results = await inventoryService.reconcileStock(storeId, items, req.user._id);
        return sendSuccess(res, { results }, 'Stock reconciliation completed successfully');
    } catch (err) {
        next(err);
    }
};

const bulkImportOpeningStock = async (req, res, next) => {
    try {
        const result = await storeInventoryService.bulkImportOpeningStock(req.body, req.user._id);
        return sendSuccess(res, { data: result }, 'Bulk import completed');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getStoreInventory,
    getProductInStore,
    adjustInventory,
    reconcileStock,
    bulkImportOpeningStock
};
