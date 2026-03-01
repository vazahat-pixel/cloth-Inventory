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
        const { returns, total, page, limit } = await returnService.getAllReturns(req.query);
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
