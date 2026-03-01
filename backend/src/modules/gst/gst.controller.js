const gstService = require('./gst.service');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response.handler');

const createGstSlab = async (req, res, next) => {
    try {
        const slab = await gstService.createGstSlab(req.body);
        return sendCreated(res, { slab }, 'GST Slab created successfully');
    } catch (err) {
        next(err);
    }
};

const getAllGstSlabs = async (req, res, next) => {
    try {
        const slabs = await gstService.getAllGstSlabs(req.query);
        return sendSuccess(res, { slabs }, 'GST Slabs retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const updateGstSlab = async (req, res, next) => {
    try {
        const slab = await gstService.updateGstSlab(req.params.id, req.body);
        if (!slab) return sendError(res, 'GST Slab not found', 404);
        return sendSuccess(res, { slab }, 'GST Slab updated successfully');
    } catch (err) {
        next(err);
    }
};

const deleteGstSlab = async (req, res, next) => {
    try {
        const slab = await gstService.deleteGstSlab(req.params.id);
        if (!slab) return sendError(res, 'GST Slab not found', 404);
        return sendSuccess(res, {}, 'GST Slab deleted successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createGstSlab,
    getAllGstSlabs,
    updateGstSlab,
    deleteGstSlab
};
