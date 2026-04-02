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

const receive = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dispatch = await dispatchService.receiveDispatch(id, req.user._id);
        return sendSuccess(res, { dispatch }, 'Stock received and inventory updated');
    } catch (error) {
        next(error);
    }
};

const get = async (req, res, next) => {
    try {
        const dispatches = await dispatchService.getDispatches(req.query, req.user);
        return sendSuccess(res, { dispatches }, 'Dispatches retrieved');
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const dispatch = await dispatchService.getDispatchById(req.params.id, req.user);
        return sendSuccess(res, { dispatch }, 'Dispatch details retrieved');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    receive,
    get,
    getById
};
