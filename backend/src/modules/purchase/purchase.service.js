const Purchase = require('../../models/purchase.model');
const Product = require('../../models/product.model');
const Supplier = require('../../models/supplier.model');
const Account = require('../../models/account.model');
const GstSlab = require('../../models/gstSlab.model');
const { calculateGST } = require('../../services/gst.service');
const { adjustWarehouseStock } = require('../../services/stock.service');
const { createJournalEntries } = require('../../services/ledger.service');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');
const { PurchaseStatus, StockHistoryType, DocumentType } = require('../../core/enums');
const workflowService = require('../workflow/workflow.service');
const { createAuditLog } = require('../../middlewares/audit.middleware');

const createPurchase = async (purchaseData, userId) => {
    return await withTransaction(async (session) => {
        // Handle field name variations between frontend and backend
        // Handle field name variations between frontend and backend
        const items = purchaseData.products || [];
        const storeId = purchaseData.warehouseId;
        const invoiceNumber = (purchaseData.invoiceNumber || '').trim();
        const invoiceDate = purchaseData.invoiceDate;
        const notes = purchaseData.notes || '';
        const { supplierId } = purchaseData;

        // 1. Validate Supplier
        const supplier = await Supplier.findOne({ _id: supplierId, isDeleted: false, isActive: true }).session(session);
        if (!supplier) throw new Error('Supplier not found or inactive');

        // 2. Validate Store/Warehouse (if provided)
        let store;
        if (storeId) {
            const Store = require('../../models/store.model');
            store = await Store.findOne({ _id: storeId, isDeleted: false, isActive: true }).session(session);
            if (!store) throw new Error('Warehouse not found or inactive');
        }

        // 3. Generate Purchase Number
        const year = new Date().getFullYear();
        const seq = await getNextSequence(`PURCHASE_${year}`, session);
        const purchaseNumber = `PUR-${year}-${seq.toString().padStart(6, '0')}`;

        // 3. Initialize totals
        let subTotal = 0;
        let totalTax = 0;
        const otherCharges = toNumber(purchaseData.otherCharges);
        const processedProducts = [];

        // 4. Process items
        for (const item of items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) throw new Error(`Product ${item.productId} not found`);

            const quantity = toNumber(item.quantity);
            const rate = toNumber(item.rate);
            const discPercent = toNumber(item.discountPercentage);
            
            // Calculate taxable amount after line-item discount
            const grossValue = rate * quantity;
            const discountAmount = (grossValue * discPercent) / 100;
            const taxableAmount = grossValue - discountAmount;

            let taxPercent = toNumber(item.taxPercentage);
            let taxAmount = 0;

            // If taxPercent is 0 or not provided, try to fetch from Slab (Default Logic)
            // But if it's explicitly provided (Override), we use it.
            if (taxPercent === 0 && product.gstSlabId) {
                const slab = await GstSlab.findById(product.gstSlabId).session(session);
                if (slab) {
                    taxPercent = slab.percentage;
                }
            }

            // Calculate GST
            const gstData = calculateGST(taxableAmount, taxPercent);
            taxAmount = gstData.totalTax;

            const total = taxableAmount + taxAmount;

            processedProducts.push({
                productId: item.productId,
                quantity,
                rate,
                discountPercentage: discPercent,
                taxPercentage: taxPercent,
                taxableAmount,
                gstPercent: taxPercent,
                gstAmount: taxAmount,
                total
            });

            subTotal += taxableAmount;
            totalTax += taxAmount;
        }

        const grandTotal = subTotal + totalTax + otherCharges;

        // 6. Save Purchase Record
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
            finalAmount: grandTotal, // for now, matches grandTotal
            status: PurchaseStatus.PENDING_QC,
            createdBy: userId,
            notes
        });

        await purchase.save({ session });

        // Audit Logging
        await createAuditLog({
            action: 'CREATE_PURCHASE',
            module: 'PURCHASE',
            performedBy: userId,
            targetId: purchase._id,
            targetModel: 'Purchase',
            before: null,
            after: purchase.toObject(),
            session
        });

        // Workflow logging
        await workflowService.updateStatus(purchase._id, DocumentType.PURCHASE, null, PurchaseStatus.PENDING_QC, userId, `Created Purchase ${purchaseNumber} - Pending QC`);

        // 7. Ledger integration
        const inventoryAccount = await Account.findOne({ name: 'Inventory Account' }).session(session);
        const gstReceivableAccount = await Account.findOne({ name: 'GST Receivable' }).session(session);
        const payableAccount = await Account.findOne({ name: 'Accounts Payable' }).session(session);

        if (inventoryAccount && gstReceivableAccount && payableAccount) {
            await createJournalEntries([
                {
                    voucherType: 'PURCHASE',
                    voucherId: purchase._id,
                    accountId: inventoryAccount._id,
                    debit: subTotal,
                    credit: 0,
                    narration: `Purchase ${purchaseNumber}`,
                    createdBy: userId
                },
                {
                    voucherType: 'PURCHASE',
                    voucherId: purchase._id,
                    accountId: gstReceivableAccount._id,
                    debit: totalTax,
                    credit: 0,
                    narration: `GST on Purchase ${purchaseNumber}`,
                    createdBy: userId
                },
                {
                    voucherType: 'PURCHASE',
                    voucherId: purchase._id,
                    accountId: payableAccount._id,
                    debit: 0,
                    credit: grandTotal,
                    narration: `Purchase ${purchaseNumber}`,
                    createdBy: userId
                }
            ], session);
        } else {
            console.error(`Missing accounting accounts for Purchase ${purchaseNumber}. Inventory: ${!!inventoryAccount}, GST: ${!!gstReceivableAccount}, Payable: ${!!payableAccount}`);
        }

        return purchase;
    });
};

