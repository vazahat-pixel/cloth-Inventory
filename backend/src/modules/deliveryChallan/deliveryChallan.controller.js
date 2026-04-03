const challanService = require('./deliveryChallan.service');
const dispatchService = require('../dispatch/dispatch.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const create = async (req, res, next) => {
    try {
        const result = await dispatchService.processDispatch(req.body, req.user._id);
        return sendSuccess(res, result, result.message);
    } catch (err) {
        next(err);
    }
};

const list = async (req, res, next) => {
    try {
        const challans = await challanService.getChallans(req.query);
        return sendSuccess(res, { challans }, 'Delivery Challans retrieved');
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const challan = await challanService.getChallanById(req.params.id);
        return sendSuccess(res, { challan }, 'Challan details retrieved');
    } catch (err) {
        next(err);
    }
};

const receive = async (req, res, next) => {
    try {
        const result = await challanService.receiveChallan(req.params.id, req.user._id);
        return sendSuccess(res, result, 'Challan received at store and inventory updated');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    create,
    list,
    getById,
    receive
};
