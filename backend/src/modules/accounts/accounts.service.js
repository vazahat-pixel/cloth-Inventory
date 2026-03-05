const BankTransaction = require('../../models/bankTransaction.model');

const createTransaction = async (data, userId) => {
    return await BankTransaction.create({ ...data, createdBy: userId });
};

const getTransactions = async (query = {}) => {
    return await BankTransaction.find(query)
        .populate('bankId')
        .populate('supplierId')
        .populate('customerId')
        .sort({ date: -1 });
};

module.exports = {
    createTransaction,
    getTransactions
};
