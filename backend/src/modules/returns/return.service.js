const Return = require('../../models/return.model');
const Sale = require('../../models/sale.model');
const Product = require('../../models/product.model');
const StoreInventory = require('../../models/storeInventory.model');
const { ReturnType, StockHistoryType, CreditNoteStatus } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { adjustWarehouseStock, adjustStoreStock } = require('../../services/stock.service');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const CreditNote = require('../../models/creditNote.model');
const Customer = require('../../models/customer.model');
const Account = require('../../models/account.model');
const ledgerService = require('../../services/ledger.service');
const { calculateGST } = require('../../services/gst.service');
const GstSlab = require('../../models/gstSlab.model');
const { getNextSequence } = require('../../services/sequence.service');

const generateReturnNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const prefix = `RTN-${year}-`;
    const counterName = `RETURN_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

/**
 * Generate unique Credit Note Number (CN-YYYY-XXXXX)
 */
const generateCreditNoteNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const prefix = `CN-${year}-`;
    const counterName = `CREDIT_NOTE_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

/**
 * Process a Return
 */
const processReturn = async (returnData, userId) => {
    return await withTransaction(async (session) => {
        const { type, referenceSaleId, quantity, notes } = returnData;
        const productId = returnData.productId || returnData.variantId;
        const storeId = returnData.storeId || returnData.warehouseId;

        // 1. Logic for Customer Return
        if (type === ReturnType.CUSTOMER_RETURN) {
            if (!referenceSaleId) throw new Error('Sale reference is required for customer returns');

            const sale = await Sale.findById(referenceSaleId).session(session);
            if (!sale) throw new Error('Sale record not found');

            // Validate quantity returned vs quantity sold
            const soldItem = sale.products.find(p => p.productId.toString() === productId.toString());
            if (!soldItem) throw new Error('Product not found in this sale');

            // Calculate total already returned for this specific item in this sale
            const previousReturns = await Return.find({
                referenceSaleId,
                productId,
                status: { $ne: 'REJECTED' },
                isDeleted: false
            }).session(session);

            const totalAlreadyReturned = previousReturns.reduce((sum, r) => sum + r.quantity, 0);
            if (totalAlreadyReturned + quantity > soldItem.quantity) {
                throw new Error(`Cannot return more than sold quantity. (Already returned: ${totalAlreadyReturned}, Sold: ${soldItem.quantity})`);
            }

            // Increase Store Inventory
            await adjustStoreStock({
                productId,
                storeId,
                quantityChange: quantity,
                type: StockHistoryType.RETURN,
                referenceId: null, // Will be updated later if needed, or link to return record
                referenceModel: 'Return',
                performedBy: userId,
                notes: `Customer return from Sale ${sale.saleNumber}`,
                session
            });

            // Update quantitySold and quantityReturned in Store Inventory
            await StoreInventory.findOneAndUpdate(
                { storeId, productId },
                {
                    $inc: {
                        quantitySold: -quantity,
                        quantityReturned: quantity
                    }
                },
                { session }
            );

            // --- CREDIT NOTE LOGIC ---
            if (sale.customerId) {
                const returnSubTotal = soldItem.price * quantity;
                let returnTax = 0;

                const product = await Product.findById(productId).session(session);
                if (product.gstSlabId) {
                    const slab = await GstSlab.findById(product.gstSlabId).session(session);
                    if (slab) {
                        const gstData = calculateGST(returnSubTotal, slab.percentage, slab.type);
                        returnTax = gstData.totalTax;
                    }
                }

                const returnGrandTotal = returnSubTotal + returnTax;

                // 1. Create Credit Note
                const creditNoteNumber = await generateCreditNoteNumber(session);
                const creditNote = new CreditNote({
                    creditNoteNumber,
                    customerId: sale.customerId,
                    referenceReturnId: null, // Update after return record save
                    totalAmount: returnGrandTotal,
                    remainingAmount: returnGrandTotal,
                    status: CreditNoteStatus.ACTIVE,
                    createdBy: userId
                });
                await creditNote.save({ session });

                // 2. Ledger integration
                const salesAccount = await Account.findOne({ name: 'Sales Account' }).session(session);
                const receivableAccount = await Account.findOne({ name: 'Accounts Receivable' }).session(session);
                const creditNoteControlAccount = await Account.findOne({ name: 'Credit Note Control' }).session(session);
                const gstPayableAccount = await Account.findOne({ name: 'GST Payable' }).session(session);

                if (salesAccount && creditNoteControlAccount) {
                    const entries = [
                        {
                            voucherType: 'RETURN',
                            voucherId: creditNote._id,
                            accountId: salesAccount._id,
                            debit: returnSubTotal,
                            credit: 0,
                            narration: `Return ${returnSubTotal} via Credit Note ${creditNoteNumber}`,
                            createdBy: userId
                        },
                        {
                            voucherType: 'RETURN',
                            voucherId: creditNote._id,
                            accountId: creditNoteControlAccount._id,
                            debit: 0,
                            credit: returnGrandTotal,
                            narration: `Credit Note Issued ${creditNoteNumber}`,
                            createdBy: userId
                        }
                    ];

                    if (returnTax > 0 && gstPayableAccount) {
                        entries.push({
                            voucherType: 'RETURN',
                            voucherId: creditNote._id,
                            accountId: gstPayableAccount._id,
                            debit: returnTax,
                            credit: 0,
                            narration: `Tax reversal on return via ${creditNoteNumber}`,
                            createdBy: userId
                        });
                    }

                    await ledgerService.createJournalEntries(entries, session);
                }

                // Attach credit note to return record for reference later
                returnData.creditNoteId = creditNote._id;
            }
        }

        // 2. Logic for Store to Factory Transfer
        if (type === ReturnType.STORE_TO_FACTORY) {
            // Reduce Store stock
            await adjustStoreStock({
                productId,
                variantId: productId,
                storeId,
                quantityChange: -quantity,
                type: StockHistoryType.RETURN,
                referenceId: null,
                referenceModel: 'Return',
                performedBy: userId,
                notes: 'Return to factory',
                session
            });

            // Increase destination Warehouse/Factory stock
            const destinationWarehouseId = returnData.destinationId || returnData.warehouseId;
            if (!destinationWarehouseId) {
                throw new Error('Destination warehouse is required for store to factory returns');
            }

            await adjustWarehouseStock({
                productId,
                variantId: productId,
                warehouseId: destinationWarehouseId,
                quantityChange: quantity,
                type: StockHistoryType.RETURN,
                referenceId: null,
                referenceModel: 'Return',
                performedBy: userId,
                notes: `Return from Store ID ${storeId}`,
                session
            });
        }

        // 3. Logic for Damaged Stock marking
        if (type === ReturnType.DAMAGED) {
            // Reduce Store stock (available)
            await adjustStoreStock({
                productId,
                variantId: productId,
                storeId,
                quantityChange: -quantity,
                type: StockHistoryType.RETURN,
                referenceId: null,
                referenceModel: 'Return',
                performedBy: userId,
                notes: 'Damaged stock marking - move from available',
                session
            });

            // Move to Damaged pool
            await adjustStoreStockDamaged({
                productId,
                variantId: productId,
                storeId,
                quantityChange: quantity,
                type: StockHistoryType.RETURN,
                referenceId: null,
                referenceModel: 'Return',
                performedBy: userId,
                notes: 'Damaged stock marking - add to damaged pool',
                session
            });
        }

        // 4. Logic for Return to Supplier (Purchase Return)
        if (type === ReturnType.PURCHASE_RETURN) {
            // Usually returns come from Warehouse stock
            const warehouseId = returnData.warehouseId || returnData.storeId;
            if (!warehouseId) {
                throw new Error('Warehouse reference is required for purchase returns');
            }

            await adjustWarehouseStock({
                productId,
                variantId: productId,
                warehouseId,
                quantityChange: -quantity,
                type: StockHistoryType.OUT,
                referenceId: null,
                referenceModel: 'Return',
                performedBy: userId,
                notes: `Purchase return to supplier. Ref: ${notes || 'N/A'}`,
                session
            });
        }

        const returnNumber = await generateReturnNumber(session);
        const returnRecord = new Return({
            ...returnData,
            returnNumber,
            createdBy: userId
        });
        await returnRecord.save({ session });

        // Audit Log
        await createAuditLog({
            performedBy: userId,
            action: `PROCESS_${type}`,
            module: 'RETURNS',
            targetId: returnRecord._id,
            targetModel: 'Return',
            after: returnRecord.toObject(),
            session
        });

        return returnRecord;
    });
};

