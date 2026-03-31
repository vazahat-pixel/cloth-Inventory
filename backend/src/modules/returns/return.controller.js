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

const createReturn = async (req, res, next) => {
    try {
        const { type } = req.body;
        if (type === 'PURCHASE_RETURN' || type === 'STORE_TO_FACTORY') {
            return await purchaseReturn(req, res, next);
        } else if (type === 'SALES_RETURN' || type === 'CUSTOMER_TO_STORE') {
            return await salesReturn(req, res, next);
        } else {
            return sendError(res, 'Invalid or missing return type', 400);
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createReturn,
    purchaseReturn,
    salesReturn,
    getReturns,
    getById
};
