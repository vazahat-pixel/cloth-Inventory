const GRN = require('../../models/grn.model');
const Purchase = require('../../models/purchase.model');
const Item = require('../../models/item.model');
const { GrnStatus, DocumentType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');
const workflowService = require('../workflow/workflow.service.js');

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

        // 1. Validate Parent Document (Optional for Direct GRN)
        let parentDoc = null;
        if (purchaseOrderId) {
            const PurchaseOrder = require('../../models/purchaseOrder.model');
            parentDoc = await PurchaseOrder.findById(purchaseOrderId).session(session);
            if (!parentDoc) throw new Error('Purchase Order not found');
        } else if (purchaseId) {
            parentDoc = await Purchase.findById(purchaseId).session(session);
            if (!parentDoc) throw new Error('Purchase document not found');
        }

        const processedItems = [];
        const existingGrns = await GRN.find({
            $or: [{ purchaseId }, { purchaseOrderId }],
            isDeleted: false
        }).session(session);

        for (const item of items) {
            const itemId = item.itemId || item.productId;
            const variantId = item.variantId; // This is the _id of the size variant
            let sku = item.sku;
            
            let orderedQty = item.orderedQty || 0;

            // If linked to a parent document, validate quantities
            if (parentDoc) {
                const parentItems = parentDoc.items || parentDoc.products || [];
                const originalItem = parentItems.find(p =>
                    (p.itemId || p.productId || p._id).toString() === itemId.toString() &&
                    (p.variantId || p._id).toString() === variantId.toString()
                );

                if (originalItem) {
                    orderedQty = originalItem.quantity || originalItem.qty || orderedQty;
                }
            }

            // Calculate historical total received for this specific variant
            let totalPreviouslyReceived = 0;
            if (existingGrns.length > 0 && itemId && variantId) {
                existingGrns.forEach(g => {
                    if (g.items && Array.isArray(g.items)) {
                        const prevItem = g.items.find(i => {
                            const curItemId = (i.itemId || i.productId);
                            return curItemId && curItemId.toString() === itemId.toString() &&
                                i.variantId && i.variantId.toString() === variantId.toString();
                        });
                        if (prevItem) {
                            totalPreviouslyReceived += (prevItem.receivedQty || 0);
                        }
                    }
                });
            }

            const currentTotalReceived = totalPreviouslyReceived + item.receivedQty;

            // Overage Error Check (Optional but helpful)
            if (orderedQty > 0 && currentTotalReceived > orderedQty) {
                // Throwing error or warning? Let's stay strict for now or disable if not linked.
                // throw new Error(`Overage for SKU ${sku}. Total received (${currentTotalReceived}) exceeds ordered (${orderedQty}).`);
            }

            const originalItem = parentDoc ? parentDoc.items.find(p => 
                (p.itemId || p.productId || p._id).toString() === itemId.toString() &&
                (p.variantId || p._id).toString() === variantId.toString()
            ) : null;

            
            // BACKEND FAIL-SAFE: If SKU is missing, recover it from Item Master
            if (!sku && itemId) {
                const masterDoc = await Item.findById(itemId).session(session);
                if (masterDoc && masterDoc.sizes) {
                    const variant = masterDoc.sizes.find(v => (v._id || v.id).toString() === variantId.toString());
                    sku = variant?.sku;
                }
                // If still missing, check Top Level
                if (!sku) sku = masterDoc?.sku || masterDoc?.itemCode;
            }

            processedItems.push({
                itemId,
                variantId,
                sku: sku || 'N/A', // Ultimate fallback for model integrity
                receivedQty: item.receivedQty,
                costPrice: item.costPrice || (originalItem ? (originalItem.price || originalItem.rate || originalItem.costPrice) : 0),
                tax: item.tax || (originalItem ? (originalItem.taxPercent || originalItem.tax) : 0),
                discount: item.discount || (originalItem ? (originalItem.discountPercent || originalItem.discount) : 0),
                size: item.size || (originalItem ? originalItem.size : '-'),
                color: item.color || (originalItem ? originalItem.color : '-'),
                batchNumber: item.lotNumber || item.batchNumber || `BATCH-${Date.now()}`
            });
        }

        console.log('Processed Items for GRN:', processedItems);

        const grnNumber = await generateGrnNumber(session);

        const grn = new GRN({
            grnNumber,
            purchaseId: purchaseId || null,
            purchaseOrderId: purchaseOrderId || null,
            jobWorkId: grnData.jobWorkId || null,
            consumptionDetails: grnData.consumptionDetails || [],
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

        const parentId = purchaseOrderId || purchaseId;
        const parentType = purchaseOrderId ? DocumentType.PO : DocumentType.PURCHASE;

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

        // 2. Post to Stock Ledger and Master Inventory for each item
        const stockService = require('../../services/stock.service');
        console.log(`[GRN-APPROVAL] Posting stock for GRN: ${grn.grnNumber}, Warehouse: ${grn.warehouseId}`);
        
        for (const item of grn.items) {
            console.log(`   -> Item: ${item.sku}, Variant: ${item.variantId}, Qty: ${item.receivedQty}`);
            await stockService.addStock({
                itemId: item.itemId,
                barcode: item.sku,
                variantId: item.variantId,
                locationId: grn.warehouseId,
                locationType: 'WAREHOUSE',
                qty: item.receivedQty,
                type: 'GRN_RECEIPT',
                referenceId: grn._id,
                referenceType: 'GRN',
                performedBy: userId,
                session
            });
        }

        console.log(`[GRN-APPROVAL] Successfully posted all items to Warehouse stock.`);
        
        // 3. Update Purchase Order Fulfillment if linked
        if (grn.purchaseOrderId) {
            const PurchaseOrder = require('../../models/purchaseOrder.model');
            const po = await PurchaseOrder.findById(grn.purchaseOrderId).session(session);
            if (po) {
                for (const item of grn.items) {
                    const poItem = po.items.find(i => i.variantId?.toString() === item.variantId?.toString());
                    if (poItem) {
                        poItem.receivedQty = (poItem.receivedQty || 0) + item.receivedQty;
                    }
                }
                
                // Determine PO Status
                let isFullyFulfilled = true;
                let hasAnyReceiving = false;
                for (const poItem of po.items) {
                    if ((poItem.receivedQty || 0) < poItem.qty) isFullyFulfilled = false;
                    if ((poItem.receivedQty || 0) > 0) hasAnyReceiving = true;
                }

                const { PurchaseOrderStatus } = require('../../core/enums');
                if (isFullyFulfilled) po.status = PurchaseOrderStatus.COMPLETED;
                else if (hasAnyReceiving) po.status = PurchaseOrderStatus.PARTIALLY_RECEIVED;
                
                await po.save({ session });
            }
        }

        await workflowService.updateStatus(grn._id, DocumentType.GRN, oldStatus, GrnStatus.APPROVED, userId, `Approved GRN ${grn.grnNumber} and posted stock to warehouse.`);

        return grn;
    });
};

const getGRNById = async (id) => {
    return await GRN.findOne({ _id: id, isDeleted: false })
        .populate('supplierId', 'name supplierName')
        .populate('warehouseId', 'name')
        .populate('purchaseOrderId', 'poNumber items')
        .populate('items.itemId', 'itemName itemCode shade gstTax sizes');
};

const getGrnsByPurchase = async (purchaseId) => {
    return await GRN.find({ purchaseId, isDeleted: false }).sort({ createdAt: -1 });
};

const getAllGrns = async () => {
    return await GRN.find({ isDeleted: false })
        .populate('supplierId', 'name supplierName')
        .populate('warehouseId', 'name')
        .populate('items.itemId', 'itemName itemCode shade gstTax sizes')
        .sort({ createdAt: -1 });
};

const getNextSuggestedNumber = async () => {
    // Note: In this simple implementation, we generate it. 
    // Usually, we'd peek, but here we just return a generated one for now.
    return await generateGrnNumber();
};

module.exports = {
    createGRN,
    approveGRN,
    getGRNById,
    getGrnsByPurchase,
    getAllGrns,
    getNextSuggestedNumber
};
