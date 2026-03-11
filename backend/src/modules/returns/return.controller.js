const returnService = require('./return.service');
const { validationResult } = require('express-validator');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');

const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, errors.array()[0].msg, 400);
    }
};

const processReturn = async (req, res, next) => {
    try {
        // Enforce store scoping for store staff on store-based returns
        if (req.user.role === 'store_staff') {
            if (!req.user.shopId) {
                return sendError(res, 'User is not linked to any store. Please contact administrator.', 400);
            }

            if (req.body.storeId && req.body.storeId.toString() !== req.user.shopId.toString()) {
                return sendError(res, 'You can only process returns for your own store.', 403);
            }

            // For customer and store-level returns, make sure storeId is set to the user’s store
            req.body.storeId = req.user.shopId;
        }

        const error = validate(req, res);
        if (error) return error;

        const record = await returnService.processReturn(req.body, req.user._id);
        return sendCreated(res, { return: record }, 'Return processed successfully and stock adjusted');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const getAllReturns = async (req, res, next) => {
    try {
        const { returns, total, page, limit } = await returnService.getAllReturns(req.query, req.user);
        const meta = buildPaginationMeta(total, page, limit);
        return sendSuccess(res, { returns, meta }, 'Return history retrieved');
    } catch (err) {
        next(err);
    }
};

const getReturnById = async (req, res, next) => {
    try {
        const record = await returnService.getReturnById(req.params.id);
        return sendSuccess(res, { return: record }, 'Return record details retrieved');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

module.exports = {
    processReturn,
    getAllReturns,
    getReturnById
};
