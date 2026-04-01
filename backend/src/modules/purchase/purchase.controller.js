const purchaseService = require('./purchase.service');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response.handler');

const createPurchase = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const purchase = await purchaseService.createPurchase(req.body, userId);
        return sendCreated(res, { purchase }, 'Purchase record created successfully');
    } catch (err) {
        next(err);
    }
};

const cancelPurchase = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const purchaseId = req.params.id;
        const purchase = await purchaseService.cancelPurchase(purchaseId, userId);
        return sendSuccess(res, { purchase }, 'Purchase record cancelled successfully');
    } catch (err) {
        next(err);
    }
};

const getAllPurchases = async (req, res, next) => {
    try {
        const query = { ...req.query };
        if (req.user.role === 'store_staff') {
            query.storeId = req.user.shopId;
        }
        const result = await purchaseService.getAllPurchases(query);
        return sendSuccess(res, result, 'Purchases retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getPurchaseById = async (req, res, next) => {
    try {
        const purchase = await purchaseService.getPurchaseById(req.params.id);
        return sendSuccess(res, { purchase }, 'Purchase details retrieved');
    } catch (err) {
        next(err);
    }
};

const updatePurchase = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const purchaseId = req.params.id;
        const purchase = await purchaseService.updatePurchase(purchaseId, req.body, userId);
        return sendSuccess(res, { purchase }, 'Purchase record updated successfully');
    } catch (err) {
        next(err);
    }
};

const postVoucher = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const purchaseId = req.params.id;
        const purchase = await purchaseService.postVoucher(purchaseId, userId);
        return sendSuccess(res, { purchase }, 'Voucher posted and ledgers updated successfully');
    } catch (err) {
        next(err);
    }
};

const purchaseReturnService = require('./purchaseReturn.service');

const createPurchaseReturn = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const purchaseReturn = await purchaseReturnService.createPurchaseReturn(req.body, userId);
        return sendCreated(res, { purchaseReturn }, 'Purchase return processed and Debit Note generated');
    } catch (err) {
        next(err);
    }
};

const getAllPurchaseReturns = async (req, res, next) => {
    try {
        const returns = await require('../../models/purchaseReturn.model').find()
            .sort({ createdAt: -1 })
            .populate('supplierId', 'supplierName name');
        return sendSuccess(res, { returns }, 'Purchase returns retrieved successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createPurchase,
    updatePurchase,
    cancelPurchase,
    getAllPurchases,
    getPurchaseById,
    postVoucher,
    createPurchaseReturn,
    getAllPurchaseReturns
};
