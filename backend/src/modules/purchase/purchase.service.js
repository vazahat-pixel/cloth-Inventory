const Purchase = require('../../models/purchase.model');
const Item = require('../../models/item.model');
const Supplier = require('../../models/supplier.model');
const Account = require('../../models/account.model');
const GstSlab = require('../../models/gstSlab.model');
const { calculateGST } = require('../../services/gst.service');
const { addStock, removeStock } = require('../../services/stock.service');
const { createJournalEntries } = require('../../services/ledger.service');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');
const { PurchaseStatus, StockMovementType, DocumentType, GrnStatus, PurchaseOrderStatus } = require('../../core/enums');
const workflowService = require('../workflow/workflow.service');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const barcodeService = require('../../services/barcode.service');
const PurchaseOrder = require('../../models/purchaseOrder.model');

const toNumber = (v) => Number(v) || 0;

const createPurchase = async (purchaseData, userId) => {
    return await withTransaction(async (session) => {
        const items = purchaseData.products || [];
        const storeId = purchaseData.storeId || purchaseData.warehouseId;
        const invoiceNumber = (purchaseData.invoiceNumber || '').trim();
        const invoiceDate = purchaseData.invoiceDate;
        const { supplierId } = purchaseData;

        const supplier = await Supplier.findOne({ _id: supplierId, isDeleted: false, isActive: true }).session(session);
        if (!supplier) throw new Error('Supplier not found or inactive');

        const year = new Date().getFullYear();
        const seq = await getNextSequence(`PURCHASE_${year}`, session);
        const purchaseNumber = `PUR-${year}-${seq.toString().padStart(6, '0')}`;

        let subTotal = 0;
        let totalTax = 0;
        const otherCharges = toNumber(purchaseData.otherCharges);
        const processedProducts = [];

        for (const item of items) {
            const itemDoc = await Item.findOne({ "sizes._id": item.variantId }).session(session);
            if (!itemDoc) throw new Error(`Item variant ${item.variantId} not found`);
            
            const variantEntry = itemDoc.sizes.id(item.variantId);

            const quantity = toNumber(item.quantity);
            const rate = toNumber(item.rate);
            const discPercent = toNumber(item.discountPercentage);
            
            const grossValue = rate * quantity;
            const discountAmount = (grossValue * discPercent) / 100;
            const taxableAmount = grossValue - discountAmount;

            let taxPercent = toNumber(item.taxPercentage);
            if (taxPercent === 0 && product.gstSlabId) {
                const slab = await GstSlab.findById(product.gstSlabId).session(session);
                if (slab) taxPercent = slab.percentage;
            }

            const gstData = calculateGST(taxableAmount, taxPercent);
            const total = taxableAmount + gstData.totalTax;

            processedProducts.push({
                itemId: itemDoc._id,
                variantId: item.variantId,
                itemCode: itemDoc.itemCode,
                itemName: itemDoc.itemName,
                size: variantEntry ? variantEntry.size : '',
                color: itemDoc.shade || itemDoc.color || '',
                sku: (variantEntry ? variantEntry.sku : null) || itemDoc.itemCode,
                quantity,
                rate,
                discountPercentage: discPercent,
                taxPercentage: taxPercent,
                taxableAmount,
                gstPercent: taxPercent,
                gstAmount: gstData.totalTax,
                total,
                lotNumber: item.lotNumber || '',
                batchNo: item.batchNo || 'DEFAULT'
            });

            subTotal += taxableAmount;
            totalTax += gstData.totalTax;
        }

        const grandTotal = subTotal + totalTax + otherCharges;

        const purchase = new Purchase({
            purchaseNumber,
            supplierId,
            storeId,
            invoiceNumber,
            invoiceDate,
            products: processedProducts,
            subTotal,
            totalTax,
            otherCharges,
            grandTotal,
            status: PurchaseStatus.DRAFT,
            grnStatus: 'DRAFT',
            createdBy: userId,
            notes: purchaseData.notes || ''
        });

        await purchase.save({ session });

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

const approveGRN = async (purchaseId, userId) => {
    return await withTransaction(async (session) => {
        const purchase = await Purchase.findById(purchaseId).session(session);
        if (!purchase) throw new Error('Purchase record not found');
        if (purchase.grnStatus === 'APPROVED') throw new Error('GRN already approved');

        for (const item of purchase.products) {
            await addStock({
                variantId: item.variantId, // Specific size _id
                locationId: purchase.storeId, 
                locationType: 'STORE',
                qty: item.quantity,
                type: 'PURCHASE',
                referenceId: purchase._id,
                referenceType: 'GRN',
                performedBy: userId,
                session
            });
        }

        // Generate Barcodes ONLY after GRN is approved
        await barcodeService.createBarcodesForGrn(purchase, userId, session);

        purchase.grnStatus = GrnStatus.APPROVED;
        purchase.status = PurchaseStatus.COMPLETED;
        await purchase.save({ session });

        // Update PO Status if present
        if (purchase.purchaseOrderId) {
            const po = await PurchaseOrder.findById(purchase.purchaseOrderId).session(session);
            if (po) {
                let allReceived = true;
                for (const item of purchase.products) {
                    const poItem = po.items.find(i => i.variantId.toString() === item.variantId.toString());
                    if (poItem) {
                        poItem.receivedQty = (poItem.receivedQty || 0) + item.quantity;
                        if (poItem.receivedQty < poItem.qty) allReceived = false;
                    }
                }
                if (allReceived) po.status = PurchaseOrderStatus.COMPLETED;
                else po.status = PurchaseOrderStatus.PENDING;
                await po.save({ session });
            }
        }

        await createAuditLog({
            action: 'APPROVE_GRN',
            module: 'GRN',
            performedBy: userId,
            details: { purchaseNumber: purchase.purchaseNumber, supplierId: purchase.supplierId },
            session
        });

        // Accounting Trigger
        const inventoryAccount = await Account.findOne({ name: 'Inventory Account' }).session(session);
        const payableAccount = await Account.findOne({ name: 'Accounts Payable' }).session(session);

        if (inventoryAccount && payableAccount) {
            await createJournalEntries([
                {
                    voucherType: 'PURCHASE',
                    voucherId: purchase._id,
                    accountId: inventoryAccount._id,
                    debit: purchase.subTotal,
                    credit: 0,
                    narration: `Purchase ${purchase.purchaseNumber} Approved`,
                    createdBy: userId
                },
                {
                    voucherType: 'PURCHASE',
                    voucherId: purchase._id,
                    accountId: payableAccount._id,
                    debit: 0,
                    credit: purchase.grandTotal,
                    narration: `Purchase ${purchase.purchaseNumber} Approved`,
                    createdBy: userId
                }
            ], session);
        }

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
            .populate('supplierId', 'name')
            .populate('storeId', 'name')
            .populate('products.itemId', 'itemName itemCode shade'),
        Purchase.countDocuments(filter)
    ]);

    return { purchases, total, page: parseInt(page), limit: parseInt(limit) };
};

const getPurchaseById = async (id) => {
    return await Purchase.findById(id).populate('supplierId storeId products.itemId');
};

module.exports = {
    createPurchase,
    approveGRN,
    cancelPurchase,
    getAllPurchases,
    getPurchaseById
};
