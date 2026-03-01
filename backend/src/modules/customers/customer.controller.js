const customerService = require('./customer.service');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');

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

module.exports = {
    createCustomer,
    getAllCustomers,
    getCustomerByPhone,
    getCustomerById
};
