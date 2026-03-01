const storeService = require('./store.service');
const { validationResult } = require('express-validator');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');

/**
 * Handle validation errors
 */
const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, errors.array()[0].msg, 400);
    }
};

/**
 * @desc    Create a new store
 * @route   POST /api/stores
 * @access  Private (Admin Only)
 */
const createStore = async (req, res, next) => {
    try {
        const error = validate(req, res);
        if (error) return error;

        const store = await storeService.createStore(req.body, req.user._id);
        return sendCreated(res, { store }, 'Store created successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

/**
 * @desc    Get all stores with filters & pagination
 * @route   GET /api/stores
 * @access  Private (Admin Only)
 */
const getAllStores = async (req, res, next) => {
    try {
        const { stores, total, page, limit } = await storeService.getAllStores(req.query);
        const meta = buildPaginationMeta(total, page, limit);

        return sendSuccess(res, { stores, meta }, 'Stores retrieved successfully');
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get single store by ID
 * @route   GET /api/stores/:id
 * @access  Private (Admin Only)
 */
const getStoreById = async (req, res, next) => {
    try {
        const store = await storeService.getStoreById(req.params.id);
        return sendSuccess(res, { store }, 'Store retrieved successfully');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

/**
 * @desc    Update store details
 * @route   PATCH /api/stores/:id
 * @access  Private (Admin Only)
 */
const updateStore = async (req, res, next) => {
    try {
        const error = validate(req, res);
        if (error) return error;

        const store = await storeService.updateStore(req.params.id, req.body);
        return sendSuccess(res, { store }, 'Store updated successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

/**
 * @desc    Toggle store active status
 * @route   PATCH /api/stores/:id/status
 * @access  Private (Admin Only)
 */
const toggleStoreStatus = async (req, res, next) => {
    try {
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return sendError(res, 'isActive status must be a boolean', 400);
        }

        const store = await storeService.toggleStoreStatus(req.params.id, isActive);
        return sendSuccess(res, { store }, `Store ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

/**
 * @desc    Soft delete a store
 * @route   DELETE /api/stores/:id
 * @access  Private (Admin Only)
 */
const deleteStore = async (req, res, next) => {
    try {
        await storeService.deleteStore(req.params.id);
        return sendSuccess(res, {}, 'Store deleted successfully (soft delete)');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

module.exports = {
    createStore,
    getAllStores,
    getStoreById,
    updateStore,
    toggleStoreStatus,
    deleteStore
};
