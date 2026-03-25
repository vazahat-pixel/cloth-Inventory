const qcService = require('./qc.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * POST /qc -> createQC
 */
const create = async (req, res, next) => {
    try {
        const qc = await qcService.createQC(req.body, req.user._id);
        sendSuccess(res, 'QC request created successfully', qc, 201);
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /qc/:id/approve -> approveQC
 */
const approve = async (req, res, next) => {
    try {
        const qc = await qcService.approveQC(req.params.id, req.user._id);
        sendSuccess(res, 'QC request approved and stock updated successfully', qc);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    create,
    approve
};
