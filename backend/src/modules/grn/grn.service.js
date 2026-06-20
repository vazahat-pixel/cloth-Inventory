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

const activeGrnLocks = new Set();

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
                    variantId: detail.variantId || detail.itemId,
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

// ─── Opening Balance: Batch-Optimized Handler ─────────────────────────────────

const _createOpeningBalanceGRN = async (grnData, userId) => {
    const {
        warehouseId,
        remarks, items,
        supplierId, invoiceNumber, invoiceDate
    } = grnData;

    if (!warehouseId) throw new Error('Warehouse is required for Opening Balance entry');
    if (!items || items.length === 0) throw new Error('At least one item is required');

    // 1. Create the GRN Header in a quick transaction
    const grn = await withTransaction(async (session) => {
        const processedItems = items.map(item => ({
            itemId: item.itemId,
            variantId: item.variantId || item.itemId.toString(),
            sku: item.sku || item.barcode || 'OB-ENTRY',
            itemName: item.itemName || '',
            size: item.size || '',
            color: item.color || '',
            uom: item.uom || 'PCS',
            receivedQty: Number(item.receivedQty || item.qty || 0),
            costPrice: Number(item.costPrice || item.rate || 0),
            taxPercent: 0,
            taxAmount: 0,
            totalWithTax: Number(item.costPrice || 0) * Number(item.receivedQty || 0),
            discount: 0,
            batchNumber: `OB-${Date.now().toString().slice(-6)}`
        }));

        const totalQty = processedItems.reduce((s, i) => s + i.receivedQty, 0);
        const totalValue = processedItems.reduce((s, i) => s + (i.costPrice * i.receivedQty), 0);
        const grnNumber = await generateGrnNumber(session);

        const newGrn = new GRN({
            grnNumber,
            grnType: 'OPENING_BALANCE',
            supplierId: supplierId || null,
            warehouseId,
            invoiceNumber: invoiceNumber || `OB-${new Date().getFullYear()}`,
            invoiceDate: invoiceDate || new Date(),
            remarks: remarks || 'Opening Balance Stock Entry (Bulk)',
            items: processedItems,
            totalQty,
            totalValue,
            totalTaxAmount: 0,
            grandTotal: totalValue,
            receivedBy: userId,
            status: GrnStatus.DRAFT
        });
        await newGrn.save({ session });
        return newGrn;
    });

    // 2. Process stock in batches, each with its own transaction to avoid timeout
    const stockService = require('../../services/stock.service');
    const validItems = grn.items.filter(i => i.receivedQty > 0).map(item => ({
        itemId: item.itemId,
        variantId: item.variantId,
        barcode: item.sku,
        receivedQty: item.receivedQty,
        costPrice: item.costPrice
    }));

    if (validItems.length > 0) {
        const BATCH_SIZE = 500;
        console.log(`🚀 [GRN-DEBUG] Starting Bulk Stock Post for ${validItems.length} items in batches of ${BATCH_SIZE}... WarehouseID: ${warehouseId}`);
        
        for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
            const batch = validItems.slice(i, i + BATCH_SIZE);
            await withTransaction(async (session) => {
                await stockService.bulkAddStock(batch, {
                    referenceId: grn._id,
                    referenceType: 'GRN',
                    performedBy: userId,
                    locationId: warehouseId,
                    locationType: 'WAREHOUSE',
                    session
                });
            });
            console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} processed (${Math.min(i + BATCH_SIZE, validItems.length)}/${validItems.length})`);
        }
    }

    // 3. Finalize GRN Status
    await withTransaction(async (session) => {
        const finalGrn = await GRN.findById(grn._id).session(session);
        finalGrn.status = GrnStatus.APPROVED;
        await finalGrn.save({ session });
        await workflowService.updateStatus(finalGrn._id, DocumentType.GRN, GrnStatus.DRAFT, GrnStatus.APPROVED, userId, `Opening Balance GRN ${finalGrn.grnNumber} posted in bulk`);
    });

    return grn;
};

// ─── Step 1: Create GRN (Draft) ───────────────────────────────────────────────

const createGRN = async (grnData, userId) => {
    // Calculate totalQty and totalValue from input items
    const inputItems = grnData.items || [];
    const totalQty = inputItems.reduce((s, i) => s + Number(i.receivedQty || i.qty || 0), 0);
    const totalValue = inputItems.reduce((s, i) => s + (Number(i.costPrice || i.rate || 0) * Number(i.receivedQty || i.qty || 0)), 0);

    const lockKey = `${String(grnData.warehouseId || '')}_${String(grnData.grnType || 'FABRIC')}_${totalQty}_${totalValue}`;

    if (activeGrnLocks.has(lockKey)) {
        throw new Error('A similar GRN is currently being processed. Please wait.');
    }

    activeGrnLocks.add(lockKey);

    try {
        // For Opening Balance with 9000+ items, we handle transactions internally per batch
        // to avoid MongoDB 'transactionLifetimeLimitSeconds' (60s) timeout.
        if (grnData.grnType === 'OPENING_BALANCE') {
            return await _createOpeningBalanceGRN(grnData, userId);
        }

        return await withTransaction(async (session) => {
            const {
                grnType = 'FABRIC',
                purchaseId, purchaseOrderId,
                supplierId, warehouseId,
                invoiceNumber, invoiceDate,
                remarks, items,
                jobWorkId,
                consumptionDetails
            } = grnData;

            // Clean empty string object references to prevent CastError in MongoDB
            const cleanPurchaseId = purchaseId === '' ? null : purchaseId;
            const cleanPurchaseOrderId = purchaseOrderId === '' ? null : purchaseOrderId;
            const cleanJobWorkId = jobWorkId === '' ? null : jobWorkId;
            const cleanSupplierId = supplierId === '' ? null : supplierId;

            // Check database for similar GRN created in last 60s
            const sixtySecondsAgo = new Date(Date.now() - 60000);
            const duplicateGrn = await GRN.findOne({
                warehouseId,
                grnType,
                totalQty,
                totalValue,
                createdAt: { $gte: sixtySecondsAgo },
                isDeleted: false
            }).session(session);

            if (duplicateGrn) {
                throw new Error(`A similar GRN (${duplicateGrn.grnNumber}) was already created in the last 60 seconds.`);
            }

            // 1. Validate Parent Document (Optional for Direct GRN)
            let parentDoc = null;
            if (cleanPurchaseOrderId) {
                const PurchaseOrder = require('../../models/purchaseOrder.model');
                parentDoc = await PurchaseOrder.findById(cleanPurchaseOrderId).session(session);
                if (!parentDoc) throw new Error('Purchase Order not found');
            } else if (cleanPurchaseId) {
                parentDoc = await Purchase.findById(cleanPurchaseId).session(session);
                if (!parentDoc) throw new Error('Purchase document not found');
            }

            // 2. For GARMENT GRN, Job Work Reference is recommended
            if (grnType === 'GARMENT' && !cleanJobWorkId) {
                console.warn('[GRN-CREATE] Garment GRN created without Job Work Reference. Consumption will be manual-only.');
            }

            // 3. Process line items
            const processedItems = [];

            for (const item of items) {
                let itemId = item.itemId || item.productId;
                if (itemId && typeof itemId === 'object') {
                    itemId = itemId._id || itemId.id;
                }
                let variantId = item.variantId;
                if (variantId && typeof variantId === 'object') {
                    variantId = variantId._id || variantId.id;
                }
                let sku = item.sku;

                // 1. FAIL-SAFE: Recover SKU + itemName + uom from Item Master if missing
                let masterItem = await Item.findById(itemId).session(session);
                if (!masterItem) throw new Error(`Item ${itemId} not found in master`);

                // 2. Handle missing variantId for non-garment items
                if (!variantId || variantId === 'undefined') {
                    // If garment, we need a variant. If not, we use the itemId as variantId
                    if (masterItem.type === 'GARMENT') {
                        throw new Error(`Variant ID is required for Garment item: ${masterItem.itemName}`);
                    }
                    variantId = itemId.toString(); // Use itemId as surrogate variantId
                }

                // 3. Handle missing SKU
                if (!sku || sku === 'N/A' || sku === 'undefined') {
                    if (masterItem.sizes && variantId) {
                        const variant = masterItem.sizes.find(v => (v._id || v.id).toString() === variantId.toString());
                        sku = variant?.sku || variant?.barcode;
                    }
                    if (!sku) sku = masterItem.sku || masterItem.itemCode || 'DIRECT';
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
            const computedTotalQty = processedItems.reduce((s, i) => s + i.receivedQty, 0);
            const computedTotalValue = processedItems.reduce((s, i) => s + (i.costPrice * i.receivedQty), 0);
            const totalTaxAmount = processedItems.reduce((s, i) => s + i.taxAmount, 0);
            const grandTotal = computedTotalValue + totalTaxAmount;

            const grnNumber = await generateGrnNumber(session);

            const grn = new GRN({
                grnNumber,
                grnType,
                purchaseId: cleanPurchaseId || null,
                purchaseOrderId: cleanPurchaseOrderId || null,
                jobWorkId: cleanJobWorkId || null,
                supplierId: cleanSupplierId || null,
                warehouseId,
                invoiceNumber,
                invoiceDate,
                remarks,
                items: processedItems,
                consumptionDetails: consumptionDetails || [],
                totalQty: computedTotalQty,
                totalValue: computedTotalValue,
                totalTaxAmount,
                grandTotal,
                receivedBy: userId,
                status: GrnStatus.DRAFT
            });

            await grn.save({ session });

            // Link to workflow if parent doc exists
            if (cleanPurchaseOrderId || cleanPurchaseId) {
                const parentId = cleanPurchaseOrderId || cleanPurchaseId;
                const parentType = cleanPurchaseOrderId ? DocumentType.PO : DocumentType.PURCHASE;
                await workflowService.linkDocuments(parentId, grn._id, parentType, DocumentType.GRN);
            }
            await workflowService.updateStatus(grn._id, DocumentType.GRN, null, GrnStatus.DRAFT, userId, `Created ${grnType} GRN ${grnNumber}`);

            return grn;
        });
    } finally {
        activeGrnLocks.delete(lockKey);
    }
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
                variantId: item.variantId || item.itemId,
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

const getAllGrns = async (query = {}) => {
    const { getPagination, buildPaginationMeta, getSort } = require('../../utils/pagination.helper');
    const { page, limit, skip } = getPagination(query);
    const { search, status, grnType, supplierId } = query;

    const match = { isDeleted: false };
    if (status) match.status = status;
    if (grnType) match.grnType = grnType;
    if (supplierId) match.supplierId = supplierId;
    if (search) {
        match.$or = [
            { grnNumber: { $regex: search, $options: 'i' } },
            { invoiceNumber: { $regex: search, $options: 'i' } },
        ];
    }

    const sort = getSort(query, {
        grnNumber: 'grnNumber',
        createdAt: 'createdAt',
        status: 'status',
        invoiceNumber: 'invoiceNumber',
    }, { createdAt: -1 });

    const [facet] = await GRN.aggregate([
        { $match: match },
        { $sort: sort },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            grnNumber: 1,
                            grnType: 1,
                            createdAt: 1,
                            invoiceNumber: 1,
                            status: 1,
                            supplierId: 1,
                            warehouseId: 1,
                            totalQty: 1,
                            grandTotal: 1,
                            itemLineCount: { $size: { $ifNull: ['$items', []] } },
                        },
                    },
                    {
                        $lookup: {
                            from: 'suppliers',
                            localField: 'supplierId',
                            foreignField: '_id',
                            as: 'supplierDoc',
                            pipeline: [{ $project: { name: 1, supplierName: 1 } }],
                        },
                    },
                    {
                        $addFields: {
                            supplierId: { $arrayElemAt: ['$supplierDoc', 0] },
                        },
                    },
                    { $project: { supplierDoc: 0 } },
                ],
                total: [{ $count: 'count' }],
            },
        },
    ]);

    const grns = facet?.data || [];
    const total = facet?.total?.[0]?.count || 0;
    return { grns, total, page, limit, meta: buildPaginationMeta(total, page, limit) };
};

const getNextSuggestedNumber = async () => {
    return await generateGrnNumber();
};

// ─── Update GRN (Draft or Approved with stock adjustment) ──────────────────────

const updateGRN = async (id, updateData, userId) => {
    return await withTransaction(async (session) => {
        const grn = await GRN.findOne({ _id: id, isDeleted: false }).session(session);
        if (!grn) throw new Error('GRN not found');
        
        if (grn.status !== GrnStatus.DRAFT && grn.status !== GrnStatus.APPROVED) {
            throw new Error(`GRN cannot be updated in ${grn.status} status`);
        }

        // 1. If GRN was already APPROVED, revert the stock movements and consumption details of the old state
        if (grn.status === GrnStatus.APPROVED) {
            console.log(`[GRN-UPDATE] Reverting old APPROVED GRN stock/consumption movements for GRN: ${grn.grnNumber}`);
            const stockService = require('../../services/stock.service');

            // Revert physical stock for each old item
            for (const item of grn.items) {
                await stockService.removeStock({
                    itemId: item.itemId,
                    barcode: item.sku,
                    variantId: item.variantId || item.itemId,
                    locationId: grn.warehouseId,
                    locationType: 'WAREHOUSE',
                    qty: item.receivedQty,
                    type: 'GRN_REVERSAL',
                    referenceId: grn._id,
                    referenceType: 'GRN',
                    performedBy: userId,
                    session
                });
            }

            // Revert Job Work fabric consumption if GARMENT type
            if (grn.grnType === 'GARMENT' && grn.consumptionDetails && grn.consumptionDetails.length > 0) {
                for (const detail of grn.consumptionDetails) {
                    const totalConsumption = Number(detail.usedQty || 0) + Number(detail.wasteQty || 0);
                    if (totalConsumption > 0 && detail.barcode && grn.warehouseId) {
                        await stockService.addStock({
                            itemId: detail.itemId,
                            barcode: detail.barcode,
                            variantId: detail.variantId || detail.itemId,
                            locationId: grn.warehouseId,
                            locationType: 'WAREHOUSE',
                            qty: totalConsumption,
                            type: 'MANUFACTURING_CONSUMPTION_REVERSAL',
                            referenceId: grn._id,
                            referenceType: 'GRN',
                            performedBy: userId,
                            session
                        });
                    }
                }
                // Delete old MaterialConsumption records linked to this GRN so they can be re-created
                await MaterialConsumption.deleteMany({ grnId: grn._id }).session(session);
            }

            // Revert Purchase Order quantities if PO is linked
            if (grn.purchaseOrderId) {
                const PurchaseOrder = require('../../models/purchaseOrder.model');
                const po = await PurchaseOrder.findById(grn.purchaseOrderId).session(session);
                if (po) {
                    for (const item of grn.items) {
                        const poItem = po.items.find(i => i.variantId?.toString() === item.variantId?.toString());
                        if (poItem) {
                            poItem.receivedQty = Math.max(0, (poItem.receivedQty || 0) - item.receivedQty);
                        }
                    }
                    await po.save({ session });
                }
            }
        }

        // Clean empty string object references to prevent CastError in MongoDB
        if (updateData.purchaseOrderId === '') updateData.purchaseOrderId = null;
        if (updateData.purchaseId === '') updateData.purchaseId = null;
        if (updateData.jobWorkId === '') updateData.jobWorkId = null;
        if (updateData.supplierId === '') updateData.supplierId = null;

        if (updateData.items) {
            const grnType = updateData.grnType || grn.grnType;
            updateData.items = updateData.items.map(item => {
                if (item.itemId && typeof item.itemId === 'object') {
                    item.itemId = item.itemId._id || item.itemId.id;
                }
                if (item.variantId && typeof item.variantId === 'object') {
                    item.variantId = item.variantId._id || item.variantId.id;
                }
                if (!item.sku) item.sku = 'N/A';
                if (!item.variantId) item.variantId = item.sku || 'UNKNOWN';
                if (!item.uom) item.uom = 'PCS';

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

        // 2. Save the updated details to the GRN document
        Object.assign(grn, updateData);
        await grn.save({ session });

        // 3. If APPROVED, post the new stock levels, consumption details, and update PO fulfillment
        if (grn.status === GrnStatus.APPROVED) {
            console.log(`[GRN-UPDATE] Posting new APPROVED GRN stock/consumption movements for GRN: ${grn.grnNumber}`);
            const stockService = require('../../services/stock.service');

            // Post physical stock to warehouse
            for (const item of grn.items) {
                await stockService.addStock({
                    itemId: item.itemId,
                    barcode: item.sku,
                    variantId: item.variantId || item.itemId,
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

            // Post new Job Work consumption details if GARMENT type
            if (grn.grnType === 'GARMENT' && grn.consumptionDetails && grn.consumptionDetails.length > 0) {
                await settleConsumption({
                    grnId: grn._id,
                    supplierId: grn.supplierId,
                    warehouseId: grn.warehouseId,
                    userId,
                    jobWorkId: grn.jobWorkId,
                    consumptionDetails: grn.consumptionDetails,
                }, session);
            }

            // Update Purchase Order fulfillment if linked
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
                    else po.status = PurchaseOrderStatus.APPROVED;
                    await po.save({ session });
                }
            }
        }

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
    getNextSuggestedNumber,
};
