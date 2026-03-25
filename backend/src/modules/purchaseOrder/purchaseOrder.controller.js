const poService = require('./purchaseOrder.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const create = async (req, res, next) => {
    try {
        const po = await poService.createPO(req.body, req.user._id);
        return sendSuccess(res, { po }, 'Purchase Order created');
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const po = await poService.updateStatus(id, status, req.user._id);
        return sendSuccess(res, { po }, `Purchase Order moved to ${status}`);
    } catch (error) {
        next(error);
    }
};

const get = async (req, res, next) => {
    try {
        const pos = await poService.getPOs(req.query);
        return sendSuccess(res, { pos }, 'Purchase Orders retrieved');
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const po = await poService.getPOById(req.params.id);
        return sendSuccess(res, { po }, 'Purchase Order details retrieved');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    updateStatus,
    get,
    getById
};
