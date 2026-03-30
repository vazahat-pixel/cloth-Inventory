const Sale = require('../../models/sale.model');
const StoreInventory = require('../../models/storeInventory.model');
const Product = require('../../models/product.model');
const { SaleStatus, StockMovementType, DocumentType } = require('../../core/enums');
const workflowService = require('../workflow/workflow.service');
const { withTransaction } = require('../../services/transaction.service');
const { adjustStoreStock } = require('../../services/stock.service');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getIO } = require('../../config/socket');
const Account = require('../../models/account.model');
const ledgerService = require('../../services/ledger.service');
const GstSlab = require('../../models/gstSlab.model');
const StorePricing = require('../../models/storePricing.model');
const Customer = require('../../models/customer.model');
const LoyaltyTransaction = require('../../models/loyaltyTransaction.model');
const CreditNote = require('../../models/creditNote.model');
const { calculateGST } = require('../../services/gst.service');
const { getNextSequence } = require('../../services/sequence.service');
const stockLedgerService = require('../inventory/stockLedger.service');

const {
    LoyaltyType,
    CreditNoteStatus
} = require('../../core/enums');
const {
    LOYALTY_EARNING_RATIO,
    LOYALTY_POINT_VALUE,
    MIN_REDEEM_POINTS
} = require('../../core/constants');

/**
 * Generate unique Sale/Invoice Number (INV-YYYY-XXXXX)
 */
const generateSaleNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const counterName = `SALE_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

/**
 * Get product by barcode for scanning
 */
const getProductForSale = async (barcode, storeId) => {
    const product = await Product.findOne({ barcode, isDeleted: false, isActive: true });
    if (!product) throw new Error('Product not found or inactive');

        // High Precision Ledger Search
    const history = await stockLedgerService.getLedgerByItem(product._id);
    // Filter by location and barcode to get latest balance
    const lastMovement = history.find(h => h.barcode === barcode && h.locationId?.toString() === storeId?.toString());
    const availableQty = lastMovement ? lastMovement.balanceAfter : 0;

    if (availableQty <= 0) {
        throw new Error(`Out of stock for barcode ${barcode} in this store (Ledger Verified)`);
    }

    return {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        size: product.size,
        color: product.color,
        salePrice: product.salePrice,
        available: availableQty
    };
};

/**
 * Create a new Sale
 */
const createSale = async (saleData, cashierId) => {
    const result = await withTransaction(async (session) => {
        const storeId = saleData.storeId || saleData.warehouseId;
        const products = saleData.products || saleData.items || [];
        const {
            subTotal,
            discount,
            tax,
            grandTotal,
            paymentMode,
            customerId,
            redeemPoints,
            creditNoteId,
            type = 'RETAIL',
            parentSaleId
        } = saleData;

        // 1. Generate Sale Number
        const saleNumber = await generateSaleNumber(session);

        // 2. Process Products and Update Inventory
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        let totalTax = 0;
        let calculatedSubTotal = 0;
        const stockMovements = [];

        for (const item of products) {
            const productId = item.productId || item.variantId;
            const inventory = await StoreInventory.findOne({
                storeId,
                productId
            }).session(session);

            const availableQty = inventory ? (typeof inventory.quantityAvailable === 'number'
                ? inventory.quantityAvailable
                : inventory.quantity || 0) : 0;

            if (item.quantity > 0 && (!inventory || availableQty < item.quantity)) {
                const pName = await Product.findById(productId).session(session);
                throw new Error(`Insufficient stock for ${pName ? pName.name : 'product'} (Available: ${availableQty})`);
            }

            const product = await Product.findById(productId).session(session);
            if (!product) throw new Error('Product not found');

            // --- PRICING ENGINE INJECTION ---
            const storePriceRule = await StorePricing.findOne({
                storeId,
                productId,
                isActive: true
            }).session(session);

            const originalPrice = product.salePrice;
            const appliedPrice = storePriceRule ? storePriceRule.price : originalPrice;
            const pricingSource = storePriceRule ? 'STORE_SPECIFIC' : 'DEFAULT';

            // Override price in item for downstream calculations
            item.price = appliedPrice;
            item.originalPrice = originalPrice;
            item.appliedPrice = appliedPrice;
            item.pricingSource = pricingSource;
            // --------------------------------

            const taxableAmount = item.price * item.quantity;

            let gstData = { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };

            if (product.gstSlabId) {
                const slab = await GstSlab.findById(product.gstSlabId).session(session);
                if (slab) {
                    gstData = calculateGST(taxableAmount, slab.percentage, slab.type);
                }
            }

            totalCGST += gstData.cgst;
            totalSGST += gstData.sgst;
            totalIGST += gstData.igst;
            totalTax += gstData.totalTax;

            item.taxAmount = gstData.totalTax;
            item.taxPercentage = product.gstSlabId ? (await GstSlab.findById(product.gstSlabId)).percentage : 0;

            stockMovements.push({
                productId,
                variantId: productId,
                storeId,
                quantityChange: -item.quantity,
                type: (type || 'RETAIL').toUpperCase() === 'EXCHANGE' && item.quantity < 0
                    ? StockMovementType.RETURN
                    : StockMovementType.SALE,
                referenceModel: 'Sale',
                notes: `Sale ${saleNumber} ${(type || 'RETAIL').toUpperCase() === 'EXCHANGE' && item.quantity < 0 ? '(Exchange Return)' : ''}`,
            });
            
            calculatedSubTotal += taxableAmount;
        }

        // 2.1. Handle Loyalty Redemption
        let loyaltyRedemptionAmount = 0;
        let customer = null;
        if (customerId) {
            customer = await Customer.findById(customerId).session(session);
            if (!customer) throw new Error('Customer not found');

            if (redeemPoints > 0) {
                if (redeemPoints < MIN_REDEEM_POINTS) {
                    throw new Error(`Minimum ${MIN_REDEEM_POINTS} points required for redemption`);
                }
                if (customer.loyaltyPoints < (Number(redeemPoints) || 0)) {
                    throw new Error('Insufficient loyalty points');
                }

                loyaltyRedemptionAmount = Number(redeemPoints) * LOYALTY_POINT_VALUE;
                customer.loyaltyPoints -= Number(redeemPoints);
                customer.totalRedeemed += Number(redeemPoints);
                await customer.save({ session });
            }
        }

        // 2.2. Handle Credit Note Usage
        let creditNoteAppliedAmount = 0;
        let creditNote = null;
        if (creditNoteId) {
            creditNote = await CreditNote.findById(creditNoteId).session(session);
            if (!creditNote || creditNote.status !== CreditNoteStatus.ACTIVE) {
                throw new Error('Invalid or inactive Credit Note');
            }
            if (creditNote.customerId.toString() !== customerId) {
                throw new Error('Credit Note does not belong to this customer');
            }

            const currentGrandTotal = calculatedSubTotal + totalTax - discount - loyaltyRedemptionAmount;
            creditNoteAppliedAmount = Math.min(creditNote.remainingAmount, currentGrandTotal);

            creditNote.remainingAmount -= creditNoteAppliedAmount;
            if (creditNote.remainingAmount === 0) {
                creditNote.status = CreditNoteStatus.USED;
            }
            await creditNote.save({ session });
        }

        const finalGrandTotal = calculatedSubTotal + totalTax - discount - loyaltyRedemptionAmount - creditNoteAppliedAmount;

        // 3. Create Sale Record
        const subTotalCalculated = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const grandTotalCalculated = subTotalCalculated + totalTax - (discount || 0) - loyaltyRedemptionAmount - creditNoteAppliedAmount;

        const amountPaid = Number(saleData.amountPaid || 0);
        const dueAmount = grandTotalCalculated - amountPaid;

        // 5. Save Sale Record
        const sale = new Sale({
            saleNumber,
            storeId,
            cashierId: cashierId,
            customerId: saleData.customerId,
            type: saleData.type || 'RETAIL',
            parentSaleId,
            products: products.map(p => ({
                ...p,
                taxAmount: p.taxAmount || 0,
                taxPercentage: p.taxPercentage || 0,
                total: (p.price * p.quantity) + (p.taxAmount || 0)
            })),
            subTotal: subTotalCalculated,
            discount,
            loyaltyRedeemed: loyaltyRedemptionAmount,
            creditNoteId,
            creditNoteApplied: creditNoteAppliedAmount,
            tax: totalTax, 
            taxBreakup: {
                cgst: totalCGST,
                sgst: totalSGST,
                igst: totalIGST
            },
            totalTax,
            grandTotal: grandTotalCalculated,
            amountPaid,
            dueAmount,
            paymentMode: saleData.paymentMode || 'CASH',
            status: dueAmount > 0 ? SaleStatus.PARTIAL : SaleStatus.COMPLETED,
            saleDate: Date.now()
        });
        await sale.save({ session });

        // Now that the sale has an id, post all stock movements against it.
        for (const movement of stockMovements) {
            await adjustStoreStock({
                productId: movement.productId,
                variantId: movement.variantId,
                storeId: movement.storeId,
                quantityChange: movement.quantityChange,
                type: movement.type,
                referenceId: sale._id,
                referenceModel: movement.referenceModel,
                performedBy: cashierId,
                notes: movement.notes,
                session
            });

            await StoreInventory.updateOne(
                { storeId, productId: movement.productId },
                { $inc: { quantitySold: movement.quantityChange < 0 ? Math.abs(movement.quantityChange) : -movement.quantityChange } },
                { session }
            );
        }

        // Record Loyalty Transactions (both Redeem and Earn)
        if (customerId) {
            if (sale.loyaltyRedeemed > 0) {
                await LoyaltyTransaction.create([{
                    customerId,
                    saleId: sale._id,
                    type: LoyaltyType.REDEEM,
                    points: Number(redeemPoints),
                    referenceNumber: saleNumber,
                    createdBy: cashierId,
                    date: Date.now()
                }], { session });
            }
        }

        // Log workflow transition from STOCK to SALE
        await workflowService.updateStatus(sale._id, DocumentType.SALE, 'STOCK_UPDATE', sale.status, cashierId, `Created Sale ${saleNumber}`);

        // 3.1 Earn Points for Customer
        if (customer) {
            const earnedPoints = Math.floor(finalGrandTotal / LOYALTY_EARNING_RATIO);
            if (earnedPoints > 0) {
                customer.loyaltyPoints += earnedPoints;
                customer.totalEarned += earnedPoints;

                await LoyaltyTransaction.create([{
                    customerId,
                    saleId: sale._id,
                    type: LoyaltyType.EARN,
                    points: earnedPoints,
                    referenceNumber: saleNumber,
                    createdBy: cashierId,
                    date: Date.now()
                }], { session });
            }
            customer.purchaseHistory.push(sale._id);
            await customer.save({ session });
        }

        // 4. Audit Log
        await createAuditLog({
            performedBy: cashierId,
            action: 'CREATE_SALE',
            module: 'SALES',
            targetId: sale._id,
            targetModel: 'Sale',
            after: sale.toObject(),
            session
        });

        // 5. Create Journal Entries (Accounting)
        const salesAccount = await Account.findOne({ name: 'Sales Account' }).session(session);
        const receivableAccount = await Account.findOne({ name: 'Accounts Receivable' }).session(session);

        if (salesAccount && receivableAccount) {
            const entries = [
                {
                    voucherType: 'SALE',
                    voucherId: sale._id,
                    accountId: receivableAccount._id,
                    debit: sale.grandTotal,
                    credit: 0,
                    narration: `Sale ${sale.saleNumber}`,
                    createdBy: cashierId
                },
                {
                    voucherType: 'SALE',
                    voucherId: sale._id,
                    accountId: salesAccount._id,
                    debit: 0,
                    credit: calculatedSubTotal,
                    narration: `Sale ${sale.saleNumber}`,
                    createdBy: cashierId
                }
            ];

            // 5.1. Add Discount entry
            if (sale.discount > 0) {
                let discountAccount = await Account.findOne({ name: 'Discount Expense' }).session(session);
                if (!discountAccount) {
                    const [newAccount] = await Account.create([{
                        name: 'Discount Expense',
                        type: 'EXPENSE',
                        code: 'DISCOUNT_EXP',
                        isSystem: true
                    }], { session });
                    discountAccount = newAccount;
                }
                entries.push({
                    voucherType: 'SALE',
                    voucherId: sale._id,
                    accountId: discountAccount._id,
                    debit: sale.discount,
                    credit: 0,
                    narration: `Discount on Sale ${sale.saleNumber}`,
                    createdBy: cashierId
                });
            }

            // 5.2. Add Loyalty Redemption entry
            if (loyaltyRedemptionAmount > 0) {
                let loyaltyAccount = await Account.findOne({ name: 'Loyalty Expense' }).session(session);
                if (!loyaltyAccount) {
                    const [newAcc] = await Account.create([{
                        name: 'Loyalty Expense',
                        type: 'EXPENSE',
                        code: 'LOYALTY_EXP',
                        isSystem: true
                    }], { session });
                    loyaltyAccount = newAcc;
                }
                
                entries.push({
                    voucherType: 'SALE',
                    voucherId: sale._id,
                    accountId: loyaltyAccount._id,
                    debit: loyaltyRedemptionAmount,
                    credit: 0,
                    narration: `Loyalty Redemption ${sale.saleNumber}`,
                    createdBy: cashierId
                });
            }
            // 5.3. Add Credit Note Control entry
            if (creditNoteAppliedAmount > 0) {
                const creditNoteAccount = await Account.findOne({ name: 'Credit Note Control' }).session(session);
                if (creditNoteAccount) {
                    entries.push({
                        voucherType: 'SALE',
                        voucherId: sale._id,
                        accountId: creditNoteAccount._id,
                        debit: creditNoteAppliedAmount,
                        credit: 0,
                        narration: `Credit Note Usage ${sale.saleNumber}`,
                        createdBy: cashierId
                    });
                }
            }
            // If there's tax, add GST entry
            if (sale.totalTax > 0) {
                const gstAccount = await Account.findOne({ name: 'GST Payable' }).session(session);
                if (gstAccount) {
                    entries.push({
                        voucherType: 'SALE',
                        voucherId: sale._id,
                        accountId: gstAccount._id,
                        debit: 0,
                        credit: sale.totalTax,
                        narration: `GST on Sale ${sale.saleNumber}`,
                        createdBy: cashierId
                    });
                }
            }

            await ledgerService.createJournalEntries(entries, session);

            // 5.4. Add Payment Receipt entry if paid immediately
            if (sale.amountPaid > 0) {
                const cashAccount = await Account.findOne({ name: 'Cash Account' }).session(session);
                const bankAccount = await Account.findOne({ name: 'Bank Account' }).session(session);
                
                // Determine account based on paymentMode
                let paymentAccount = cashAccount;
                if (['CARD', 'UPI'].includes(sale.paymentMode)) {
                    paymentAccount = bankAccount;
                }

                if (paymentAccount && receivableAccount) {
                    await ledgerService.createJournalEntries([
                        {
                            voucherType: sale.paymentMode === 'CASH' ? 'CASH_RECEIPT' : 'BANK_RECEIPT',
                            voucherId: sale._id,
                            accountId: paymentAccount._id,
                            debit: sale.amountPaid,
                            credit: 0,
                            narration: `Payment received for Sale ${sale.saleNumber}`,
                            createdBy: cashierId
                        },
                        {
                            voucherType: sale.paymentMode === 'CASH' ? 'CASH_RECEIPT' : 'BANK_RECEIPT',
                            voucherId: sale._id,
                            accountId: receivableAccount._id,
                            debit: 0,
                            credit: sale.amountPaid,
                            narration: `Payment received for Sale ${sale.saleNumber}`,
                            createdBy: cashierId
                        }
                    ], session);
                }
            }
        } 

        return sale;
    });

    // 5. Real-time update (OUTSIDE transaction - only if commit succeeds)
    if (result) {
        try {
            getIO().emit('new-sale', {
                saleNumber: result.saleNumber,
                storeId: result.storeId,
                grandTotal: result.grandTotal,
                timestamp: result.saleDate
            });
        } catch (err) {
            console.error('Socket emit failed:', err.message);
        }
    }

    return result;
};

/**
 * List Sales
 */
const getAllSales = async (query, user) => {
    const { page = 1, limit = 10, storeId, startDate, endDate } = query;
    const filter = { isDeleted: false };

    // If store staff, enforce their own store only
    if (user.role === 'store_staff') {
        if (!user.shopId) {
            throw new Error('User is not linked to any store. Please contact administrator.');
        }
        filter.storeId = user.shopId;
    } else if (storeId) {
        filter.storeId = storeId;
    }

    if (startDate || endDate) {
        filter.saleDate = {};
        if (startDate) filter.saleDate.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.saleDate.$lte = end;
        }
    }

    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
        Sale.find(filter)
            .sort({ saleDate: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('storeId', 'name')
            .populate('cashierId', 'name')
            .populate('products.productId', 'name sku barcode size color category'),
        Sale.countDocuments(filter)
    ]);

    return { sales, total, page: parseInt(page), limit: parseInt(limit) };
};

const getSaleById = async (id) => {
    const sale = await Sale.findOne({ _id: id, isDeleted: false })
        .populate('storeId')
        .populate('cashierId', 'name')
        .populate('products.productId');
    if (!sale) throw new Error('Sale not found');
    return sale;
};

/**
 * Cancel a Sale
 */
const cancelSale = async (id, userId) => {
    return await withTransaction(async (session) => {
        const sale = await Sale.findById(id).session(session);
        if (!sale) throw new Error('Sale not found');
        if (sale.status !== SaleStatus.COMPLETED) throw new Error('Only completed sales can be cancelled');

        // 1. Reverse Stock
        for (const item of sale.products) {
            await adjustStoreStock({
                productId: item.productId,
                variantId: item.productId,
                storeId: sale.storeId,
                quantityChange: item.quantity,
                type: StockMovementType.RETURN,
                referenceId: sale._id,
                referenceModel: 'Sale',
                performedBy: userId,
                notes: `Sale ${sale.saleNumber} cancellation stock reversal`,
                session
            });

            // Update Store Inventory quantitySold
            await StoreInventory.findOneAndUpdate(
                { storeId: sale.storeId, productId: item.productId },
                { $inc: { quantitySold: -item.quantity } },
                { session }
            );
        }

        // 2. Reverse Loyalty Points
        if (sale.customerId) {
            const customer = await Customer.findById(sale.customerId).session(session);
            if (customer) {
                // Claw back earned points
                const pointsToClawback = Math.floor(sale.grandTotal / LOYALTY_EARNING_RATIO);
                if (pointsToClawback > 0) {
                    customer.loyaltyPoints -= pointsToClawback;
                    customer.totalEarned -= pointsToClawback;

                    await LoyaltyTransaction.create([{
                        customerId: sale.customerId,
                        saleId: sale._id,
                        type: LoyaltyType.REDEEM, // Mark as deduction
                        points: pointsToClawback,
                        referenceNumber: sale.saleNumber,
                        createdBy: userId,
                        notes: 'Clawback due to sale cancellation'
                    }], { session });
                }

                // Restore redeemed points if any
                if (sale.loyaltyRedeemed > 0) {
                    const pointsRestored = sale.loyaltyRedeemed / LOYALTY_POINT_VALUE;
                    customer.loyaltyPoints += pointsRestored;
                    customer.totalRedeemed -= pointsRestored;

                    await LoyaltyTransaction.create([{
                        customerId: sale.customerId,
                        saleId: sale._id,
                        type: LoyaltyType.EARN, // Mark as restoration
                        points: pointsRestored,
                        referenceNumber: sale.saleNumber,
                        createdBy: userId,
                        notes: 'Restoration due to sale cancellation'
                    }], { session });
                }
                await customer.save({ session });
            }
        }

        // 3. Restore Credit Note
        if (sale.creditNoteId && sale.creditNoteApplied > 0) {
            const creditNote = await CreditNote.findById(sale.creditNoteId).session(session);
            if (creditNote) {
                creditNote.remainingAmount += sale.creditNoteApplied;
                if (creditNote.status === CreditNoteStatus.USED) {
                    creditNote.status = CreditNoteStatus.ACTIVE;
                }
                await creditNote.save({ session });
            }
        }

        // 4. Reverse Ledger Entries
        const salesAccount = await Account.findOne({ name: 'Sales Account' }).session(session);
        const receivableAccount = await Account.findOne({ name: 'Accounts Receivable' }).session(session);
        const discountAccount = await Account.findOne({ name: 'Discount Expense' }).session(session);
        const loyaltyAccount = await Account.findOne({ name: 'Loyalty Expense' }).session(session);
        const creditNoteAccount = await Account.findOne({ name: 'Credit Note Control' }).session(session);
        const gstAccount = await Account.findOne({ name: 'GST Payable' }).session(session);

        const reversalEntries = [];

        if (receivableAccount) {
            reversalEntries.push({
                voucherType: 'SALE_CANCEL', voucherId: sale._id, accountId: receivableAccount._id,
                debit: 0, credit: sale.grandTotal, narration: `Cancel Sale ${sale.saleNumber}`, createdBy: userId
            });
        }
        if (salesAccount) {
            reversalEntries.push({
                voucherType: 'SALE_CANCEL', voucherId: sale._id, accountId: salesAccount._id,
                debit: sale.subTotal, credit: 0, narration: `Cancel Sale ${sale.saleNumber}`, createdBy: userId
            });
        }
        if (sale.discount > 0 && discountAccount) {
            reversalEntries.push({
                voucherType: 'SALE_CANCEL', voucherId: sale._id, accountId: discountAccount._id,
                debit: 0, credit: sale.discount, narration: `Cancel Sale ${sale.saleNumber} discount`, createdBy: userId
            });
        }
        if (sale.loyaltyRedeemed > 0 && loyaltyAccount) {
            reversalEntries.push({
                voucherType: 'SALE_CANCEL', voucherId: sale._id, accountId: loyaltyAccount._id,
                debit: 0, credit: sale.loyaltyRedeemed, narration: `Cancel Sale ${sale.saleNumber} loyalty restoration`, createdBy: userId
            });
        }
        if (sale.creditNoteApplied > 0 && creditNoteAccount) {
            reversalEntries.push({
                voucherType: 'SALE_CANCEL', voucherId: sale._id, accountId: creditNoteAccount._id,
                debit: 0, credit: sale.creditNoteApplied, narration: `Cancel Sale ${sale.saleNumber} credit note restoration`, createdBy: userId
            });
        }
        if (sale.totalTax > 0 && gstAccount) {
            reversalEntries.push({
                voucherType: 'SALE_CANCEL', voucherId: sale._id, accountId: gstAccount._id,
                debit: sale.totalTax, credit: 0, narration: `Cancel Sale ${sale.saleNumber} tax reversal`, createdBy: userId
            });
        }

        if (reversalEntries.length > 0) {
            await ledgerService.createJournalEntries(reversalEntries, session);
        }

        // 5. Update Status
        sale.status = SaleStatus.CANCELLED;
        await sale.save({ session });

        // 6. Audit Log
        await createAuditLog({
            performedBy: userId,
            action: 'CANCEL_SALE',
            module: 'SALES',
            targetId: sale._id,
            targetModel: 'Sale',
            before: { status: SaleStatus.COMPLETED },
            after: { status: SaleStatus.CANCELLED },
            session
        });

        return sale;
    });
};

/**
 * Apply a Credit Note against an existing sale's dueAmount.
 */
const applyCreditNote = async (saleId, creditNoteId, userId) => {
    return await withTransaction(async (session) => {
        // 1. Load sale
        const sale = await Sale.findById(saleId).session(session);
        if (!sale || sale.isDeleted) throw new Error('Sale not found');
        if (sale.dueAmount <= 0) throw new Error('Sale has no outstanding due amount');

        // 2. Load & validate credit note
        const creditNote = await CreditNote.findById(creditNoteId).session(session);
        if (!creditNote) throw new Error('Credit note not found');
        if (creditNote.status !== CreditNoteStatus.ACTIVE) throw new Error('Credit note is not active');
        if (creditNote.customerId.toString() !== (sale.customerId || '').toString()) {
            throw new Error('Credit note does not belong to the customer on this sale');
        }
        if (creditNote.remainingAmount <= 0) throw new Error('Credit note has zero remaining balance');

        // 3. Calculate amount to apply (min of remaining and due)
        const applyAmount = Math.min(creditNote.remainingAmount, sale.dueAmount);
        const applyAmountFixed = Number(applyAmount.toFixed(2));

        // 4. Update sale
        sale.dueAmount = Number((sale.dueAmount - applyAmountFixed).toFixed(2));
        sale.creditNoteApplied = Number(((sale.creditNoteApplied || 0) + applyAmountFixed).toFixed(2));
        sale.creditNoteId = sale.creditNoteId || creditNoteId; 
        if (sale.dueAmount <= 0) sale.status = SaleStatus.COMPLETED;
        await sale.save({ session });

        // 5. Drain credit note
        creditNote.remainingAmount = Number((creditNote.remainingAmount - applyAmountFixed).toFixed(2));
        if (creditNote.remainingAmount <= 0) {
            creditNote.remainingAmount = 0;
            creditNote.status = CreditNoteStatus.USED;
        }
        await creditNote.save({ session });

        // 6. Post ledger entries 
        const receivableAccount = await Account.findOne({ name: 'Accounts Receivable' }).session(session);
        let creditNoteAccount = await Account.findOne({ name: 'Credit Note Control' }).session(session);

        if (!creditNoteAccount) {
            const [newAcc] = await Account.create([{
                name: 'Credit Note Control',
                type: 'LIABILITY',
                code: 'CREDIT_NOTE_CTRL',
                isSystem: true
            }], { session });
            creditNoteAccount = newAcc;
        }

        const ledgerEntries = [];
        if (receivableAccount) {
            ledgerEntries.push({
                voucherType: 'CREDIT_NOTE',
                voucherId: sale._id,
                accountId: receivableAccount._id,
                debit: 0,
                credit: applyAmountFixed,
                narration: `Credit Note ${creditNote.creditNoteNumber} applied on ${sale.saleNumber}`,
                createdBy: userId
            });
        }
        if (creditNoteAccount) {
            ledgerEntries.push({
                voucherType: 'CREDIT_NOTE',
                voucherId: sale._id,
                accountId: creditNoteAccount._id,
                debit: applyAmountFixed,
                credit: 0,
                narration: `Credit Note ${creditNote.creditNoteNumber} applied on ${sale.saleNumber}`,
                createdBy: userId
            });
        }
        if (ledgerEntries.length > 0) {
            await ledgerService.createJournalEntries(ledgerEntries, session);
        }

        return {
            saleId: sale._id,
            saleNumber: sale.saleNumber,
            creditNoteNumber: creditNote.creditNoteNumber,
            amountApplied: applyAmountFixed,
            remainingDue: sale.dueAmount,
            creditNoteRemainingBalance: creditNote.remainingAmount,
            creditNoteStatus: creditNote.status
        };
    });
};

module.exports = {
    getProductForSale,
    createSale,
    getAllSales,
    getSaleById,
    cancelSale,
    applyCreditNote
};
