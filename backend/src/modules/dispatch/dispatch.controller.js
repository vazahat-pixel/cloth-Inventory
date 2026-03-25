const dispatchService = require('./dispatch.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const create = async (req, res, next) => {
    try {
        const dispatch = await dispatchService.createDispatch(req.body, req.user._id);
        return sendSuccess(res, { dispatch }, 'Dispatch created successfully');
    } catch (error) {
        next(error);
    }
};

const complete = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dispatch = await dispatchService.completeDispatch(id, req.user._id);
        return sendSuccess(res, { dispatch }, 'Dispatch completed and stock transferred');
    } catch (error) {
        next(error);
    }
};

const get = async (req, res, next) => {
    try {
        const dispatches = await dispatchService.getDispatches(req.query);
        return sendSuccess(res, { dispatches }, 'Dispatches retrieved');
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const dispatch = await dispatchService.getDispatchById(req.params.id);
        return sendSuccess(res, { dispatch }, 'Dispatch details retrieved');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    complete,
    get,
    getById
};
