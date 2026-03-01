const productionService = require('./production.service');
const { validationResult } = require('express-validator');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');

const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, errors.array()[0].msg, 400);
    }
};

const createBatch = async (req, res, next) => {
    try {
        const error = validate(req, res);
        if (error) return error;

        const batch = await productionService.createBatch(req.body, req.user._id);
        return sendCreated(res, { batch }, 'Production batch created successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const getAllBatches = async (req, res, next) => {
    try {
        const { batches, total, page, limit } = await productionService.getAllBatches(req.query);
        const meta = buildPaginationMeta(total, page, limit);

        return sendSuccess(res, { batches, meta }, 'Production batches retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getBatchById = async (req, res, next) => {
    try {
        const batch = await productionService.getBatchById(req.params.id);
        return sendSuccess(res, { batch }, 'Batch details retrieved');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const updateStage = async (req, res, next) => {
    try {
        const error = validate(req, res);
        if (error) return error;

        const { stage, productMetadata } = req.body;
        const batch = await productionService.updateStage(req.params.id, stage, productMetadata);

        return sendSuccess(res, { batch }, `Production stage updated to ${stage}`);
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const deleteBatch = async (req, res, next) => {
    try {
        await productionService.deleteBatch(req.params.id);
        return sendSuccess(res, {}, 'Batch deleted successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

module.exports = {
    createBatch,
    getAllBatches,
    getBatchById,
    updateStage,
    deleteBatch
};
