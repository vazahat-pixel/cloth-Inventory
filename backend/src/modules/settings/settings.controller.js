const settingsService = require('./settings.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const getCompanyProfile = async (req, res, next) => {
    try {
        const company = await settingsService.getCompanyProfile();
        return sendSuccess(res, { company }, 'Company profile retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const updateCompanyProfile = async (req, res, next) => {
    try {
        const company = await settingsService.updateCompanyProfile(req.body, req.user._id);
        return sendSuccess(res, { company }, 'Company profile updated successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

// ROLES
const getRoles = async (req, res, next) => {
    try {
        const roles = await settingsService.getSetting('roles', []);
        return sendSuccess(res, { roles });
    } catch (err) { next(err); }
};

const addRole = async (req, res, next) => {
    try {
        const role = await settingsService.addToCollection('roles', req.body, req.user._id);
        return sendSuccess(res, { role }, 'Role added');
    } catch (err) { next(err); }
};

const updateRole = async (req, res, next) => {
    try {
        const role = await settingsService.updateInCollection('roles', req.params.id, req.body, req.user._id);
        return sendSuccess(res, { role }, 'Role updated');
    } catch (err) { next(err); }
};

// NUMBER SERIES
const getNumberSeries = async (req, res, next) => {
    try {
        const numberSeries = await settingsService.getSetting('number-series', []);
        return sendSuccess(res, { numberSeries });
    } catch (err) { next(err); }
};

const addNumberSeries = async (req, res, next) => {
    try {
        const ns = await settingsService.addToCollection('number-series', req.body, req.user._id);
        return sendSuccess(res, { numberSeries: ns });
    } catch (err) { next(err); }
};

const updateNumberSeries = async (req, res, next) => {
    try {
        const ns = await settingsService.updateInCollection('number-series', req.params.id, req.body, req.user._id);
        return sendSuccess(res, { numberSeries: ns });
    } catch (err) { next(err); }
};

// PREFERENCES
const getPreferences = async (req, res, next) => {
    try {
        const preferences = await settingsService.getSetting('preferences', {});
        return sendSuccess(res, { preferences });
    } catch (err) { next(err); }
};

const updatePreferences = async (req, res, next) => {
    try {
        const preferences = await settingsService.updateSetting('preferences', req.body, req.user._id);
        return sendSuccess(res, { preferences });
    } catch (err) { next(err); }
};

// VOUCHER CONFIG
const getPVConfig = async (req, res, next) => {
    try {
        const config = await settingsService.getSetting('purchase-voucher-config', {});
        return sendSuccess(res, { config });
    } catch (err) { next(err); }
};

const updatePVConfig = async (req, res, next) => {
    try {
        const config = await settingsService.updateSetting('purchase-voucher-config', req.body, req.user._id);
        return sendSuccess(res, { config });
    } catch (err) { next(err); }
};

// PRINT TEMPLATES
const getPrintTemplates = async (req, res, next) => {
    try {
        const templates = await settingsService.getSetting('print-templates', []);
        return sendSuccess(res, { templates });
    } catch (err) { next(err); }
};

const addPrintTemplate = async (req, res, next) => {
    try {
        const template = await settingsService.addToCollection('print-templates', req.body, req.user._id);
        return sendSuccess(res, { template });
    } catch (err) { next(err); }
};

const updatePrintTemplate = async (req, res, next) => {
    try {
        const template = await settingsService.updateInCollection('print-templates', req.params.id, req.body, req.user._id);
        return sendSuccess(res, { template });
    } catch (err) { next(err); }
};

module.exports = {
    getCompanyProfile,
    updateCompanyProfile,
    getRoles,
    addRole,
    updateRole,
    getNumberSeries,
    addNumberSeries,
    updateNumberSeries,
    getPreferences,
    updatePreferences,
    getPVConfig,
    updatePVConfig,
    getPrintTemplates,
    addPrintTemplate,
    updatePrintTemplate
};
