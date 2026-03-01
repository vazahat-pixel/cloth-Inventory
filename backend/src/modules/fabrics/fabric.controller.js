const fabricService = require('./fabric.service');
const { validationResult } = require('express-validator');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');

const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, errors.array()[0].msg, 400);
    }
};

const createFabric = async (req, res, next) => {
    try {
        const error = validate(req, res);
        if (error) return error;

        const fabric = await fabricService.createFabric(req.body, req.user._id);
        return sendCreated(res, { fabric }, 'Fabric purchase created successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const getAllFabrics = async (req, res, next) => {
    try {
        const { fabrics, total, page, limit } = await fabricService.getAllFabrics(req.query);
        const meta = buildPaginationMeta(total, page, limit);

        return sendSuccess(res, { fabrics, meta }, 'Fabrics retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getFabricById = async (req, res, next) => {
    try {
        const fabric = await fabricService.getFabricById(req.params.id);
        return sendSuccess(res, { fabric }, 'Fabric retrieved successfully');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const updateFabric = async (req, res, next) => {
    try {
        const error = validate(req, res);
        if (error) return error;

        const fabric = await fabricService.updateFabric(req.params.id, req.body);
        return sendSuccess(res, { fabric }, 'Fabric updated successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const updateFabricStatus = async (req, res, next) => {
    try {
        const fabric = await fabricService.updateFabricStatus(req.params.id, req.body);
        return sendSuccess(res, { fabric }, 'Fabric status updated successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const deleteFabric = async (req, res, next) => {
    try {
        await fabricService.deleteFabric(req.params.id);
        return sendSuccess(res, {}, 'Fabric record deleted successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

module.exports = {
    createFabric,
    getAllFabrics,
    getFabricById,
    updateFabric,
    updateFabricStatus,
    deleteFabric
};
