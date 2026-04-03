const WorkflowLog = require('../../models/workflowLog.model');

/**
 * WORKFLOW SERVICE
 * Standardizes status transitions, document linking, and audit logging across the ERP.
 */
class WorkflowService {
    
    /**
     * UPDATE STATUS
     * Tracks a state change for any document and logs it to WorkflowLog.
     */
    async updateStatus(documentId, documentType, fromStatus, toStatus, performedBy, notes = '') {
        const log = new WorkflowLog({
            documentId,
            documentType,
            fromStatus,
            toStatus,
            performedBy,
            notes
        });
        
        await log.save();
        
        // Optionally update a master Document index if needed
        // await Document.findOneAndUpdate(...)
        
        return log;
    }

    /**
     * LINK DOCUMENTS
     * Standard trace link (e.g. PO -> GRN). 
     * Native models (like GRN) already store parent IDs, so this is used for global audit indexing.
     */
    async linkDocuments(parentId, childId, parentType, childType) {
        // We can implement a master cross-linked table here later.
        console.log(`[WORKFLOW] Linking ${parentType}(${parentId}) to ${childType}(${childId})`);
        return true;
    }

    /**
     * GET HISTORY
     * Retrieves the workflow trail for a specific piece of business logic.
     */
    async getHistory(documentId) {
        return WorkflowLog.find({ documentId })
            .sort({ createdAt: 1 })
            .populate('performedBy', 'name email');
    }
}

module.exports = new WorkflowService();
