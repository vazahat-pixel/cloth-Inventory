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

const getHomeStockStats = async (req, res, next) => {
    try {
        const stats = await storeInventoryService.getHomeStockStats(req.user, req.query);
        return sendSuccess(res, stats, 'Home stock stats retrieved successfully');
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
        const payload = { ...req.body };
        const role = (req.user.role || '').toLowerCase();
        if (role.includes('staff') || role.includes('manager') || role.includes('accountant')) {
            if (!req.user.shopId) {
                return sendError(res, 'User is not linked to any store. Please contact administrator.', 400);
            }
            payload.storeId = req.user.shopId.toString();
        }
        const result = await storeInventoryService.bulkImportOpeningStock(payload, req.user._id);
        return sendSuccess(res, { data: result }, 'Bulk import completed');
    } catch (err) {
        next(err);
    }
};

const clearStoreInventory = async (req, res, next) => {
    try {
        let storeId = req.body.storeId || req.query.storeId;

        // Store staff can only clear their own store
        const role = (req.user.role || '').toLowerCase();
        if (role.includes('staff') || role.includes('manager') || role.includes('accountant')) {
            if (!req.user.shopId) {
                return sendError(res, 'User is not linked to any store. Please contact administrator.', 400);
            }
            storeId = req.user.shopId.toString();
        }

        if (!storeId) {
            return sendError(res, 'storeId is required', 400);
        }

        const result = await storeInventoryService.clearStoreInventory(storeId, req.user._id);
        return sendSuccess(res, result, 'Store inventory cleared successfully');
    } catch (err) {
        next(err);
    }
};

const clearWarehouseInventory = async (req, res, next) => {
    try {
        const warehouseId = req.body.warehouseId || req.query.warehouseId;

        // Ensure user is an admin or head office role, not a store staff
        const role = (req.user.role || '').toLowerCase();
        if (role.includes('staff') || role.includes('manager') || role.includes('accountant')) {
             return sendError(res, 'Only Head Office or Admin can clear warehouse inventory.', 403);
        }

        if (!warehouseId) {
            return sendError(res, 'warehouseId is required', 400);
        }

        const result = await storeInventoryService.clearWarehouseInventory(warehouseId, req.user._id);
        return sendSuccess(res, result, 'Warehouse inventory cleared successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getStoreInventory,
    getHomeStockStats,
    getProductInStore,
    adjustInventory,
    reconcileStock,
    bulkImportOpeningStock,
    clearStoreInventory,
    clearWarehouseInventory
};

