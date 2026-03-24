const dispatchService = require('./dispatch.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * Handle POST /dispatch
 */
const create = async (req, res, next) => {
    try {
        const dispatch = await dispatchService.createDispatch(req.body, req.user._id);
        return sendSuccess(res, { dispatch }, 'Dispatch created successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Handle PUT /dispatch/:id/complete
 */
const complete = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dispatch = await dispatchService.completeDispatch(id, req.user._id);
        return sendSuccess(res, { dispatch }, 'Dispatch completed and stock transferred');
    } catch (error) {
        next(error);
    }
};

/**
 * List all dispatches
 */
const getAll = async (req, res, next) => {
    try {
        const dispatches = await dispatchService.getAllDispatches(req.query);
        return sendSuccess(res, { dispatches }, 'Dispatches retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get dispatch by ID
 */
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dispatch = await dispatchService.getDispatchById(id);
        return sendSuccess(res, { dispatch }, 'Dispatch details retrieved');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    complete,
    getAll,
    getById
};
