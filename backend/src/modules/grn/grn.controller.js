const grnService = require('./grn.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * POST /grn -> createGRN
 */
const create = async (req, res, next) => {
    try {
        const grn = await grnService.createGRN(req.body, req.user._id);
        sendSuccess(res, 'GRN created successfully', grn, 201);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /grn/:id -> getGRNById
 */
const getById = async (req, res, next) => {
    try {
        const grn = await grnService.getGRNById(req.params.id);
        sendSuccess(res, 'GRN fetched successfully', grn);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    create,
    getById
};
