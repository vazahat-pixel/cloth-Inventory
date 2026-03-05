const voucherService = require('./voucher.service');
const { sendSuccess, sendCreated, sendError, sendNotFound } = require('../../utils/response.handler');

const createVoucher = async (req, res, next) => {
    try {
        const voucher = await voucherService.createVoucher(req.body, req.user._id);
        return sendCreated(res, { voucher }, 'Voucher issued successfully');
    } catch (err) {
        next(err);
    }
};

const getAllVouchers = async (req, res, next) => {
    try {
        const vouchers = await voucherService.getAllVouchers(req.query);
        return sendSuccess(res, { vouchers }, 'Vouchers retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getVoucherByNumber = async (req, res, next) => {
    try {
        const voucher = await voucherService.getVoucherByNumber(req.params.number);
        return sendSuccess(res, { voucher });
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const updateVoucher = async (req, res, next) => {
    try {
        const voucher = await voucherService.updateVoucher(req.params.id, req.body);
        if (!voucher) return sendNotFound(res, 'Voucher not found');
        return sendSuccess(res, { voucher }, 'Voucher updated successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createVoucher,
    getAllVouchers,
    getVoucherByNumber,
    updateVoucher
};