const cancelPurchase = async (purchaseId, userId) => {
    return await withTransaction(async (session) => {
        const purchase = await Purchase.findById(purchaseId).session(session);
        if (!purchase) throw new Error('Purchase record not found');
        if (purchase.status === PurchaseStatus.CANCELLED) throw new Error('Purchase already cancelled');

        // 1. Reverse Stock
        for (const item of purchase.products) {
            await adjustWarehouseStock({
                productId: item.productId,
                warehouseId: purchase.storeId, // storeId is treated as warehouseId
                quantityChange: -item.quantity,
                type: StockHistoryType.OUT,
                referenceId: purchase._id,
                referenceModel: 'Purchase',
                performedBy: userId,
                notes: `Reversal of purchase ${purchase.purchaseNumber}`,
                session
            });
        }

        // 2. Reverse Ledger Entries
        const inventoryAccount = await Account.findOne({ name: 'Inventory Account' }).session(session);
        const gstReceivableAccount = await Account.findOne({ name: 'GST Receivable' }).session(session);
        const payableAccount = await Account.findOne({ name: 'Accounts Payable' }).session(session);

        if (inventoryAccount && gstReceivableAccount && payableAccount) {
            await createJournalEntries([
                {
                    voucherType: 'PURCHASE',
                    voucherId: purchase._id,
                    accountId: inventoryAccount._id,
                    debit: 0,
                    credit: purchase.subTotal,
                    narration: `Reversal of purchase ${purchase.purchaseNumber}`,
                    createdBy: userId
                },
                {
                    voucherType: 'PURCHASE',
                    voucherId: purchase._id,
                    accountId: gstReceivableAccount._id,
                    debit: 0,
                    credit: purchase.totalTax,
                    narration: `Reversal GST on purchase ${purchase.purchaseNumber}`,
                    createdBy: userId
                },
                {
                    voucherType: 'PURCHASE',
                    voucherId: purchase._id,
                    accountId: payableAccount._id,
                    debit: purchase.grandTotal,
                    credit: 0,
                    narration: `Reversal of purchase ${purchase.purchaseNumber}`,
                    createdBy: userId
                }
            ], session);
        }

        // 3. Update Status
        purchase.status = PurchaseStatus.CANCELLED;
        await purchase.save({ session });

        return purchase;
    });
};

const getAllPurchases = async (query) => {
    const { page = 1, limit = 10, supplierId, storeId, startDate, endDate, status } = query;
    const filter = {};

    if (supplierId) filter.supplierId = supplierId;
    if (storeId) filter.storeId = storeId;
    if (status) filter.status = status;

    if (startDate || endDate) {
        filter.invoiceDate = {};
        if (startDate) filter.invoiceDate.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.invoiceDate.$lte = end;
        }
    }

    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
        Purchase.find(filter)
            .sort({ invoiceDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('supplierId', 'name contactPerson')
            .populate('storeId', 'name')
            .populate('products.productId', 'name sku barcode size color category')
            .populate('createdBy', 'name'),
        Purchase.countDocuments(filter)
    ]);

    return { purchases, total, page: parseInt(page), limit: parseInt(limit) };
};

const getPurchaseById = async (id) => {
    const purchase = await Purchase.findById(id)
        .populate('supplierId')
        .populate('storeId')
        .populate('products.productId')
        .populate('createdBy', 'name');
    if (!purchase) throw new Error('Purchase record not found');
    return purchase;
};

module.exports = {
    createPurchase,
    cancelPurchase,
    getAllPurchases,
    getPurchaseById
};
