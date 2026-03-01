const dispatchService = require('./dispatch.service');
const { validationResult } = require('express-validator');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');

const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, errors.array()[0].msg, 400);
    }
};

const createDispatch = async (req, res, next) => {
    try {
        const error = validate(req, res);
        if (error) return error;

        const dispatch = await dispatchService.createDispatch(req.body, req.user._id);
        return sendCreated(res, { dispatch }, 'Dispatch created and factory stock reduced');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const getAllDispatches = async (req, res, next) => {
    try {
        const { dispatches, total, page, limit } = await dispatchService.getAllDispatches(req.query);
        const meta = buildPaginationMeta(total, page, limit);
        return sendSuccess(res, { dispatches, meta }, 'Dispatches retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getDispatchById = async (req, res, next) => {
    try {
        const dispatch = await dispatchService.getDispatchById(req.params.id);
        return sendSuccess(res, { dispatch }, 'Dispatch details retrieved');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const error = validate(req, res);
        if (error) return error;

        const { status } = req.body;
        const dispatch = await dispatchService.updateStatus(req.params.id, status, req.user._id);

        const message = status === 'RECEIVED'
            ? 'Dispatch received: Store inventory updated'
            : `Dispatch status updated to ${status}`;

        return sendSuccess(res, { dispatch }, message);
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const deleteDispatch = async (req, res, next) => {
    try {
        await dispatchService.deleteDispatch(req.params.id, req.user._id);
        return sendSuccess(res, {}, 'Dispatch deleted and stock restored successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

module.exports = {
    createDispatch,
    getAllDispatches,
    getDispatchById,
    updateStatus,
    deleteDispatch
};
