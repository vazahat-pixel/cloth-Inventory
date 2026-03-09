const warehouseService = require('./warehouse.service');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');
const { validationResult } = require('express-validator');

const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        sendError(res, errors.array()[0].msg, 400);
        return true;
    }
    return false;
};

exports.createWarehouse = async (req, res, next) => {
    try {
        if (validate(req, res)) return;
        const warehouse = await warehouseService.createWarehouse(req.body, req.user._id);
        return sendSuccess(res, { warehouse }, 'Warehouse created successfully', 201);
    } catch (err) {
        if (err.message.includes('already exists')) {
            return sendError(res, err.message, 409);
        }
        next(err);
    }
};

exports.getAllWarehouses = async (req, res, next) => {
    try {
        const { warehouses, total, page, limit } = await warehouseService.getAllWarehouses(req.query);
        const meta = buildPaginationMeta(total, page, limit);
        return sendSuccess(res, { warehouses, meta }, 'Warehouses retrieved successfully');
    } catch (err) {
        next(err);
    }
};

exports.getWarehouseById = async (req, res, next) => {
    try {
        const warehouse = await warehouseService.getWarehouseById(req.params.id);
        return sendSuccess(res, { warehouse }, 'Warehouse details retrieved');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

exports.updateWarehouse = async (req, res, next) => {
    try {
        if (validate(req, res)) return;
        const warehouse = await warehouseService.updateWarehouse(req.params.id, req.body);
        return sendSuccess(res, { warehouse }, 'Warehouse updated successfully');
    } catch (err) {
        if (err.message === 'Warehouse not found or update failed') {
            return sendNotFound(res, err.message);
        }
        next(err);
    }
};

exports.toggleWarehouseStatus = async (req, res, next) => {
    try {
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return sendError(res, 'isActive status must be a boolean', 400);
        }
        const warehouse = await warehouseService.toggleWarehouseStatus(req.params.id, isActive);
        return sendSuccess(res, { warehouse }, `Warehouse ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
        if (err.message === 'Warehouse not found') {
            return sendNotFound(res, err.message);
        }
        next(err);
    }
};

exports.deleteWarehouse = async (req, res, next) => {
    try {
        await warehouseService.deleteWarehouse(req.params.id);
        return sendSuccess(res, null, 'Warehouse deleted successfully');
    } catch (err) {
        if (err.message.includes('not found')) {
            return sendNotFound(res, err.message);
        }
        next(err);
    }
};
