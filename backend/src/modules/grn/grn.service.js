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
 * Step 1: Create a new GRN (Partial Receiving Support)
 * Manages the increment of received counts without affecting physical stock.
 */
const createGRN = async (grnData, userId) => {
    return await withTransaction(async (session) => {
        const { purchaseId, items } = grnData;

        // 1. Validate Purchase Document
        const purchase = await Purchase.findById(purchaseId).session(session);
        if (!purchase) throw new Error(`Purchase record ${purchaseId} not found`);

        // 2. Fetch all existing GRNs to calculate total received history
        const existingGrns = await GRN.find({ 
            purchaseId, 
            isDeleted: false 
        }).session(session);

        const processedItems = [];

        for (const item of items) {
            const originalPurchaseItem = purchase.products.find(
                p => p.productId.toString() === item.productId.toString()
            );

            if (!originalPurchaseItem) {
                throw new Error(`Product ${item.productId} was not part of original Purchase Order`);
            }

            const orderedQty = originalPurchaseItem.quantity;

            // Calculate historical total received
            let totalPreviouslyReceived = 0;
            existingGrns.forEach(g => {
                const prevItem = g.items.find(i => i.productId.toString() === item.productId.toString());
                if (prevItem) {
                    totalPreviouslyReceived += prevItem.receivedQty;
                }
            });

            const currentTotalReceived = totalPreviouslyReceived + item.receivedQty;

            // Validation: Ensure total receiving (historical + current) <= Ordered
            if (currentTotalReceived > orderedQty) {
                throw new Error(`Overage error for product ${item.productId}. Total received (${currentTotalReceived}) would exceed ordered (${orderedQty}). Previously received: ${totalPreviouslyReceived}`);
            }

            processedItems.push({
                productId: item.productId,
                orderedQty,
                receivedQty: item.receivedQty,
                pendingQty: orderedQty - currentTotalReceived,
                batchNumber: item.batchNumber || `BATCH-${Date.now()}`
            });
        }

        const grnNumber = await generateGrnNumber(session);

        const grn = new GRN({
            grnNumber,
            purchaseId,
            items: processedItems,
            receivedBy: userId,
            status: GrnStatus.COMPLETED
        });

        await grn.save({ session });
        
        // Link document and log transition
        await workflowService.linkDocuments(purchaseId, grn._id, DocumentType.PURCHASE, DocumentType.GRN);
        await workflowService.updateStatus(grn._id, DocumentType.GRN, null, GrnStatus.COMPLETED, userId, `Created GRN ${grnNumber} (Partial Receipt) from Purchase ${purchase.purchaseNumber}`);
        
        return grn;
    });
};

const getGRNById = async (id) => {
    return await GRN.findOne({ _id: id, isDeleted: false })
        .populate('purchaseId')
        .populate('items.productId', 'name sku');
};

const getGrnsByPurchase = async (purchaseId) => {
    return await GRN.find({ purchaseId, isDeleted: false }).sort({ createdAt: -1 });
};

module.exports = {
    createGRN,
    getGRNById,
    getGrnsByPurchase
};
