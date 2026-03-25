const grnService = require('./grn.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const create = async (req, res, next) => {
    try {
        const grn = await grnService.createGRN(req.body, req.user._id);
        return sendSuccess(res, { grn }, 'GRN created successfully');
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const grn = await grnService.getGRNById(req.params.id);
        return sendSuccess(res, { grn }, 'GRN fetched successfully');
    } catch (err) {
        next(err);
    }
};

const getByPurchase = async (req, res, next) => {
    try {
        const grns = await grnService.getGrnsByPurchase(req.params.purchaseId);
        return sendSuccess(res, { grns }, 'GRN history for this purchase retrieved');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    create,
    getById,
    getByPurchase
};
