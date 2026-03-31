const GRN = require('../../models/grn.model');
const Purchase = require('../../models/purchase.model');
const { GrnStatus, DocumentType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');
const workflowService = require('../workflow/workflow.service');

const stockLedgerService = require('../inventory/stockLedger.service');

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
        const { purchaseId, purchaseOrderId, supplierId, warehouseId, invoiceNumber, invoiceDate, remarks, items } = grnData;

        // 1. Validate Parent Document
        let parentDoc = null;
        if (purchaseOrderId) {
            const PurchaseOrder = require('../../models/purchaseOrder.model');
            parentDoc = await PurchaseOrder.findById(purchaseOrderId).session(session);
        } else if (purchaseId) {
            parentDoc = await Purchase.findById(purchaseId).session(session);
        }

        if (!parentDoc) throw new Error('Parent document (PO or Voucher) not found');

        // 2. Fetch all existing GRNs to calculate total received history
        const existingGrns = await GRN.find({ 
            $or: [{ purchaseId }, { purchaseOrderId }],
            isDeleted: false 
        }).session(session);

        const processedItems = [];

        for (const item of items) {
            // Find in parent products
            const parentItems = parentDoc.products || parentDoc.items || [];
            const originalItem = parentItems.find(
                p => (p.productId || p._id || p.id).toString() === (item.productId || item.variantId).toString()
            );

            const orderedQty = item.orderedQty || (originalItem ? (originalItem.quantity || originalItem.qty) : 0);

            // Calculate historical total received
            let totalPreviouslyReceived = 0;
            existingGrns.forEach(g => {
                const prevItem = g.items.find(i => i.productId.toString() === item.productId.toString());
                if (prevItem) {
                    totalPreviouslyReceived += prevItem.receivedQty;
                }
            });

            const currentTotalReceived = totalPreviouslyReceived + item.receivedQty;

            // Overage Error Check
            if (currentTotalReceived > orderedQty) {
                throw new Error(`Overage error for ${item.productId}. Total received (${currentTotalReceived}) exceeds ordered (${orderedQty}).`);
            }

            processedItems.push({
                productId: item.productId,
                orderedQty,
                receivedQty: item.receivedQty,
                pendingQty: orderedQty - currentTotalReceived,
                batchNumber: item.lotNumber || item.batchNumber || `BATCH-${Date.now()}`
            });
        }

        const grnNumber = await generateGrnNumber(session);

        const grn = new GRN({
            grnNumber,
            purchaseId: purchaseId || null,
            purchaseOrderId: purchaseOrderId || null,
            supplierId,
            warehouseId,
            invoiceNumber,
            invoiceDate,
            remarks,
            items: processedItems,
            receivedBy: userId,
            status: GrnStatus.DRAFT // Start as Draft
        });

        await grn.save({ session });
        
        // Link document and log transition
        const parentId = purchaseOrderId || purchaseId;
        const parentType = purchaseOrderId ? DocumentType.PURCHASE_ORDER : DocumentType.PURCHASE;
        
        await workflowService.linkDocuments(parentId, grn._id, parentType, DocumentType.GRN);
        await workflowService.updateStatus(grn._id, DocumentType.GRN, null, GrnStatus.DRAFT, userId, `Created Draft GRN ${grnNumber} from ${purchaseOrderId ? 'PO' : 'Purchase'}`);
        
        return grn;
    });
};

/**
 * Step 2: Approve GRN & Post Stock
 */
const approveGRN = async (id, userId) => {
    return await withTransaction(async (session) => {
        const grn = await GRN.findOne({ _id: id, isDeleted: false }).session(session);
        if (!grn) throw new Error('GRN not found');
        if (grn.status !== GrnStatus.DRAFT) throw new Error(`GRN cannot be approved in ${grn.status} status`);

        // 1. Update Status
        const oldStatus = grn.status;
        grn.status = GrnStatus.APPROVED;
        await grn.save({ session });

        // 2. Post to Stock Ledger for each item
        for (const item of grn.items) {
            await stockLedgerService.recordMovement({
                itemId: item.productId,
                barcode: `${item.productId}-${item.batchNumber}`, // Simplified barcode for demo
                type: 'IN',
                quantity: item.receivedQty,
                source: 'GRN_RECEIPT',
                referenceId: grn._id,
                userId: userId,
                locationId: grn.warehouseId || 'MAIN_WAREHOUSE',
                locationType: 'WAREHOUSE',
                batchNo: item.batchNumber
            }, session);
        }

        await workflowService.updateStatus(grn._id, DocumentType.GRN, oldStatus, GrnStatus.APPROVED, userId, `Approved GRN ${grn.grnNumber} and posted stock to warehouse.`);
        
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

const getAllGrns = async () => {
    return await GRN.find({ isDeleted: false })
        .populate('supplierId', 'name')
        .sort({ createdAt: -1 });
};

module.exports = {
    createGRN,
    approveGRN,
    getGRNById,
    getGrnsByPurchase,
    getAllGrns
};
