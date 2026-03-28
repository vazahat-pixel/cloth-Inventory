const ordersService = require('./orders.service');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response.handler');

const getAllSaleOrders = async (req, res, next) => {
    try {
        const result = await ordersService.getAllSaleOrders(req.query);
        return sendSuccess(res, result, 'Sale orders retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getSaleOrderById = async (req, res, next) => {
    try {
        const order = await ordersService.getSaleOrderById(req.params.id);
        return sendSuccess(res, { order }, 'Sale order retrieved successfully');
    } catch (err) {
        return sendError(res, err.message, 404);
    }
};

const createSaleOrder = async (req, res, next) => {
    try {
        const order = await ordersService.createSaleOrder(req.body, req.user._id);
        return sendCreated(res, { order }, 'Sale order created successfully');
    } catch (err) {
        next(err);
    }
};

const updateSaleOrder = async (req, res, next) => {
    try {
        const order = await ordersService.updateSaleOrder(req.params.id, req.body, req.user._id);
        return sendSuccess(res, { order }, 'Sale order updated successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const createPackingSlip = async (req, res, next) => {
    try {
        const slip = await ordersService.createPackingSlip(req.body, req.user._id);
        return sendCreated(res, { slip }, 'Packing slip created successfully');
    } catch (err) {
        next(err);
    }
};

const createDeliveryOrder = async (req, res, next) => {
    try {
        const deliveryOrder = await ordersService.createDeliveryOrder(req.body, req.user._id);
        return sendCreated(res, { deliveryOrder }, 'Delivery order created successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllSaleOrders,
    getSaleOrderById,
    createSaleOrder,
    updateSaleOrder,
    createPackingSlip,
    createDeliveryOrder
};
