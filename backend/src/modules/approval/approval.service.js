const ApprovalRule = require('../../models/approvalRule.model');
const ApprovalRequest = require('../../models/approvalRequest.model');
const { withTransaction } = require('../../services/transaction.service');
const { createAuditLog } = require('../../middlewares/audit.middleware');

/**
 * Check if a specific action requires approval based on value/threshold
 */
const checkApprovalNeeds = async (module, action, value) => {
    const rules = await ApprovalRule.find({ module, action, isActive: true });
    
    // Sort rules by threshold descending to find most restrictive rule that value exceeds
    const sortedRules = rules.sort((a, b) => b.threshold - a.threshold);
    
    for (const rule of sortedRules) {
        if (value > rule.threshold) {
            return { needsApproval: true, ruleId: rule._id, requiredRole: rule.requiredRole };
        }
    }
    
    return { needsApproval: false };
};

/**
 * Create a new approval request
 */
const createRequest = async ({ ruleId, targetId, targetModel, requesterId, notes }) => {
    const request = new ApprovalRequest({
        ruleId,
        targetId,
        targetModel,
        requesterId,
        notes,
        status: 'PENDING'
    });
    
    await request.save();
    return request;
};

/**
 * Process approval (Approve/Reject)
 */
const processApproval = async (requestId, approverId, status, notes) => {
    return await withTransaction(async (session) => {
        const request = await ApprovalRequest.findById(requestId).session(session);
        if (!request) throw new Error('Approval request not found');
        if (request.status !== 'PENDING') throw new Error(`Request is already ${request.status}`);

        const before = request.toObject();
        request.status = status; // APPROVED / REJECTED
        request.approverId = approverId;
        request.notes = `${request.notes || ''} | [SYSTEM] Decision: ${status} by ${approverId} | Note: ${notes || ''}`;
        
        await request.save({ session });
        
        // Audit Logging
        await createAuditLog({
            action: 'PROCESS_APPROVAL',
            module: 'APPROVAL',
            performedBy: approverId,
            targetId: request._id,
            targetModel: 'ApprovalRequest',
            before,
            after: request.toObject(),
            session
        });

        return request;
    });
};

const getPendingRequests = async (role) => {
    // Populate rules to show module/action context
    return await ApprovalRequest.find({ status: 'PENDING' })
        .populate('ruleId')
        .populate('requesterId', 'name email');
};

module.exports = {
    checkApprovalNeeds,
    createRequest,
    processApproval,
    getPendingRequests
};
