const salesService = require('./sales.service');
const { validationResult } = require('express-validator');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');

const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, errors.array()[0].msg, 400);
    }
};

const getProductByBarcode = async (req, res, next) => {
    try {
        let { storeId } = req.query;

        // Store staff can only query their own store
        if (req.user.role === 'store_staff') {
            if (!req.user.shopId) {
                return sendError(res, 'User is not linked to any store. Please contact administrator.', 400);
            }
            storeId = req.user.shopId.toString();
        }

        if (!storeId) return sendError(res, 'storeId is required for stock check', 400);

        const product = await salesService.getProductForSale(req.params.barcode, storeId);
        return sendSuccess(res, { product }, 'Product scanner check successful');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const createSale = async (req, res, next) => {
    try {
        if (!req.body.products?.length && !req.body.items?.length) {
            return sendError(res, 'Cannot create invoice/sale with empty items', 400);
        }

        // Enforce store scoping for store staff
        if (req.user.role === 'store_staff') {
            if (!req.user.shopId) {
                return sendError(res, 'User is not linked to any store. Please contact administrator.', 400);
            }

            if (req.body.storeId && req.body.storeId.toString() !== req.user.shopId.toString()) {
                return sendError(res, 'You can only create sales for your own store.', 403);
            }

            req.body.storeId = req.user.shopId;
        }

        const error = validate(req, res);
        if (error) {
            console.error('Sale Validation Error:', error);
            return error;
        }

        const sale = await salesService.createSale(req.body, req.user._id);
        return sendCreated(res, { sale }, 'Sale completed successfully');
    } catch (err) {
        console.error('Sale Service Error:', err.message, err.stack);
        return sendError(res, err.message, 400);
    }
};

const getAllSales = async (req, res, next) => {
    try {
        const { sales, total, page, limit } = await salesService.getAllSales(req.query, req.user);
        const meta = buildPaginationMeta(total, page, limit);
        return sendSuccess(res, { sales, meta }, 'Sales history retrieved');
    } catch (err) {
        next(err);
    }
};

const getSaleById = async (req, res, next) => {
    try {
        const sale = await salesService.getSaleById(req.params.id, req.user);
        return sendSuccess(res, { sale }, 'Sale details retrieved');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const getSaleByNumber = async (req, res, next) => {
    try {
        const { saleNumber, storeId } = req.query;
        if (!saleNumber || !String(saleNumber).trim()) {
            return sendError(res, 'saleNumber is required', 400);
        }
        const sale = await salesService.getSaleByNumber(saleNumber, req.user, storeId || null);
        return sendSuccess(res, { sale }, 'Sale found');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const cancelSale = async (req, res, next) => {
    try {
        if (req.user.role === 'store_staff') {
            return sendError(res, 'Only Head Office can cancel sales.', 403);
        }
        const { reason } = req.body;
        if (!reason || !String(reason).trim()) {
            return sendError(res, 'Cancellation reason is required.', 400);
        }
        const sale = await salesService.cancelSale(req.params.id, req.user._id, String(reason).trim());
        return sendSuccess(res, { sale }, 'Sale cancelled successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const applyCreditNote = async (req, res, next) => {
    try {
        const { creditNoteId } = req.body;
        if (!creditNoteId) return sendError(res, 'creditNoteId is required', 400);
        const result = await salesService.applyCreditNote(req.params.id, creditNoteId, req.user._id);
        return sendSuccess(res, result, 'Credit note applied successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const deleteSale = async (req, res, next) => {
    try {
        if (req.user.role === 'store_staff') {
            return sendError(res, 'Only Head Office can delete sales.', 403);
        }
        const reason = req.body.reason || req.query.reason;
        if (!reason || !String(reason).trim()) {
            return sendError(res, 'Deletion reason is required.', 400);
        }
        const sale = await salesService.deleteSale(req.params.id, req.user._id, String(reason).trim());
        return sendSuccess(res, { sale }, 'Sale deleted successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const getNextInvoiceNumber = async (req, res, next) => {
    try {
        let storeId = req.query.storeId;
        if (req.user.role === 'store_staff') {
            if (!req.user.shopId) {
                return sendError(res, 'User is not linked to any store.', 400);
            }
            storeId = req.user.shopId.toString();
        }
        if (!storeId) {
            return sendError(res, 'storeId is required', 400);
        }
        const nextInvoiceNumber = await salesService.previewNextInvoiceNumber(storeId);
        return sendSuccess(res, { nextInvoiceNumber }, 'Next invoice number fetched successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const updateSale = async (req, res, next) => {
    try {
        if (req.user.role === 'store_staff') {
            return sendError(res, 'Only Head Office can edit sales.', 403);
        }
        if (!req.body.products?.length && !req.body.items?.length) {
            return sendError(res, 'Cannot update invoice/sale with empty items', 400);
        }

        const sale = await salesService.updateSale(req.params.id, req.body, req.user._id);
        return sendSuccess(res, { sale }, 'Sale updated successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

module.exports = {
    getProductByBarcode,
    createSale,
    updateSale,
    getAllSales,
    getSaleById,
    getSaleByNumber,
    cancelSale,
    applyCreditNote,
    deleteSale,
    getNextInvoiceNumber
};
