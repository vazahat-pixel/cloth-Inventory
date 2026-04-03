const Purchase = require('../../models/purchase.model');
const Item = require('../../models/item.model');
const Supplier = require('../../models/supplier.model');
const Account = require('../../models/account.model');
const { calculateGST } = require('../../services/gst.service');
const { addStock, removeStock } = require('../../services/stock.service');
const { createJournalEntries } = require('../../services/ledger.service');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');
const { PurchaseStatus, StockMovementType, DocumentType, GrnStatus, PurchaseOrderStatus } = require('../../core/enums');
const workflowService = require('../workflow/workflow.service.js');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const barcodeService = require('../../services/barcode.service');
const PurchaseOrder = require('../../models/purchaseOrder.model');

const toNumber = (v) => Number(v) || 0;

const createPurchase = async (purchaseData, userId) => {
    return await withTransaction(async (session) => {
        // Support both field names: 'items' (new form) OR 'products' (legacy)
        const items = purchaseData.items || purchaseData.products || [];
        // Support both 'warehouseId' (new form) and 'storeId' (legacy)
        const storeId = purchaseData.warehouseId || purchaseData.storeId;
        const invoiceNumber = (purchaseData.invoiceNumber || '').trim();
        const invoiceDate = purchaseData.invoiceDate;
        const { supplierId, grnId } = purchaseData;
        // Support otherCharges from direct field or nested inside totals object
        const otherCharges = toNumber(purchaseData.otherCharges ?? purchaseData.totals?.otherCharges);

        // Duplicate Invoice Check: One GRN = One Purchase Voucher
        if (grnId) {
            const existing = await Purchase.findOne({ grnId, status: { $ne: PurchaseStatus.CANCELLED } }).session(session);
            if (existing) throw new Error(`A Purchase Voucher (${existing.purchaseNumber}) is already linked to this GRN.`);
        }

        const supplier = await Supplier.findOne({ _id: supplierId, isDeleted: false, isActive: true }).session(session);
        if (!supplier) throw new Error('Supplier not found or inactive');

        const year = new Date().getFullYear();
        const seq = await getNextSequence(`PURCHASE_${year}`, session);
        const purchaseNumber = `PUR-${year}-${seq.toString().padStart(6, '0')}`;

        let subTotal = 0;
        let totalTax = 0;
        const processedProducts = [];

        for (const item of items) {
            if (!item.variantId && !item.itemId) {
                throw new Error(`Item entry missing both variantId and itemId. Received: ${JSON.stringify(item)}`);
            }

            // Find Item doc: prefer variantId lookup (finds by size variant), fallback to itemId
            let itemDoc = null;
            if (item.variantId) {
                itemDoc = await Item.findOne({ "sizes._id": item.variantId }).session(session);
            }
            if (!itemDoc && item.itemId) {
                itemDoc = await Item.findById(item.itemId).session(session);
            }
            if (!itemDoc) {
                throw new Error(`Item not found. variantId: ${item.variantId}, itemId: ${item.itemId}`);
            }
            
            const variantEntry = item.variantId ? itemDoc.sizes.id(item.variantId) : itemDoc.sizes[0];


            const quantity = toNumber(item.quantity);
            const rate = toNumber(item.rate);
            // Support both field names: 'discount' (new form) and 'discountPercentage' (legacy)
            const discPercent = toNumber(item.discount ?? item.discountPercentage);
            
            const grossValue = rate * quantity;
            const discountAmount = (grossValue * discPercent) / 100;
            const taxableAmount = grossValue - discountAmount;

            // Support both field names: 'tax' (new form) and 'taxPercentage' (legacy)
            let taxPercent = toNumber(item.tax ?? item.taxPercentage);
            if (taxPercent === 0) {
               // Fallback to Item Master Tax
               taxPercent = itemDoc.gstTax || 0;
            }

            const gstData = calculateGST(taxableAmount, taxPercent);
            const total = taxableAmount + gstData.totalTax;

            processedProducts.push({
                itemId: itemDoc._id,
                variantId: item.variantId,
                itemCode: itemDoc.itemCode,
                itemName: itemDoc.itemName,
                size: variantEntry ? variantEntry.size : (item.size || ''),
                color: itemDoc.shade || item.color || '',
                sku: (variantEntry ? variantEntry.sku : null) || item.sku || itemDoc.itemCode,
                quantity,
                rate,
                discount: discPercent,
                discountPercentage: discPercent,
                tax: taxPercent,
                taxPercentage: taxPercent,
                taxableAmount,
                gstPercent: taxPercent,
                gstAmount: gstData.totalTax,
                total,
                lotNumber: item.lotNumber || item.batchNumber || '',
                batchNo: item.batchNo || item.batchNumber || 'DEFAULT'
            });

            subTotal += taxableAmount;
            totalTax += gstData.totalTax;
        }

        const grandTotal = subTotal + totalTax + otherCharges;

        const purchase = new Purchase({
            purchaseNumber,
            supplierId,
            storeId,
            storeType: 'Warehouse', // Purchases are Procurement, thus directed to a Warehouse
            invoiceNumber,
            invoiceDate,
            products: processedProducts,
            subTotal,
            totalTax,
            otherCharges,
            grandTotal,
            status: PurchaseStatus.DRAFT,
            grnStatus: purchaseData.grnStatus || 'DRAFT',
            grnId: grnId || null,
            purchaseOrderId: purchaseData.purchaseOrderId || null,
            createdBy: userId,
            notes: purchaseData.notes || ''
        });

        await purchase.save({ session });

        // Update GRN: mark as INVOICED and link to this Purchase Voucher
        if (grnId) {
            const GRN = require('../../models/grn.model');
            const grn = await GRN.findById(grnId).session(session);
            if (grn) {
                grn.purchaseId = purchase._id;
                // Mark GRN as INVOICED - the physical receipt has been billed
                if (grn.status === GrnStatus.APPROVED) {
                    grn.status = 'INVOICED';
                }
                await grn.save({ session });

                // Also link PO if GRN was from a PO
                if (grn.purchaseOrderId && !purchase.purchaseOrderId) {
                    await Purchase.findByIdAndUpdate(
                        purchase._id,
                        { purchaseOrderId: grn.purchaseOrderId },
                        { session }
                    );
                }
            }
        }

        await createAuditLog({
            action: 'CREATE_PURCHASE',
            module: 'PURCHASE',
            performedBy: userId,
            targetId: purchase._id,
            targetModel: 'Purchase',
            session
        });

        return await Purchase.findById(purchase._id)
            .populate('supplierId', 'name')
            .populate('storeId', 'name')
            .populate('products.itemId', 'itemName itemCode shade');
    });
};

