const accountingService = require('./accounting.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const createVoucher = async (req, res, next) => {
    try {
        const voucher = await accountingService.createVoucher(req.body, req.user._id);
        return sendSuccess(res, { voucher }, 'Accounting voucher created (DRAFT)');
    } catch (err) {
        next(err);
    }
};

const postVoucher = async (req, res, next) => {
    try {
        const voucher = await accountingService.postVoucher(req.params.id, req.user._id);
        return sendSuccess(res, { voucher }, 'Accounting voucher posted to General Ledger');
    } catch (err) {
        next(err);
    }
};

const getVouchers = async (req, res, next) => {
    try {
        const vouchers = await accountingService.getVouchers(req.query);
        return sendSuccess(res, { vouchers }, 'Accounting vouchers history retrieved');
    } catch (err) {
        next(err);
    }
};

const getVoucherById = async (req, res, next) => {
    try {
        const voucher = await accountingService.getVoucherById(req.params.id);
        return sendSuccess(res, { voucher }, 'Voucher details retrieved');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createVoucher,
    postVoucher,
    getVouchers,
    getVoucherById
};
