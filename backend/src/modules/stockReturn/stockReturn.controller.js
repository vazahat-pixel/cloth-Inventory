const stockReturnService = require('./stockReturn.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const initiate = async (req, res, next) => {
    try {
        const payload = { ...req.body };
        // If store staff, enforce their shopId as source
        if (req.user.role === 'store_staff') {
            if (!req.user.shopId) throw new Error('User is not linked to any store.');
            payload.sourceStoreId = req.user.shopId;
        }
        
        if (!payload.sourceStoreId || !payload.destinationWarehouseId || !payload.items) {
           throw new Error('sourceStoreId, destinationWarehouseId and items are required');
        }

        const result = await stockReturnService.initiateReturn(payload, req.user._id);
        return sendSuccess(res, result, 'Stock Return initiated successfully');
    } catch (err) {
        next(err);
    }
};

const receive = async (req, res, next) => {
    try {
        const result = await stockReturnService.receiveReturn(req.params.id, req.user._id);
        return sendSuccess(res, result, 'Stock Return received successfully');
    } catch (err) {
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        const results = await stockReturnService.getReturns(req.query, req.user);
        return sendSuccess(res, results, 'Stock Returns fetched successfully');
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const result = await stockReturnService.getReturnById(req.params.id);
        return sendSuccess(res, result, 'Stock Return details fetched');
    } catch (err) {
        next(err);
    }
};

module.exports = { initiate, receive, getAll, getById };
