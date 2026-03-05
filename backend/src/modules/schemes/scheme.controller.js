const schemeService = require('./scheme.service');
const { sendSuccess, sendCreated, sendError, sendNotFound } = require('../../utils/response.handler');

const createScheme = async (req, res, next) => {
    try {
        const scheme = await schemeService.createScheme(req.body, req.user._id);
        return sendCreated(res, { scheme }, 'Scheme created successfully');
    } catch (err) {
        next(err);
    }
};

const getAllSchemes = async (req, res, next) => {
    try {
        const schemes = await schemeService.getAllSchemes(req.query);
        return sendSuccess(res, { schemes }, 'Schemes retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getSchemeById = async (req, res, next) => {
    try {
        const scheme = await schemeService.getSchemeById(req.params.id);
        if (!scheme) return sendNotFound(res, 'Scheme not found');
        return sendSuccess(res, { scheme });
    } catch (err) {
        next(err);
    }
};

const updateScheme = async (req, res, next) => {
    try {
        const scheme = await schemeService.updateScheme(req.params.id, req.body);
        if (!scheme) return sendNotFound(res, 'Scheme not found');
        return sendSuccess(res, { scheme }, 'Scheme updated successfully');
    } catch (err) {
        next(err);
    }
};

const deleteScheme = async (req, res, next) => {
    try {
        const scheme = await schemeService.deleteScheme(req.params.id);
        if (!scheme) return sendNotFound(res, 'Scheme not found');
        return sendSuccess(res, {}, 'Scheme deleted successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createScheme,
    getAllSchemes,
    getSchemeById,
    updateScheme,
    deleteScheme
};
