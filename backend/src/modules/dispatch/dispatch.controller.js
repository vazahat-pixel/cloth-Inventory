const dispatchService = require('./dispatch.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const create = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'store_staff') return sendError(res, 'Access denied: Store staff can only receive dispatches.', 403);
        const { items, products } = req.body;
        const finalItems = items || products || [];
        if (!finalItems || finalItems.length === 0) {
            return sendError(res, 'Cannot create dispatch challan without items', 400);
        }
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
        const result = await dispatchService.getDispatches(req.query, req.user);
        return sendSuccess(res, result, 'Dispatches retrieved');
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
        if (req.user && req.user.role === 'store_staff') return sendError(res, 'Access denied: Store staff can only receive dispatches.', 403);
        const dispatch = await dispatchService.updateDispatch(req.params.id, req.body, req.user._id);
        return sendSuccess(res, { dispatch }, 'Dispatch updated successfully');
    } catch (error) {
        next(error);
    }
};

const confirm = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'store_staff') return sendError(res, 'Access denied: Store staff can only receive dispatches.', 403);
        const dispatch = await dispatchService.confirmDispatch(req.params.id, req.user._id);
        return sendSuccess(res, { dispatch }, 'Dispatch confirmed and stock deducted');
    } catch (error) {
        next(error);
    }
};

const pack = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'store_staff') return sendError(res, 'Access denied: Store staff can only receive dispatches.', 403);
        const dispatch = await dispatchService.packDispatch(req.params.id, req.user._id);
        return sendSuccess(res, { dispatch }, 'Challan marked as packed');
    } catch (error) {
        next(error);
    }
};

const cancel = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'store_staff') return sendError(res, 'Access denied: Store staff can only receive dispatches.', 403);
        const dispatch = await dispatchService.cancelDispatch(req.params.id, req.user._id);
        return sendSuccess(res, { dispatch }, 'Dispatch cancelled and stock released');
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'store_staff') return sendError(res, 'Access denied: Store staff can only receive dispatches.', 403);
        const result = await dispatchService.deleteDispatch(req.params.id, req.user._id);
        return sendSuccess(res, result, 'Dispatch deleted successfully');
    } catch (error) {
        next(error);
    }
};

const combineAndConfirm = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'store_staff') return sendError(res, 'Access denied: Store staff can only receive dispatches.', 403);
        const { dispatchIds, notes, date, vehicleNumber, driverName } = req.body;
        if (!Array.isArray(dispatchIds) || dispatchIds.length < 2) {
            return sendError(res, 'Please select at least two dispatches to combine', 400);
        }
        const dispatch = await dispatchService.combineAndConfirmDispatch({
            dispatchIds,
            notes,
            date,
            vehicleNumber,
            driverName
        }, req.user._id);
        return sendSuccess(res, { dispatch }, 'Combined dispatch confirmed and billing completed successfully');
    } catch (error) {
        if (error.message && (
            error.message.includes('stock') ||
            error.message.includes('Insufficient') ||
            error.message.includes('Dispatch record not found') ||
            error.message.includes('Only pending or packed') ||
            error.message.includes('same source') ||
            error.message.includes('same destination') ||
            error.message.includes('No items found')
        )) {
            error.statusCode = 400;
        }
        next(error);
    }
};

module.exports = {
    combineAndConfirm,
    create,
    update,
    receive,
    get,
    getById,
    pack,
    confirm,
    cancel,
    remove
};
