const documentService = require('./document.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * POST /documents -> create
 */
const create = async (req, res, next) => {
    try {
        const doc = await documentService.createDocument(req.body, req.user._id);
        sendSuccess(res, 'Document created successfully', doc, 201);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /documents -> list (with filter/pagination)
 */
const list = async (req, res, next) => {
    try {
        const result = await documentService.getAllDocuments(req.query);
        sendSuccess(res, 'Documents fetched successfully', result);
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /documents/:id/approve -> approve
 */
const approve = async (req, res, next) => {
    try {
        const doc = await documentService.approveDocument(req.params.id, req.user._id);
        sendSuccess(res, 'Document approved successfully', doc);
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /documents/:id/reject -> reject
 */
const reject = async (req, res, next) => {
    try {
        const doc = await documentService.rejectDocument(req.params.id, req.user._id);
        sendSuccess(res, 'Document rejected successfully', doc);
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
