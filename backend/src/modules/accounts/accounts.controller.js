const accountsService = require('./accounts.service');
const { sendSuccess, sendCreated } = require('../../utils/response.handler');

const createBankPayment = async (req, res, next) => {
    try {
        const transaction = await accountsService.createTransaction({ ...req.body, type: 'PAYMENT' }, req.user._id);
        return sendCreated(res, transaction, 'Bank payment recorded');
    } catch (err) {
        next(err);
    }
};

const createBankReceipt = async (req, res, next) => {
    try {
        const transaction = await accountsService.createTransaction({ ...req.body, type: 'RECEIPT' }, req.user._id);
        return sendCreated(res, transaction, 'Bank receipt recorded');
    } catch (err) {
        next(err);
    }
};

const getBankPayments = async (req, res, next) => {
    try {
        const payments = await accountsService.getTransactions({ type: 'PAYMENT' });
        return sendSuccess(res, { payments });
    } catch (err) {
        next(err);
    }
};

const getBankReceipts = async (req, res, next) => {
    try {
        const receipts = await accountsService.getTransactions({ type: 'RECEIPT' });
        return sendSuccess(res, { receipts });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createBankPayment,
    createBankReceipt,
    getBankPayments,
    getBankReceipts
};
