const GRN = require('../../models/grn.model');
const Purchase = require('../../models/purchase.model');
const { GrnStatus, DocumentType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');
const workflowService = require('../workflow/workflow.service');

/**
 * Generate unique GRN Number (GRN-YYYY-XXXXX)
 */
const generateGrnNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const prefix = `GRN-${year}-`;
    const counterName = `GRN_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

/**
 * Create a new GRN
 * @param {Object} grnData - GRN data including purchaseId and items
 * @param {String} userId - User creating the GRN
 */
const createGRN = async (grnData, userId) => {
    return await withTransaction(async (session) => {
        const { purchaseId, items } = grnData;

        // 1. Workflow validation: Ensure PURCHASE exists and transition is allowed
        const purchase = await Purchase.findById(purchaseId).session(session);
        if (!purchase) throw new Error(`Purchase record ${purchaseId} not found`);

        workflowService.validateNextStep(DocumentType.PURCHASE, DocumentType.GRN);

        // Validation: Every item's receivedQty must be <= orderedQty
        for (const item of items) {
            if (item.receivedQty > item.orderedQty) {
                throw new Error(`Invalid received quantity for product ${item.productId}. Received (${item.receivedQty}) cannot exceed ordered (${item.orderedQty})`);
            }
        }

        const grnNumber = await generateGrnNumber(session);

        const grn = new GRN({
            grnNumber,
            purchaseId,
            items,
            receivedBy: userId,
            status: GrnStatus.COMPLETED // Automatically marked completed as per standard GRN process if all items are validated
        });

        await grn.save({ session });
        
        // Link document and log transition
        await workflowService.linkDocuments(purchaseId, grn._id, DocumentType.PURCHASE, DocumentType.GRN);
        await workflowService.updateStatus(grn._id, DocumentType.GRN, null, GrnStatus.COMPLETED, userId, `Created GRN ${grnNumber} from Purchase ${purchase.purchaseNumber}`);
        
        // Update purchase history note if needed (via meta/notes)
        await workflowService.updateStatus(purchaseId, DocumentType.PURCHASE, purchase.status, purchase.status, userId, `GRN ${grnNumber} linked`);

        return grn;
    });
};

/**
 * Get GRN by ID
 */
const getGRNById = async (id) => {
    const grn = await GRN.findOne({ _id: id, isDeleted: false })
        .populate('purchaseId')
        .populate('receivedBy', 'name email')
        .populate('items.productId', 'name sku barcode');
    
    if (!grn) throw new Error('GRN not found');
    return grn;
};

module.exports = {
    createGRN,
    getGRNById
};
