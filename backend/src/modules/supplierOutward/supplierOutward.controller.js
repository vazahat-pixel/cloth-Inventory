const supplierOutwardService = require('./supplierOutward.service');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');

class SupplierOutwardController {
    createOutward = async (req, res) => {
        try {
            const userId = req.user?._id || req.user?.id;
            const outward = await supplierOutwardService.createOutward(req.body, userId);
            return sendCreated(res, { outward }, 'Supplier outward created successfully');
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    };

    getOutwards = async (req, res) => {
        try {
            const outwards = await supplierOutwardService.getOutwards(req.query);
            return sendSuccess(res, { outwards }, 'Supplier outwards fetched successfully');
        } catch (error) {
            return sendError(res, error.message);
        }
    };

    getOutwardById = async (req, res) => {
        try {
            const outward = await supplierOutwardService.getOutwardById(req.params.id);
            if (!outward) return sendNotFound(res, 'Supplier outward not found');
            return sendSuccess(res, { outward }, 'Supplier outward fetched successfully');
        } catch (error) {
            return sendError(res, error.message);
        }
    };
}

module.exports = new SupplierOutwardController();
