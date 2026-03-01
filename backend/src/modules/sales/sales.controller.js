const salesService = require('./sales.service');
const { validationResult } = require('express-validator');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');

const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, errors.array()[0].msg, 400);
    }
};

const getProductByBarcode = async (req, res, next) => {
    try {
        const { storeId } = req.query;
        if (!storeId) return sendError(res, 'storeId is required for stock check', 400);

        const product = await salesService.getProductForSale(req.params.barcode, storeId);
        return sendSuccess(res, { product }, 'Product scanner check successful');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const createSale = async (req, res, next) => {
    try {
        const error = validate(req, res);
        if (error) return error;

        const sale = await salesService.createSale(req.body, req.user._id);
        return sendCreated(res, { sale }, 'Sale completed successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const getAllSales = async (req, res, next) => {
    try {
        const { sales, total, page, limit } = await salesService.getAllSales(req.query, req.user);
        const meta = buildPaginationMeta(total, page, limit);
        return sendSuccess(res, { sales, meta }, 'Sales history retrieved');
    } catch (err) {
        next(err);
    }
};

const getSaleById = async (req, res, next) => {
    try {
        const sale = await salesService.getSaleById(req.params.id);
        return sendSuccess(res, { sale }, 'Sale details retrieved');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const cancelSale = async (req, res, next) => {
    try {
        const sale = await salesService.cancelSale(req.params.id, req.user._id);
        return sendSuccess(res, { sale }, 'Sale cancelled successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

module.exports = {
    getProductByBarcode,
    createSale,
    getAllSales,
    getSaleById,
    cancelSale
};
