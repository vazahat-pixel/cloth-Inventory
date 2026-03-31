const poService = require('./purchaseOrder.service');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response.handler');

const createPO = async (req, res, next) => {
    try {
        const po = await poService.createPO(req.body, req.user._id);
        return sendCreated(res, { po }, 'Purchase Order created successfully');
    } catch (err) {
        next(err);
    }
};

const createPOFromVoucher = async (req, res, next) => {
    try {
        const po = await poService.createPOFromPurchase(req.params.voucherId, req.user._id);
        return sendCreated(res, { po }, 'Purchase Order generated from voucher successfully');
    } catch (err) {
        next(err);
    }
};

const getAllPOs = async (req, res, next) => {
    try {
        const result = await poService.getAllPOs(req.query);
        return sendSuccess(res, result, 'Purchase Orders retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getPOById = async (req, res, next) => {
    try {
        const po = await poService.getPOById(req.params.id);
        return sendSuccess(res, { po }, 'Purchase Order details retrieved');
    } catch (err) {
        next(err);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const po = await poService.updateStatus(req.params.id, req.body.status, req.user._id);
        return sendSuccess(res, { po }, `PO status updated to ${req.body.status}`);
    } catch (err) {
        next(err);
    }
};

const updatePO = async (req, res, next) => {
    try {
        const po = await poService.updatePO(req.params.id, req.body, req.user._id);
        return sendSuccess(res, { po }, 'Purchase Order updated successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createPO,
    createPOFromVoucher,
    getAllPOs,
    getPOById,
    updateStatus,
    updatePO
};
