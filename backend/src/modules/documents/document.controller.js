const documentService = require('./document.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * POST /documents -> Create Document
 */
const create = async (req, res, next) => {
    try {
        const doc = await documentService.createDocument(req.body, req.user._id);
        return sendSuccess(res, { document: doc }, 'Document created successfully');
    } catch (err) {
        next(err);
    }
};

/**
 * GET /documents -> Search and Filter Documents
 * Requirements: type, status, search (documentNumber/supplier/customer), pagination
 */
const list = async (req, res, next) => {
    try {
        const { pageNum, limitVal } = req.query;
        // Map page & limit for consistency
        const queryParams = {
            ...req.query,
            page: parseInt(pageNum || req.query.page) || 1,
            limit: parseInt(limitVal || req.query.limit) || 10
        };

        const result = await documentService.getAllDocuments(queryParams);
        return sendSuccess(res, result, 'Documents fetched successfully');
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /documents/:id/approve
 */
const approve = async (req, res, next) => {
    try {
        const doc = await documentService.approveDocument(req.params.id, req.user._id);
        return sendSuccess(res, { document: doc }, 'Document approved successfully');
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /documents/:id/reject
 */
const reject = async (req, res, next) => {
    try {
        const doc = await documentService.rejectDocument(req.params.id, req.user._id);
        return sendSuccess(res, { document: doc }, 'Document rejected successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    create,
    list,
    approve,
    reject
};
