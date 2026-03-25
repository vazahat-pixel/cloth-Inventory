const returnService = require('./return.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const purchaseReturn = async (req, res, next) => {
    try {
        const result = await returnService.createPurchaseReturn(req.body, req.user._id);
        return sendSuccess(res, { return: result }, 'Purchase return processed successfully');
    } catch (error) {
        next(error);
    }
};

const salesReturn = async (req, res, next) => {
    try {
        const result = await returnService.createSalesReturn(req.body, req.user._id);
        return sendSuccess(res, { return: result }, 'Sales return processed successfully');
    } catch (error) {
        next(error);
    }
};

const getReturns = async (req, res, next) => {
    try {
        const result = await returnService.getReturns(req.query);
        return sendSuccess(res, result, 'Returns history retrieved');
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const result = await returnService.getReturnById(req.params.id);
        return sendSuccess(res, { return: result }, 'Return record details retrieved');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    purchaseReturn,
    salesReturn,
    getReturns,
    getById
};
