const creditNoteService = require('./creditNote.service');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response.handler');

const getAllCreditNotes = async (req, res, next) => {
    try {
        const result = await creditNoteService.getAllCreditNotes(req.query);
        return sendSuccess(res, result, 'Credit notes retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const createCreditNote = async (req, res, next) => {
    try {
        if (!req.body.customerId) return sendError(res, 'customerId is required', 400);
        if (!req.body.totalAmount || req.body.totalAmount <= 0) return sendError(res, 'totalAmount must be > 0', 400);
        const creditNote = await creditNoteService.createCreditNote(req.body, req.user._id);
        return sendCreated(res, { creditNote }, 'Credit note created successfully');
    } catch (err) {
        next(err);
    }
};

const updateCreditNote = async (req, res, next) => {
    try {
        const creditNote = await creditNoteService.updateCreditNote(req.params.id, req.body);
        return sendSuccess(res, { creditNote }, 'Credit note updated successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

module.exports = {
    getAllCreditNotes,
    createCreditNote,
    updateCreditNote
};
