const GRN = require('../../models/grn.model');
const Purchase = require('../../models/purchase.model');
const Item = require('../../models/item.model');
const SupplierInventory = require('../../models/supplierInventory.model');
const MaterialConsumption = require('../../models/materialConsumption.model');
const { GrnStatus, DocumentType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');
const workflowService = require('../workflow/workflow.service.js');
const stockLedgerService = require('../inventory/stockLedger.service');

// ─── Number Generators ────────────────────────────────────────────────────────

const generateGrnNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const prefix = `GRN-${year}-`;
    const seq = await getNextSequence(`GRN_${year}`, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

const generateConsumptionNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const seq = await getNextSequence(`MC_${year}`, session);
    return `MC-${year}-${seq.toString().padStart(5, '0')}`;
};

// ─── Internal: Settle Material Consumption (GARMENT GRN Only) ─────────────────
// Called during GARMENT GRN approval to:
//  1. Deduct consumed + wasted material from Supplier's virtual inventory
//  2. Compute pendingQty (what's still at tailor's end)
//  3. Create a full MaterialConsumption audit record

const settleConsumption = async ({ grnId, supplierId, warehouseId, jobWorkId, consumptionDetails, userId }, session) => {
    if (!consumptionDetails || consumptionDetails.length === 0) return null;

    const settledItems = [];
    const stockService = require('../../services/stock.service');

    for (const detail of consumptionDetails) {
        const usedQty = Number(detail.usedQty || 0);
        const wasteQty = Number(detail.wasteQty || 0);
        const pendingQty = Number(detail.pendingQty || 0);

        const totalDeduction = usedQty + wasteQty;

        if (totalDeduction > 0 && detail.barcode && warehouseId) {
            // Deduct directly from Warehouse Inventory utilizing stockService
            try {
                await stockService.removeStock({
                    itemId: detail.itemId,
                    barcode: detail.barcode,
                    variantId: detail.variantId,
                    locationId: warehouseId,
                    locationType: 'WAREHOUSE',
                    qty: totalDeduction,
                    type: 'MANUFACTURING_CONSUMPTION',
                    referenceId: grnId,
                    referenceType: 'GRN',
                    performedBy: userId,
                    session
                });
                console.log(`[CONSUMPTION] ${detail.barcode}: deducted ${totalDeduction} from warehouse ${warehouseId}`);
            } catch (err) {
                console.warn(`[CONSUMPTION-WARNING] Failed to deduct ${detail.barcode} from warehouse ${warehouseId}: ${err.message}`);
                throw new Error(`Fabric consumption failed: ${err.message}`);
            }
        }

        settledItems.push({
            itemId: detail.itemId,
            variantId: detail.variantId,
            barcode: detail.barcode,
            itemName: detail.itemName,
            itemCode: detail.itemCode,
            uom: detail.uom || 'MTR',
            usedQty,
            wasteQty,
            pendingQty,
            notes: detail.notes || ''
        });
    }

    // Create the MaterialConsumption audit record
    const consumptionNumber = await generateConsumptionNumber(session);
    const record = await MaterialConsumption.create([{
        consumptionNumber,
        supplierId,
        jobWorkId: jobWorkId || null,
        grnId,
        items: settledItems,
        status: 'SETTLED',
        consumptionDate: new Date(),
    }], { session });

    console.log(`[CONSUMPTION] Created record: ${consumptionNumber} for GRN: ${grnId}`);
    return record[0];
};

// ─── Step 1: Create GRN (Draft) ───────────────────────────────────────────────

const createGRN = async (grnData, userId) => {
    return await withTransaction(async (session) => {
        const {
            grnType = 'FABRIC', // Default to FABRIC for safety
            purchaseId, purchaseOrderId,
            supplierId, warehouseId,
            invoiceNumber, invoiceDate,
            remarks, items,
            jobWorkId,
            consumptionDetails
        } = grnData;

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

        // 2. For GARMENT GRN, Job Work Reference is recommended
        if (grnType === 'GARMENT' && !jobWorkId) {
            console.warn('[GRN-CREATE] Garment GRN created without Job Work Reference. Consumption will be manual-only.');
        }

        // 3. Process line items
        const processedItems = [];

        for (const item of items) {
            const itemId = item.itemId || item.productId;
            const variantId = item.variantId;
            let sku = item.sku;

            // FAIL-SAFE: Recover SKU + itemName + uom from Item Master if missing
            let masterItem = null;
            if (!sku && itemId) {
                masterItem = await Item.findById(itemId).session(session);
                if (masterItem?.sizes) {
                    const variant = masterItem.sizes.find(v => (v._id || v.id).toString() === variantId?.toString());
                    sku = variant?.sku;
                }
                if (!sku) sku = masterItem?.sku || masterItem?.itemCode;
            } else if (itemId) {
                masterItem = await Item.findById(itemId).session(session);
            }

            // Tax logic: Only compute for FABRIC and ACCESSORY
            let taxPercent = 0;
            let taxAmount = 0;
            let totalWithTax = 0;

            if (grnType !== 'GARMENT') {
                taxPercent = Number(item.taxPercent || item.tax || 0);
                const baseValue = Number(item.costPrice || 0) * Number(item.receivedQty || 0);
                taxAmount = (baseValue * taxPercent) / 100;
                totalWithTax = baseValue + taxAmount;
            }

            processedItems.push({
                itemId,
                variantId,
                sku: sku || 'N/A',
                itemName: item.itemName || masterItem?.itemName || '',
                size: item.size || '',
                color: item.color || '',
                uom: item.uom || masterItem?.uom || 'PCS',
                receivedQty: Number(item.receivedQty || 0),
                costPrice: Number(item.costPrice || 0),
                taxPercent,
                taxAmount,
                totalWithTax,
                discount: Number(item.discount || 0),
                batchNumber: item.batchNumber || `B-${Date.now().toString().slice(-6)}`
            });
        }

        // 4. Compute invoice-level totals
        const totalQty = processedItems.reduce((s, i) => s + i.receivedQty, 0);
        const totalValue = processedItems.reduce((s, i) => s + (i.costPrice * i.receivedQty), 0);
        const totalTaxAmount = processedItems.reduce((s, i) => s + i.taxAmount, 0);
        const grandTotal = totalValue + totalTaxAmount;

        const grnNumber = await generateGrnNumber(session);

        const grn = new GRN({
            grnNumber,
            grnType,
            purchaseId: purchaseId || null,
            purchaseOrderId: purchaseOrderId || null,
            jobWorkId: jobWorkId || null,
            supplierId,
            warehouseId,
            invoiceNumber,
            invoiceDate,
            remarks,
            items: processedItems,
            consumptionDetails: consumptionDetails || [],
            totalQty,
            totalValue,
            totalTaxAmount,
            grandTotal,
            receivedBy: userId,
            status: GrnStatus.DRAFT
        });

        await grn.save({ session });

        // Link to workflow if parent doc exists
        if (purchaseOrderId || purchaseId) {
            const parentId = purchaseOrderId || purchaseId;
            const parentType = purchaseOrderId ? DocumentType.PO : DocumentType.PURCHASE;
            await workflowService.linkDocuments(parentId, grn._id, parentType, DocumentType.GRN);
        }
        await workflowService.updateStatus(grn._id, DocumentType.GRN, null, GrnStatus.DRAFT, userId, `Created ${grnType} GRN ${grnNumber}`);

        return grn;
    });
};

// ─── Step 2: Approve GRN & Post Stock ────────────────────────────────────────

const approveGRN = async (id, userId) => {
    return await withTransaction(async (session) => {
        const grn = await GRN.findOne({ _id: id, isDeleted: false }).session(session);
        if (!grn) throw new Error('GRN not found');
        if (grn.status !== GrnStatus.DRAFT) throw new Error(`GRN cannot be approved in ${grn.status} status`);

        const { grnType } = grn;
        const oldStatus = grn.status;

        console.log(`[GRN-APPROVAL] Type: ${grnType}, GRN: ${grn.grnNumber}, Warehouse: ${grn.warehouseId}`);

        // 1. Post Physical Stock to Warehouse (All types)
        const stockService = require('../../services/stock.service');

        for (const item of grn.items) {
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

        // 2. TYPE-SPECIFIC POST-PROCESSING
        if (grnType === 'FABRIC' || grnType === 'ACCESSORY') {
            // ─── Fabric / Accessory: Finalize tax totals ────────────────────
            // Re-compute totals from stored line items
            const totalTaxAmount = grn.items.reduce((s, i) => s + (i.taxAmount || 0), 0);
            const totalValue = grn.items.reduce((s, i) => s + (i.costPrice * i.receivedQty), 0);
            grn.totalTaxAmount = totalTaxAmount;
            grn.grandTotal = totalValue + totalTaxAmount;

            console.log(`[GRN-APPROVAL] ${grnType} GRN — Tax posted: ₹${totalTaxAmount.toFixed(2)}, Grand Total: ₹${grn.grandTotal.toFixed(2)}`);

        } else if (grnType === 'GARMENT') {
            // ─── Garment (Job Work Return): Settle material consumption ─────
            console.log(`[GRN-APPROVAL] GARMENT GRN — Processing material consumption settlement...`);
            
            if (grn.consumptionDetails && grn.consumptionDetails.length > 0) {
                await settleConsumption({
                    grnId: grn._id,
                    supplierId: grn.supplierId,
                    warehouseId: grn.warehouseId,
                    userId,
                    jobWorkId: grn.jobWorkId,
                    consumptionDetails: grn.consumptionDetails,
                }, session);
            } else {
                console.warn(`[GRN-APPROVAL] GARMENT GRN approved with no consumption details. Supplier inventory NOT adjusted.`);
            }

            // GARMENT GRN has zero tax
            grn.totalTaxAmount = 0;
            grn.grandTotal = grn.totalValue;
        }

        // 3. Update Approval Status
        grn.status = GrnStatus.APPROVED;
        await grn.save({ session });

        // 4. Update Purchase Order Fulfillment if linked
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

        await workflowService.updateStatus(
            grn._id, DocumentType.GRN, oldStatus, GrnStatus.APPROVED, userId,
            `Approved ${grnType} GRN ${grn.grnNumber} and posted stock to warehouse.`
        );

        return grn;
    });
};

// ─── Read Operations ──────────────────────────────────────────────────────────

const getGRNById = async (id) => {
    return await GRN.findOne({ _id: id, isDeleted: false })
        .populate('supplierId', 'name supplierName')
        .populate('warehouseId', 'name')
        .populate('purchaseOrderId', 'poNumber items')
        .populate('jobWorkId', 'outwardNumber outwardDate')
        .populate('items.itemId', 'itemName itemCode uom gstPercent sizes');
};

const getGrnsByPurchase = async (purchaseId) => {
    return await GRN.find({ purchaseId, isDeleted: false }).sort({ createdAt: -1 });
};

const getAllGrns = async (filters = {}) => {
    const query = { isDeleted: false };
    if (filters.grnType) query.grnType = filters.grnType;
    if (filters.supplierId) query.supplierId = filters.supplierId;
    if (filters.status) query.status = filters.status;

    return await GRN.find(query)
        .populate('supplierId', 'name supplierName')
        .populate('warehouseId', 'name')
        .populate('items.itemId', 'itemName itemCode uom')
        .sort({ createdAt: -1 });
};

const getNextSuggestedNumber = async () => {
    return await generateGrnNumber();
};

// ─── Update GRN (Draft only) ──────────────────────────────────────────────────

const updateGRN = async (id, updateData, userId) => {
    return await withTransaction(async (session) => {
        const grn = await GRN.findOne({ _id: id, isDeleted: false }).session(session);
        if (!grn) throw new Error('GRN not found');
        if (grn.status !== GrnStatus.DRAFT) throw new Error('Only DRAFT GRNs can be updated');

        // Re-compute tax if items changed and not GARMENT type
        if (updateData.items) {
            const grnType = updateData.grnType || grn.grnType;
            updateData.items = updateData.items.map(item => {
                if (grnType !== 'GARMENT') {
                    const taxPercent = Number(item.taxPercent || 0);
                    const baseValue = Number(item.costPrice || 0) * Number(item.receivedQty || 0);
                    item.taxAmount = (baseValue * taxPercent) / 100;
                    item.totalWithTax = baseValue + item.taxAmount;
                } else {
                    item.taxPercent = 0;
                    item.taxAmount = 0;
                    item.totalWithTax = Number(item.costPrice || 0) * Number(item.receivedQty || 0);
                }
                return item;
            });

            updateData.totalQty = updateData.items.reduce((s, i) => s + Number(i.receivedQty || 0), 0);
            updateData.totalValue = updateData.items.reduce((s, i) => s + (Number(i.costPrice || 0) * Number(i.receivedQty || 0)), 0);
            updateData.totalTaxAmount = updateData.items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
            updateData.grandTotal = updateData.totalValue + updateData.totalTaxAmount;
        }

        Object.assign(grn, updateData);
        await grn.save({ session });
        return grn;
    });
};

// const getAllGrns = async () => {
//     return await GRN.find({ isDeleted: false })
//         .populate('supplierId', 'name supplierName')
//         .populate('warehouseId', 'name')
//         .populate('items.itemId', 'itemName itemCode shade gstPercent sizes')
//         .sort({ createdAt: -1 });
// };

module.exports = {
    createGRN,
    approveGRN,
    updateGRN,
    getGRNById,
    getGrnsByPurchase,
    getAllGrns,
    getNextSuggestedNumber
};
