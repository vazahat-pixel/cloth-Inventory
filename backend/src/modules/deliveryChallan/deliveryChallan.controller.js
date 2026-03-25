const challanService = require('./deliveryChallan.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const create = async (req, res, next) => {
    try {
        const challan = await challanService.createChallan(req.body, req.user._id);
        return sendSuccess(res, { challan }, 'Delivery Challan created successfully');
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

module.exports = {
    create,
    list,
    getById
};
