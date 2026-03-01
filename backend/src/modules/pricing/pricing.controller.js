const pricingService = require('./pricing.service');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response.handler');

const createPricingRule = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const rule = await pricingService.createPricingRule(req.body, userId);
        return sendCreated(res, { rule }, 'Pricing rule created successfully');
    } catch (err) {
        next(err);
    }
};

const getPricingRules = async (req, res, next) => {
    try {
        const rules = await pricingService.getPricingRules(req.query);
        return sendSuccess(res, { rules }, 'Pricing rules retrieved');
    } catch (err) {
        next(err);
    }
};

const updatePricingRule = async (req, res, next) => {
    try {
        const rule = await pricingService.updatePricingRule(req.params.id, req.body);
        if (!rule) return sendError(res, 'Pricing rule not found', 404);
        return sendSuccess(res, { rule }, 'Pricing rule updated');
    } catch (err) {
        next(err);
    }
};

const deletePricingRule = async (req, res, next) => {
    try {
        const rule = await pricingService.deletePricingRule(req.params.id);
        if (!rule) return sendError(res, 'Pricing rule not found', 404);
        return sendSuccess(res, {}, 'Pricing rule deleted');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createPricingRule,
    getPricingRules,
    updatePricingRule,
    deletePricingRule
};
