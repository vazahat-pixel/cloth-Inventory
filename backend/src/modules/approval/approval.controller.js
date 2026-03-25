const approvalService = require('./approval.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * Handle POST /approval/check
 */
const check = async (req, res, next) => {
    try {
        const { module, action, value } = req.body;
        const result = await approvalService.checkApprovalNeeds(module, action, value);
        return sendSuccess(res, { result }, 'Approval check completed');
    } catch (error) {
        next(error);
    }
};

/**
 * Handle POST /approval/approve
 */
const approve = async (req, res, next) => {
    try {
        const { requestId, status, notes } = req.body;
        const approval = await approvalService.processApproval(requestId, req.user._id, status, notes);
        return sendSuccess(res, { approval }, `Approval request ${status} successfully`);
    } catch (error) {
        next(error);
    }
};

/**
 * Handle creating logic for approval rule
 */
const createRule = async (req, res, next) => {
    try {
        const rule = await require('../../models/approvalRule.model').create(req.body);
        return sendSuccess(res, { rule }, 'Approval rule created');
    } catch (error) {
        next(error);
    }
};

/**
 * Get pending requests for current user's role
 */
const getPending = async (req, res, next) => {
    try {
        const requests = await approvalService.getPendingRequests(req.user.role);
        return sendSuccess(res, { requests }, 'Pending requests retrieved');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    check,
    approve,
    createRule,
    getPending
};
