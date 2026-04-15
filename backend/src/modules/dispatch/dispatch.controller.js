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
        const { receivedItems } = req.body;
        const dispatch = await dispatchService.receiveDispatch(id, req.user._id, receivedItems);
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

const update = async (req, res, next) => {
    try {
        const dispatch = await dispatchService.updateDispatch(req.params.id, req.body, req.user._id);
        return sendSuccess(res, { dispatch }, 'Dispatch updated successfully');
    } catch (error) {
        next(error);
    }
};

const confirm = async (req, res, next) => {
    try {
        const dispatch = await dispatchService.confirmDispatch(req.params.id, req.user._id);
        return sendSuccess(res, { dispatch }, 'Dispatch confirmed and stock deducted');
    } catch (error) {
        next(error);
    }
};

const pack = async (req, res, next) => {
    try {
        const dispatch = await dispatchService.packDispatch(req.params.id, req.user._id);
        return sendSuccess(res, { dispatch }, 'Challan marked as packed');
    } catch (error) {
        next(error);
    }
};

const cancel = async (req, res, next) => {
    try {
        const dispatch = await dispatchService.cancelDispatch(req.params.id, req.user._id);
        return sendSuccess(res, { dispatch }, 'Dispatch cancelled and stock released');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    update,
    receive,
    get,
    getById,
    pack,
    confirm,
    cancel
};
