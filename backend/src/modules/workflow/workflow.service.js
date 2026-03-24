const WorkflowLog = require('../../models/workflowLog.model');
const { DocumentType } = require('../../core/enums');

// Define allowed transitions
const ALLOWED_TRANSITIONS = {
    [DocumentType.PO]: [DocumentType.PURCHASE],
    [DocumentType.PURCHASE]: [DocumentType.GRN],
    [DocumentType.GRN]: [DocumentType.QC],
    [DocumentType.QC]: ['STOCK_UPDATE'],
    ['STOCK_UPDATE']: [DocumentType.SALE],
};

/**
 * Validate if the next step is allowed from the current document type
 */
const validateNextStep = (currentType, nextType) => {
    const allowed = ALLOWED_TRANSITIONS[currentType];
    if (!allowed || !allowed.includes(nextType)) {
        throw new Error(`Invalid workflow transition: ${currentType} -> ${nextType}`);
    }
    return true;
};

/**
 * Link two documents in the system (placeholder for cross-referencing)
 * In this system, linkage is usually stored as a field in the child document (e.g., grn.purchaseId)
 */
const linkDocuments = async (parentId, childId, parentType, childType) => {
    // This could optionally verify that the parentId exists and is of parentType
    // For now, it logs the linkage as a workflow step
    return true;
};

/**
 * Update document status and log the transition
 */
const updateStatus = async (documentId, documentType, fromStatus, toStatus, userId, notes = '') => {
    // Log the transition
    await WorkflowLog.create({
        documentId,
        documentType,
        fromStatus,
        toStatus,
        performedBy: userId,
        notes
    });

    console.log(`[Workflow] Transition: ${documentType} ID ${documentId} | ${fromStatus} -> ${toStatus}`);
    
    return true;
};

module.exports = {
    validateNextStep,
    linkDocuments,
    updateStatus,
    ALLOWED_TRANSITIONS
};