/**
 * Get Return History
 */
const getAllReturns = async (query, user) => {
    const { page = 1, limit = 10, type, storeId, productId, startDate, endDate } = query;
    const filter = { isDeleted: false };

    if (type) filter.type = type;
    if (user && user.role === 'store_staff') {
        if (!user.shopId) {
            throw new Error('User is not linked to any store. Please contact administrator.');
        }
        filter.storeId = user.shopId;
    } else if (storeId) {
        filter.storeId = storeId;
    }
    if (productId) filter.productId = productId;

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = end;
        }
    }

    const skip = (page - 1) * limit;
    const [returns, total] = await Promise.all([
        Return.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('storeId', 'name')
            .populate('productId', 'name sku barcode size color')
            .populate('createdBy', 'name')
            .populate('referenceSaleId', 'saleNumber'),
        Return.countDocuments(filter)
    ]);

    return { returns, total, page: parseInt(page), limit: parseInt(limit) };
};

const getReturnById = async (id) => {
    const record = await Return.findById(id)
        .populate('storeId')
        .populate('productId', 'name sku barcode size color')
        .populate('createdBy', 'name')
        .populate('referenceSaleId');
    if (!record) throw new Error('Return record not found');
    return record;
};

module.exports = {
    processReturn,
    getAllReturns,
    getReturnById
};