const postVoucher = async (purchaseId, userId) => {
    return await withTransaction(async (session) => {
        const purchase = await Purchase.findById(purchaseId).session(session);
        if (!purchase) throw new Error('Purchase record not found');
        if (purchase.status !== 'DRAFT') throw new Error(`Document status is ${purchase.status}. Only DRAFT vouchers can be posted.`);

        // Finalize status: POSTED = Accounting books updated
        purchase.status = 'POSTED';
        await purchase.save({ session });

        // Update PO Status if present (ensure PO is updated based on what's physically billed)
        if (purchase.purchaseOrderId) {
            const po = await PurchaseOrder.findById(purchase.purchaseOrderId).session(session);
            if (po) {
                // UPDATE BILLED QTY (Financial)
                for (const item of purchase.products) {
                    const poItem = po.items.find(i => i.variantId?.toString() === item.variantId?.toString());
                    if (poItem) {
                        poItem.billedQty = (poItem.billedQty || 0) + item.quantity;
                    }
                }
                
                // If PO is already fully received (physically), mark it as completed now that it's billed
                let isFullyReceived = true;
                for (const poItem of po.items) {
                    if ((poItem.receivedQty || 0) < poItem.qty) isFullyReceived = false;
                }
                
                if (isFullyReceived) {
                   po.status = PurchaseOrderStatus.COMPLETED;
                }

                await po.save({ session });
            }
        }

        await createAuditLog({
            action: 'POST_PURCHASE_VOUCHER',
            module: 'Purchase',
            performedBy: userId,
            details: { purchaseNumber: purchase.purchaseNumber, supplierId: purchase.supplierId, total: purchase.grandTotal },
            session
        });

        // ERP Financial Integration: Create Journal Entries
        const inventoryAccount = await Account.findOne({ name: 'Stock in Hand' }).session(session);
        const payableAccount = await Account.findOne({ _id: purchase.supplierId }).session(session) || 
                               await Account.findOne({ name: 'Accounts Payable' }).session(session);

        if (inventoryAccount && payableAccount) {
            await createJournalEntries([
                {
                    voucherType: 'PURCHASE',
                    voucherId: purchase._id,
                    accountId: inventoryAccount._id,
                    debit: purchase.subTotal,
                    credit: 0,
                    narration: `Purchase Bill ${purchase.invoiceNumber || purchase.purchaseNumber} recorded`,
                    createdBy: userId
                },
                {
                    voucherType: 'PURCHASE',
                    voucherId: purchase._id,
                    accountId: payableAccount._id,
                    debit: 0,
                    credit: purchase.grandTotal,
                    narration: `Bill from ${purchase.supplierId?.name || 'Supplier'} ref ${purchase.invoiceNumber}`,
                    createdBy: userId
                }
            ], session);
        }
        return purchase;
    });
};

