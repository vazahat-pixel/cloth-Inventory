const QC = require('../../models/qc.model');
const GRN = require('../../models/grn.model');
const { QcStatus, StockHistoryType, DocumentType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');
const workflowService = require('../workflow/workflow.service');
const { addStock } = require('../../services/stock.service');
const { createJournalEntries } = require('../../services/ledger.service');
const Account = require('../../models/account.model');
const { createAuditLog } = require('../../middlewares/audit.middleware');

/**
 * Generate unique QC Number (QC-YYYY-XXXXX)
 */
const generateQcNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const prefix = `QC-${year}-`;
    const counterName = `QC_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

/**
 * Create a new QC Request
 */
const createQC = async (qcData, userId) => {
    return await withTransaction(async (session) => {
        const { grnId, items } = qcData;

        // Workflow validation
        const grn = await GRN.findById(grnId).session(session);
        if (!grn) throw new Error(`GRN record ${grnId} not found`);

        workflowService.validateNextStep(DocumentType.GRN, DocumentType.QC);

        // Validation: Every item approvedQty + rejectedQty == receivedQty
        for (const item of items) {
            if (item.approvedQty + item.rejectedQty !== item.receivedQty) {
                throw new Error(`Invalid QC data for product ${item.productId}. Approved (${item.approvedQty}) + Rejected (${item.rejectedQty}) must equal Received (${item.receivedQty})`);
            }
        }

        const qcNumber = await generateQcNumber(session);

        const qc = new QC({
            qcNumber,
            grnId,
            items,
            performedBy: userId,
            status: QcStatus.PENDING
        });

        await qc.save({ session });

        // Link document and log transition
        await workflowService.linkDocuments(grnId, qc._id, DocumentType.GRN, DocumentType.QC);
        await workflowService.updateStatus(qc._id, DocumentType.QC, null, QcStatus.PENDING, userId, `Created QC ${qcNumber} for GRN ${grn.grnNumber}`);
        
        // Log note on GRN
        await workflowService.updateStatus(grnId, DocumentType.GRN, grn.status, grn.status, userId, `QC ${qcNumber} initiated`);

        return qc;
    });
};

/**
 * Approve QC and add stock
 */
const approveQC = async (id, userId) => {
    return await withTransaction(async (session) => {
        const qc = await QC.findById(id).populate({
            path: 'grnId',
            populate: { path: 'purchaseId' }
        }).session(session);

        if (!qc) throw new Error('QC record not found');
        if (qc.status !== QcStatus.PENDING) throw new Error(`Only pending QC records can be approved (Current: ${qc.status})`);

        const grn = qc.grnId;
        const purchase = grn.purchaseId;
        const warehouseId = purchase.storeId; // Treating the receiving entity of Purchase as Warehouse in ERP flow
        if (!warehouseId) throw new Error('No Warehouse destination linked to this QC (via GRN -> Purchase)');

        const before = qc.toObject();
        let totalLossAmount = 0;

        for (const item of qc.items) {
            // Find rate from purchase
            const purchaseItem = purchase.products.find(p => p.productId.toString() === item.productId.toString());
            const rate = purchaseItem ? purchaseItem.rate : 0;

            // 1. Add Approved Stock to WAREHOUSE
            if (item.approvedQty > 0) {
                await addStock({
                    variantId: item.variantId || item.productId,
                    locationId: warehouseId,
                    locationType: 'WAREHOUSE',
                    qty: item.approvedQty,
                    type: 'QC_APPROVED',
                    referenceId: qc._id,
                    referenceType: 'QC',
                    performedBy: userId,
                    session
                });
            }

            // 2. Track Loss for Rejected in WAREHOUSE
            if (item.rejectedQty > 0) {
                totalLossAmount += (item.rejectedQty * rate);
                await addStock({
                    variantId: item.variantId || item.productId,
                    locationId: warehouseId,
                    locationType: 'WAREHOUSE',
                    qty: item.rejectedQty,
                    type: 'DAMAGED', 
                    referenceId: qc._id,
                    referenceType: 'QC',
                    performedBy: userId,
                    session
                });
            }
        }

        // 3. Accounting for Damage/Loss
        if (totalLossAmount > 0) {
            const lossAccount = await Account.findOne({ name: 'Stock Loss' }).session(session);
            const inventoryAccount = await Account.findOne({ name: 'Inventory Account' }).session(session);
            
            if (lossAccount && inventoryAccount) {
                await createJournalEntries([
                    {
                        voucherType: 'QC_LOSS',
                        voucherId: qc._id,
                        accountId: lossAccount._id,
                        debit: totalLossAmount,
                        credit: 0,
                        narration: `Loss from QC ${qc.qcNumber}`
                    },
                    {
                        voucherType: 'QC_LOSS',
                        voucherId: qc._id,
                        accountId: inventoryAccount._id,
                        debit: 0,
                        credit: totalLossAmount,
                        narration: `Loss from QC ${qc.qcNumber}`
                    }
                ], session);
            }
        }

        qc.status = QcStatus.APPROVED;
        qc.completedAt = Date.now();
        await qc.save({ session });

        // Audit Logging
        await createAuditLog({
            action: 'APPROVE_QC',
            module: 'QC',
            performedBy: userId,
            targetId: qc._id,
            targetModel: 'QC',
            before,
            after: qc.toObject(),
            session
        });

        // Document transition from QC to STOCK_UPDATE
        await workflowService.updateStatus(qc._id, DocumentType.QC, QcStatus.PENDING, 'STOCK_UPDATE', userId, `QC ${qc.qcNumber} Approved - Stock added to Warehouse`);

        return qc;
    });
};

module.exports = {
    createQC,
    approveQC
};
