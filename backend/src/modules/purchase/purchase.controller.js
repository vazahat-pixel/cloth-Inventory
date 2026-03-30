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

const approveGRN = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const purchaseId = req.params.id;
        const purchase = await purchaseService.approveGRN(purchaseId, userId);
        return sendSuccess(res, { purchase }, 'GRN approved and stock updated successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createPurchase,
    cancelPurchase,
    getAllPurchases,
    getPurchaseById,
    approveGRN
};