const updatePurchase = async (id, updateData, userId) => {
    return await withTransaction(async (session) => {
        const purchase = await Purchase.findById(id).session(session);
        if (!purchase) throw new Error('Purchase record not found');
        if (purchase.status === 'POSTED') throw new Error('Cannot edit a posted purchase');
        if (purchase.status === 'CANCELLED') throw new Error('Cannot edit a cancelled purchase');

        const items = updateData.items || updateData.products || [];
        const storeId = updateData.warehouseId || updateData.storeId || purchase.storeId;
        const supplierId = updateData.supplierId || purchase.supplierId;
        const otherCharges = toNumber(updateData.otherCharges ?? updateData.totals?.otherCharges ?? purchase.otherCharges);

        const processedProducts = [];
        let subTotal = 0;
        let totalTax = 0;

        for (const item of items) {
            let itemDoc = null;
            if (item.variantId) {
                itemDoc = await Item.findOne({ "sizes._id": item.variantId }).session(session);
            }
            if (!itemDoc && item.itemId) {
                itemDoc = await Item.findById(item.itemId).session(session);
            }
            if (!itemDoc) continue; // Or throw error

            const variantEntry = item.variantId ? itemDoc.sizes.id(item.variantId) : itemDoc.sizes[0];
            const quantity = toNumber(item.quantity);
            const rate = toNumber(item.rate);
            const discPercent = toNumber(item.discount ?? item.discountPercentage);
            let taxPercent = toNumber(item.tax ?? item.taxPercentage);
            if (taxPercent === 0) {
               // Fallback to Item Master Tax
               taxPercent = itemDoc.gstTax || 0;
            }
            const grossValue = rate * quantity;
            const discountAmount = (grossValue * discPercent) / 100;
            const taxableAmount = grossValue - discountAmount;
            const gstData = calculateGST(taxableAmount, taxPercent);
            const total = taxableAmount + gstData.totalTax;

            processedProducts.push({
                itemId: itemDoc._id,
                variantId: item.variantId,
                itemCode: itemDoc.itemCode,
                itemName: itemDoc.itemName,
                size: variantEntry ? variantEntry.size : (item.size || ''),
                color: itemDoc.shade || item.color || '',
                sku: (variantEntry ? variantEntry.sku : null) || item.sku || itemDoc.itemCode,
                quantity,
                rate,
                discount: discPercent,
                discountPercentage: discPercent,
                tax: taxPercent,
                taxPercentage: taxPercent,
                taxableAmount,
                gstPercent: taxPercent,
                gstAmount: gstData.totalTax,
                total,
                lotNumber: item.lotNumber || item.batchNumber || '',
                batchNo: item.batchNo || item.batchNumber || 'DEFAULT'
            });

            subTotal += taxableAmount;
            totalTax += gstData.totalTax;
        }

        const grandTotal = subTotal + totalTax + otherCharges;

        // Update record
        purchase.supplierId = supplierId;
        purchase.storeId = storeId;
        purchase.storeType = 'Warehouse';
        purchase.invoiceNumber = updateData.invoiceNumber || purchase.invoiceNumber;
        purchase.invoiceDate = updateData.invoiceDate || purchase.invoiceDate;
        purchase.products = processedProducts;
        purchase.subTotal = subTotal;
        purchase.totalTax = totalTax;
        purchase.otherCharges = otherCharges;
        purchase.grandTotal = grandTotal;
        purchase.notes = updateData.notes || purchase.notes;

        await purchase.save({ session });
        
        await createAuditLog({
            action: 'UPDATE_PURCHASE',
            module: 'Purchase',
            performedBy: userId,
            details: { purchaseNumber: purchase.purchaseNumber, id: purchase._id },
            session
        });

        return purchase;
    });
};

