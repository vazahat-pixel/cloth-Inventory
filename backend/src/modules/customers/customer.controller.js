const customerService = require('./customer.service');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');
const LoyaltyTransaction = require('../../models/loyaltyTransaction.model');
const Settings = require('../../models/settings.model');

const createCustomer = async (req, res, next) => {
    try {
        const customer = await customerService.createCustomer(req.body);
        return sendCreated(res, { customer }, 'Customer created successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const getAllCustomers = async (req, res, next) => {
    try {
        const { customers, total, page, limit } = await customerService.getAllCustomers(req.query);
        const meta = buildPaginationMeta(total, page, limit);
        return sendSuccess(res, { customers, meta }, 'Customers retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getCustomerByPhone = async (req, res, next) => {
    try {
        const customer = await customerService.getCustomerByPhone(req.params.phone);
        if (!customer) return sendNotFound(res, 'Customer not found with this phone number');
        return sendSuccess(res, { customer }, 'Customer found');
    } catch (err) {
        next(err);
    }
};

const getCustomerById = async (req, res, next) => {
    try {
        const customer = await customerService.getCustomerById(req.params.id);
        return sendSuccess(res, { customer }, 'Customer details retrieved');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const updateCustomer = async (req, res, next) => {
    try {
        const customer = await customerService.updateCustomer(req.params.id, req.body);
        return sendSuccess(res, { customer }, 'Customer updated successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const deleteCustomer = async (req, res, next) => {
    try {
        await customerService.deleteCustomer(req.params.id);
        return sendSuccess(res, {}, 'Customer deactivated successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

// ── Loyalty Config ──────────────────────────────────────────────────────────
const getLoyaltyConfig = async (req, res, next) => {
    try {
        let config = await Settings.findOne({ key: 'loyalty_config' });
        if (!config) {
            // Return sensible defaults
            return sendSuccess(res, {
                config: {
                    pointsPerRupee: 1,
                    redeemValue: 0.25,
                    minRedeemPoints: 100,
                    expiryDays: 365,
                    isEnabled: true
                }
            }, 'Loyalty config retrieved');
        }
        return sendSuccess(res, { config: config.value }, 'Loyalty config retrieved');
    } catch (err) {
        next(err);
    }
};

const updateLoyaltyConfig = async (req, res, next) => {
    try {
        const config = await Settings.findOneAndUpdate(
            { key: 'loyalty_config' },
            { key: 'loyalty_config', value: req.body },
            { new: true, upsert: true }
        );
        return sendSuccess(res, { config: config.value }, 'Loyalty config updated');
    } catch (err) {
        next(err);
    }
};

const getLoyaltyHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const transactions = await LoyaltyTransaction.find({ customerId: id })
            .sort({ createdAt: -1 })
            .limit(100);
        return sendSuccess(res, { transactions }, 'Loyalty history retrieved');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createCustomer,
    getAllCustomers,
    getCustomerByPhone,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    getLoyaltyConfig,
    updateLoyaltyConfig,
    getLoyaltyHistory
};
