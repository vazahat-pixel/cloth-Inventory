const Account = require('../../models/account.model');

const createAccount = async (data) => {
    return await Account.create(data);
};

const getAllAccounts = async (query = {}) => {
    const filter = {};
    if (query.name) filter.name = new RegExp(query.name, 'i');
    if (query.group) filter.group = query.group;
    return await Account.find(filter).populate('groupId');
};

const getAccountById = async (id) => {
    return await Account.findById(id).populate('groupId');
};

const updateAccount = async (id, data) => {
    return await Account.findByIdAndUpdate(id, data, { new: true });
};

const deleteAccount = async (id) => {
    return await Account.findByIdAndDelete(id);
};

module.exports = {
    createAccount,
    getAllAccounts,
    getAccountById,
    updateAccount,
    deleteAccount
};