const cancelPurchase = async (purchaseId, userId) => {
    return await withTransaction(async (session) => {
        const purchase = await Purchase.findById(purchaseId).session(session);
        if (!purchase) throw new Error('Purchase record not found');
        if (purchase.status === PurchaseStatus.CANCELLED) throw new Error('Purchase already cancelled');

        if (purchase.grnStatus === 'APPROVED') {
            for (const item of purchase.products) {
                await removeStock({
                    variantId: item.variantId,
                    locationId: purchase.storeId,
                    locationType: 'STORE',
                    qty: item.quantity,
                    type: 'RETURN',
                    referenceId: purchase._id,
                    referenceType: 'Purchase',
                    performedBy: userId,
                    session
                });
            }
        }

        purchase.status = PurchaseStatus.CANCELLED;
        await purchase.save({ session });

        // If this purchase was linked to a GRN, release the GRN so it can be billed again
        if (purchase.grnId) {
            const GRN = require('../../models/grn.model');
            const grn = await GRN.findById(purchase.grnId).session(session);
            if (grn && grn.status === 'INVOICED') {
                grn.status = GrnStatus.APPROVED;
                grn.purchaseId = null;
                await grn.save({ session });
            }
        }

        // REVERSE PO billing if linked
        if (purchase.purchaseOrderId) {
            const po = await PurchaseOrder.findById(purchase.purchaseOrderId).session(session);
            if (po) {
                for (const item of purchase.products) {
                    const poItem = po.items.find(i => i.variantId?.toString() === item.variantId?.toString());
                    if (poItem) {
                        poItem.billedQty = Math.max(0, (poItem.billedQty || 0) - item.quantity);
                    }
                }
                
                // Recalculate status back to partially received if everything else is received
                let isFullyReceived = true;
                for (const poItem of po.items) {
                    if ((poItem.receivedQty || 0) < poItem.qty) isFullyReceived = false;
                }
                
                if (!isFullyReceived) {
                    po.status = PurchaseOrderStatus.PARTIALLY_RECEIVED;
                }
                
                await po.save({ session });
            }
        }

        return purchase;
    });
};

const getAllPurchases = async (query) => {
    const { page = 1, limit = 10, supplierId, storeId, status } = query;
    const filter = {};
    if (supplierId) filter.supplierId = supplierId;
    if (storeId) filter.storeId = storeId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [purchases, total] = await Promise.all([
        Purchase.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('supplierId', 'name supplierName contactPerson')
            .populate('storeId', 'name location city') // Dynamic populate via refPath (Warehouse or Store)
            .populate('grnId', 'grnNumber invoiceNumber')
            .populate('purchaseOrderId', 'poNumber orderNumber')
            .populate('products.itemId', 'itemName itemCode shade sizes'),
        Purchase.countDocuments(filter)
    ]);

    return { purchases, total, page: parseInt(page), limit: parseInt(limit) };
};

const getPurchaseById = async (id) => {
    return await Purchase.findById(id)
        .populate('supplierId', 'name supplierName contactPerson email phone')
        .populate('storeId', 'name location city') // Dynamic populate via refPath
        .populate('grnId', 'grnNumber invoiceNumber status')
        .populate('purchaseOrderId', 'poNumber orderNumber status')
        .populate('products.itemId', 'itemName itemCode shade sizes gstTax');
};

module.exports = {
    createPurchase,
    updatePurchase,
    postVoucher,
    cancelPurchase,
    getAllPurchases,
    getPurchaseById
};
