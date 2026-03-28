const gstService = require('./gst.service');
const GstGroup = require('../../models/gstGroup.model');
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
        return sendSuccess(res, { slabs, gstSlabs: slabs }, 'GST Slabs retrieved successfully');
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

// ── GST GROUPS ───────────────────────────────────────────────────────────────

const getAllGstGroups = async (req, res, next) => {
    try {
        const groups = await GstGroup.find().populate('slabs').sort({ createdAt: -1 });
        return sendSuccess(res, { groups }, 'GST Groups retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const createGstGroup = async (req, res, next) => {
    try {
        const { name, description, slabs, status } = req.body;
        if (!name) return sendError(res, 'Group name is required', 400);
        const group = await GstGroup.create({ name, description, slabs, status, createdBy: req.user._id });
        return sendCreated(res, { group }, 'GST Group created successfully');
    } catch (err) {
        if (err.code === 11000) return sendError(res, 'GST Group with this name already exists', 400);
        next(err);
    }
};

const updateGstGroup = async (req, res, next) => {
    try {
        const group = await GstGroup.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('slabs');
        if (!group) return sendError(res, 'GST Group not found', 404);
        return sendSuccess(res, { group }, 'GST Group updated successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createGstSlab,
    getAllGstSlabs,
    updateGstSlab,
    deleteGstSlab,
    getAllGstGroups,
    createGstGroup,
    updateGstGroup
};
