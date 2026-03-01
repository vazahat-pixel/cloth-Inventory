const supplierService = require('./supplier.service');
const { validationResult } = require('express-validator');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');

const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, errors.array()[0].msg, 400);
    }
};

const createSupplier = async (req, res, next) => {
    try {
        const error = validate(req, res);
        if (error) return error;

        const supplier = await supplierService.createSupplier(req.body, req.user._id);
        return sendCreated(res, { supplier }, 'Supplier created successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const getAllSuppliers = async (req, res, next) => {
    try {
        const { suppliers, total, page, limit } = await supplierService.getAllSuppliers(req.query);
        const meta = buildPaginationMeta(total, page, limit);

        return sendSuccess(res, { suppliers, meta }, 'Suppliers retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getSupplierById = async (req, res, next) => {
    try {
        const supplier = await supplierService.getSupplierById(req.params.id);
        return sendSuccess(res, { supplier }, 'Supplier retrieved successfully');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const updateSupplier = async (req, res, next) => {
    try {
        const error = validate(req, res);
        if (error) return error;

        const supplier = await supplierService.updateSupplier(req.params.id, req.body);
        return sendSuccess(res, { supplier }, 'Supplier updated successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const deleteSupplier = async (req, res, next) => {
    try {
        await supplierService.deleteSupplier(req.params.id);
        return sendSuccess(res, {}, 'Supplier deleted successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

module.exports = {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
