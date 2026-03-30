const Return = require('../../models/return.model');
const Purchase = require('../../models/purchase.model');
const Sale = require('../../models/sale.model');
const Account = require('../../models/account.model');
const { ReturnType, ReturnStatus, DocumentType, StockMovementType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { removeStock, addStock } = require('../../services/stock.service');
const { createJournalEntries } = require('../../services/ledger.service');
const { getNextSequence } = require('../../services/sequence.service');
const workflowService = require('../workflow/workflow.service');

const generateReturnNumber = async (type, session = null) => {
    const year = new Date().getFullYear();
    const prefix = type === ReturnType.PURCHASE_RETURN ? `PRT-${year}-` : `SRT-${year}-`;
    const counterName = `RETURN_${type}_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

/**
 * PURCHASE RETURN (Warehouse -> Supplier)
 * Reduces Warehouse Stock & Reverses Ledger
 */
const createPurchaseReturn = async (returnData, userId) => {
    return await withTransaction(async (session) => {
        const { referenceId, locationId, items, reason } = returnData;

        // 1. Validate Purchase Reference
        const purchase = await Purchase.findById(referenceId).session(session);
        if (!purchase) throw new Error('Original Purchase record not found');

        // 2. Process Items & Execute Stock Movement
        let totalReturnAmount = 0;
        let totalTaxAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const originalItem = purchase.products.find(p => p.productId.toString() === item.variantId.toString());
            if (!originalItem) throw new Error(`Product ${item.variantId} not found in the original purchase`);

            // Check if return quantity is valid
            if (item.quantity > originalItem.quantity) {
                throw new Error(`Cannot return more than purchased quantity for product ${item.variantId}`);
            }

            const itemSubTotal = originalItem.rate * item.quantity;
            const itemTax = (originalItem.gstAmount / originalItem.quantity) * item.quantity;
            
            processedItems.push({
                variantId: item.variantId,
                quantity: item.quantity,
                rate: originalItem.rate,
                subTotal: itemSubTotal
            });

            totalReturnAmount += itemSubTotal;
            totalTaxAmount += itemTax;
        }

        const grandTotal = totalReturnAmount + totalTaxAmount;
        const returnNumber = await generateReturnNumber(ReturnType.PURCHASE_RETURN, session);

        // 3. Save Return Record
        const returnDoc = new Return({
            returnNumber,
            type: ReturnType.PURCHASE_RETURN,
            referenceId,
            locationId,
            items: processedItems,
            totalAmount: grandTotal,
            reason,
            createdBy: userId
        });
        await returnDoc.save({ session });

        // Reduce Warehouse Stock after the return document exists
        for (const item of processedItems) {
            await removeStock({
                variantId: item.variantId,
                locationId: locationId,
                locationType: 'WAREHOUSE',
                qty: item.quantity,
                type: StockMovementType.RETURN,
                referenceId: returnDoc._id,
                referenceType: 'Return',
                performedBy: userId,
                session
            });
        }

        // 4. Reverse Ledger Entries
        const payableAccount = await Account.findOne({ name: 'Accounts Payable' }).session(session);
        const inventoryAccount = await Account.findOne({ name: 'Inventory Account' }).session(session);
        const gstReceivableAccount = await Account.findOne({ name: 'GST Receivable' }).session(session);

        if (payableAccount && inventoryAccount) {
            await createJournalEntries([
                {
                    voucherType: 'PURCHASE_RETURN',
                    voucherId: returnDoc._id,
                    accountId: payableAccount._id,
                    debit: grandTotal,
                    credit: 0,
                    narration: `Return on Purchase ${purchase.purchaseNumber}`
                },
                {
                    voucherType: 'PURCHASE_RETURN',
                    voucherId: returnDoc._id,
                    accountId: inventoryAccount._id,
                    debit: 0,
                    credit: totalReturnAmount,
                    narration: `Inventory reversal for Return ${returnNumber}`
                },
                {
                    voucherType: 'PURCHASE_RETURN',
                    voucherId: returnDoc._id,
                    accountId: gstReceivableAccount._id,
                    debit: 0,
                    credit: totalTaxAmount,
                    narration: `GST Input reversal for Return ${returnNumber}`
                }
            ], session);
        }

        await workflowService.updateStatus(returnDoc._id, DocumentType.RETURN, null, ReturnStatus.APPROVED, userId, `Purchase Return ${returnNumber} processed`);

        return returnDoc;
    });
};

/**
 * SALES RETURN (Customer -> Store)
 * Increases Store Stock & Reverses Revenue/Tax
 */
const createSalesReturn = async (returnData, userId) => {
    return await withTransaction(async (session) => {
        const { referenceId, locationId, items, reason } = returnData;

        // 1. Validate Sales Reference
        const sale = await Sale.findById(referenceId).session(session);
        if (!sale) throw new Error('Original Sale record not found');

        let totalReturnAmount = 0;
        let totalTaxAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const originalItem = sale.products.find(p => p.productId.toString() === item.variantId.toString());
            if (!originalItem) throw new Error(`Product ${item.variantId} not found in the original sale`);

            if (item.quantity > originalItem.quantity) {
                throw new Error(`Cannot return more than sold quantity for product ${item.variantId}`);
            }

            const itemSubTotal = originalItem.price * item.quantity;
            const itemTax = (originalItem.gstAmount / originalItem.quantity) * item.quantity;

            processedItems.push({
                variantId: item.variantId,
                quantity: item.quantity,
                rate: originalItem.price,
                subTotal: itemSubTotal
            });

            totalReturnAmount += itemSubTotal;
            totalTaxAmount += itemTax;
        }

        const grandTotal = totalReturnAmount + totalTaxAmount;
        const returnNumber = await generateReturnNumber(ReturnType.SALES_RETURN, session);

        const returnDoc = new Return({
            returnNumber,
            type: ReturnType.SALES_RETURN,
            referenceId,
            locationId,
            items: processedItems,
            totalAmount: grandTotal,
            reason,
            createdBy: userId
        });
        await returnDoc.save({ session });

        // Restore Store Stock after the return document exists
        for (const item of processedItems) {
            await addStock({
                variantId: item.variantId,
                locationId: locationId,
                locationType: 'STORE',
                qty: item.quantity,
                type: StockMovementType.RETURN,
                referenceId: returnDoc._id,
                referenceType: 'Return',
                performedBy: userId,
                session
            });
        }

        // 2. Reverse Ledger (Debit: Sales Return, Credit: Receivable/Customer)
        const salesAccount = await Account.findOne({ name: 'Sales Account' }).session(session);
        const receivableAccount = await Account.findOne({ name: 'Accounts Receivable' }).session(session);
        const gstPayableAccount = await Account.findOne({ name: 'GST Payable' }).session(session);

        if (salesAccount && receivableAccount) {
            await createJournalEntries([
                {
                    voucherType: 'SALES_RETURN',
                    voucherId: returnDoc._id,
                    accountId: salesAccount._id,
                    debit: totalReturnAmount,
                    credit: 0,
                    narration: `Sales Return ${returnNumber}`
                },
                {
                    voucherType: 'SALES_RETURN',
                    voucherId: returnDoc._id,
                    accountId: gstPayableAccount._id,
                    debit: totalTaxAmount,
                    credit: 0,
                    narration: `Tax reversal for Return ${returnNumber}`
                },
                {
                    voucherType: 'SALES_RETURN',
                    voucherId: returnDoc._id,
                    accountId: receivableAccount._id,
                    debit: 0,
                    credit: grandTotal,
                    narration: `Accounts Receivable credit for Return ${returnNumber}`
                }
            ], session);
        }

        await workflowService.updateStatus(returnDoc._id, DocumentType.RETURN, null, ReturnStatus.APPROVED, userId, `Sales Return ${returnNumber} processed`);

        return returnDoc;
    });
};

const getReturnById = async (id) => {
    return await Return.findById(id)
        .populate('referenceId')
        .populate('locationId', 'name')
        .populate('items.variantId', 'name sku');
};

const getReturns = async (filter = {}) => {
    return await Return.find(filter).sort({ createdAt: -1 });
};

module.exports = {
    createPurchaseReturn,
    createSalesReturn,
    getReturnById,
    getReturns
};
