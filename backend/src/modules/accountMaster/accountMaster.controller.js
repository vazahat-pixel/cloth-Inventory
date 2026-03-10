const accountMasterService = require("./accountMaster.service");
const { sendSuccess, sendError } = require("../../utils/response.handler");

const createAccount = async (req, res, next) => {
    try {
        const account = await accountMasterService.createAccount(req.body);
        return sendSuccess(res, { account }, "Account created successfully", 201);
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const getAllAccounts = async (req, res, next) => {
    try {
        const accounts = await accountMasterService.getAllAccounts(req.query);
        return sendSuccess(res, { accounts }, "Accounts retrieved");
    } catch (err) {
        next(err);
    }
};

const getAccountById = async (req, res, next) => {
    try {
        const account = await accountMasterService.getAccountById(req.params.id);
        return sendSuccess(res, { account }, "Account details retrieved");
    } catch (err) {
        next(err);
    }
};

const updateAccount = async (req, res, next) => {
    try {
        const account = await accountMasterService.updateAccount(req.params.id, req.body);
        return sendSuccess(res, { account }, "Account updated");
    } catch (err) {
        next(err);
    }
};

const deleteAccount = async (req, res, next) => {
    try {
        await accountMasterService.deleteAccount(req.params.id);
        return sendSuccess(res, {}, "Account deleted");
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createAccount,
    getAllAccounts,
    getAccountById,
    updateAccount,
    deleteAccount
};
