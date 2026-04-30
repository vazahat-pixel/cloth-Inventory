const Sale = require('../../models/sale.model');
const mongoose = require('mongoose');
const StoreInventory = require('../../models/storeInventory.model');
const Product = require('../../models/product.model');
const { SaleStatus, StockMovementType, DocumentType } = require('../../core/enums');
const workflowService = require('../workflow/workflow.service.js');
const { withTransaction } = require('../../services/transaction.service');
const { adjustStoreStock } = require('../../services/stock.service');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { getIO } = require('../../config/socket');
const Account = require('../../models/account.model');
const ledgerService = require('../../services/ledger.service');
const stockService = require('../../services/stock.service');
const StorePricing = require('../../models/storePricing.model');
const Customer = require('../../models/customer.model');
const LoyaltyTransaction = require('../../models/loyaltyTransaction.model');
const CreditNote = require('../../models/creditNote.model');
const { calculateGST } = require('../../services/gst.service');
const { getNextSequence } = require('../../services/sequence.service');
const Item = require('../../models/item.model');
const toNumber = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
};

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
    // Search in Item collection's sizes array for either barcode or sku
    const parentItem = await Item.findOne({ 
        $or: [
            { "sizes.barcode": barcode }, 
            { "sizes.sku": barcode }
        ],
        isActive: true 
    }).populate('hsCodeId');
    
    if (!parentItem) throw new Error('Product not found for this identifier: ' + barcode);

    const variant = parentItem.sizes.find(sz => sz.barcode === barcode || sz.sku === barcode);
    if (!variant) throw new Error('Variant not found for this identifier: ' + barcode);

    // Check stock from StoreInventory
    const StoreInventory = require('../../models/storeInventory.model');
    let inventory = await StoreInventory.findOne({ storeId, barcode });
    
    if (!inventory) {
        const WarehouseInventory = require('../../models/warehouseInventory.model');
        inventory = await WarehouseInventory.findOne({ warehouseId: storeId, barcode });
    }

    const availableQty = inventory ? (inventory.quantityAvailable ?? inventory.quantity ?? 0) : 0;

    if (availableQty <= 0) {
        throw new Error(`Out of stock for barcode ${barcode} in this location`);
    }

    return {
        _id: variant._id,
        productId: parentItem._id, // Link to master item for promotions
        variantId: variant._id,   // Specific variant ID
        name: parentItem.itemName,
        sku: variant.sku || parentItem.itemCode,
        barcode: variant.barcode,
        size: variant.size,
        color: variant.color || parentItem.shade,
        salePrice: toNumber(variant.salePrice || parentItem.salePrice || variant.mrp || parentItem.mrp),
        mrp: toNumber(variant.mrp || parentItem.mrp || variant.salePrice || parentItem.salePrice),
        available: availableQty,
        category: parentItem.categoryId,
        brand: parentItem.brand,
        hsnCode: parentItem.hsCodeId?.code || parentItem.hsnCode || ''
    };
};

/**
 * Create a new Sale
 */
const createSale = async (saleData, cashierId, sessionOuter = null) => {
        const handle = async (session) => {
        const storeId = saleData.storeId || saleData.warehouseId;
        const products = saleData.products || saleData.items || [];
        const {
            subTotal,
            discount,
            tax,
            grandTotal,
            paymentMode,
            customerId,
            customerName,
            customerMobile,
            customerAddress,
            redeemPoints,
            creditNoteId,
            type = 'RETAIL',
            parentSaleId,
            exchangeDetails // { originalSaleId, items: [{ barcode, quantity, price }] }
        } = saleData;

        // 0. Find or Create Customer
        let customer = null;
        if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
            customer = await Customer.findById(customerId).session(session);
        } else if (customerMobile && customerMobile.trim()) {
            // Find by phone or Create new on-the-fly
            const trimmedMobile = customerMobile.trim();
            customer = await Customer.findOne({ phone: trimmedMobile }).session(session);
            
            if (!customer && customerName && customerName.trim()) {
                customer = new Customer({
                    name: customerName.trim(),
                    phone: trimmedMobile,
                    address: customerAddress || undefined,
                    isActive: true,
                    createdBy: cashierId
                });
                await customer.save({ session });
            } else if (customer && customerAddress && !customer.address) {
                // If customer exists but has no address, update it
                customer.address = customerAddress;
                await customer.save({ session });
            }
        }
        const finalCustomerId = customer?._id || (mongoose.Types.ObjectId.isValid(customerId) ? customerId : null);
        const finalCustomerName = customer?.name || customerName || 'Walk-in Customer';

        // 1. Generate Sale Number
        const saleNumber = await generateSaleNumber(session);

        // 2. Process NEW Products and Update Inventory
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        let totalTax = 0;
        let calculatedSubTotal = 0;
        const stockMovements = [];

        for (const item of products) {
            const barcode = item.barcode;
            let inventory = await StoreInventory.findOne({ storeId, barcode }).populate({ path: 'itemId', populate: { path: 'hsCodeId' } }).session(session);
            
            // IF SOURCE IS A WAREHOUSE, we need to check StockLedger/Warehouse Stock
            if (!inventory) {
                const Warehouse = require('../../models/warehouse.model');
                const isWarehouse = await Warehouse.exists({ _id: storeId });

                if (isWarehouse) {
                    const WarehouseInventory = require('../../models/warehouseInventory.model');
                    const warehouseInv = await WarehouseInventory.findOne({ barcode, warehouseId: storeId }).populate({ path: 'itemId', populate: { path: 'hsCodeId' } }).session(session);

                    if (warehouseInv) {
                        // Create a "MOCK" inventory object to satisfy the existing logic
                        inventory = {
                            itemId: warehouseInv.itemId,
                            variantId: warehouseInv.variantId,
                            quantity: warehouseInv.quantity,
                            fromWarehouse: true
                        };
                    }
                }
            }

            if (!inventory) throw new Error(`Stock not found for barcode: ${barcode}`);
            if (inventory.quantity < item.quantity) {
                throw new Error(`Insufficient stock for ${inventory.itemId?.itemName || 'Item'} (Available: ${inventory.quantity})`);
            }

            const parentItem = inventory.itemId;
            const variant = parentItem.sizes?.find(s => s.barcode === barcode);

            const mrp = toNumber(item.mrp || variant?.mrp || parentItem.mrp || variant?.salePrice || parentItem.salePrice);
            const rate = toNumber(item.rate || item.price || variant?.salePrice || parentItem.salePrice);
            const discountPercent = toNumber(item.discount || 0);
            const promoDiscount = toNumber(item.promoDiscount || 0);

            const grossLineTotal = rate * item.quantity;
            const manualDiscountAmt = (grossLineTotal * discountPercent) / 100;
            const totalDiscountAmt = manualDiscountAmt + promoDiscount;
            const lineTotal = grossLineTotal - totalDiscountAmt;
            const gstPercentage = item.taxPercentage || parentItem.gstTax || 0;
            
            let taxableAmount;
            let gstData = { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };

            if (saleData.isInclusiveTax) {
                // Back-calculate taxable from inclusive total
                taxableAmount = lineTotal / (1 + (gstPercentage / 100));
                const totalTaxLine = lineTotal - taxableAmount;
                const gstType = saleData.gstType || 'CGST_SGST';
                
                if (gstType === 'CGST_SGST') {
                    const cgst = totalTaxLine / 2;
                    gstData = { cgst, sgst: totalTaxLine - cgst, igst: 0, totalTax: totalTaxLine };
                } else {
                    gstData = { cgst: 0, sgst: 0, igst: totalTaxLine, totalTax: totalTaxLine };
                }
            } else {
                taxableAmount = lineTotal;
                // If tax data is already provided (e.g. from Dispatch module), use it
                if (item.taxAmount !== undefined && item.taxAmount !== null) {
                    gstData = {
                        cgst: toNumber(item.cgst),
                        sgst: toNumber(item.sgst),
                        igst: toNumber(item.igst),
                        totalTax: toNumber(item.taxAmount)
                    };
                } else if (gstPercentage > 0) {
                    const gstType = saleData.gstType || 'CGST_SGST';
                    gstData = calculateGST(taxableAmount, gstPercentage, gstType);
                }
            }

            calculatedSubTotal += taxableAmount;

            totalCGST += gstData.cgst;
            totalSGST += gstData.sgst;
            totalIGST += gstData.igst;
            totalTax += gstData.totalTax;

            // Updated item object for sale record
            item.itemId = parentItem._id;
            item.variantId = inventory.variantId;
            item.itemName = item.itemName || parentItem.itemName || parentItem.name;
            item.sku = item.sku || variant?.sku || parentItem.sku;
            item.hsnCode = item.hsnCode || parentItem.hsnCode || parentItem.hsCodeId?.code || '';
            item.category = item.category || parentItem.categoryName || parentItem.categoryId?.name || '';
            item.brand = item.brand || parentItem.brandName || parentItem.brandId?.name || '';
            item.promoDiscount = promoDiscount;
            item.discountPercent = discountPercent;
            item.discountAmount = totalDiscountAmt;
            item.discount = discountPercent; // Keep for backward compatibility
            item.mrp = mrp;
            item.rate = rate;
            item.taxAmount = gstData.totalTax;
            item.taxPercentage = gstPercentage;
            item.total = taxableAmount + gstData.totalTax;

            stockMovements.push({
                itemId: parentItem._id,
                barcode: barcode,
                variantId: inventory.variantId,
                storeId,
                quantity: item.quantity,
                type: 'SALE',
                locationType: inventory.fromWarehouse ? 'WAREHOUSE' : 'STORE'
            });
        }

        // 2.0 Process EXCHANGE / RETURNS
        let totalReturnValue = 0;
        let returnItemsProcessed = [];
        if (exchangeDetails && exchangeDetails.originalSaleId) {
            const originalSale = await Sale.findById(exchangeDetails.originalSaleId).session(session);
            if (!originalSale) throw new Error('Original sale for exchange not found');

            for (const rItem of exchangeDetails.items) {
                const matchedSaleItem = originalSale.items.find(si => si.barcode === rItem.barcode);
                if (!matchedSaleItem) throw new Error(`Item ${rItem.barcode} was not part of the original sale`);

                // Check previously returned quantity? (ERP logic usually needs salesReturn records)
                // For now, simple check:
                if (rItem.quantity > matchedSaleItem.quantity) {
                    throw new Error(`Return quantity for ${rItem.barcode} exceeds original purchased quantity`);
                }

                const itemReturnValue = (matchedSaleItem.rate * rItem.quantity); // Returns at original rate
                const itemReturnTax = (matchedSaleItem.taxAmount / matchedSaleItem.quantity) * rItem.quantity;
                
                totalReturnValue += (itemReturnValue + itemReturnTax);

                returnItemsProcessed.push({
                    itemId: matchedSaleItem.itemId,
                    barcode: rItem.barcode,
                    variantId: matchedSaleItem.variantId,
                    quantity: rItem.quantity,
                    rate: matchedSaleItem.rate,
                    taxAmount: itemReturnTax,
                    total: itemReturnValue + itemReturnTax
                });

                // Stock Movement (Add back to stock)
                stockMovements.push({
                    itemId: matchedSaleItem.itemId,
                    barcode: rItem.barcode,
                    variantId: matchedSaleItem.variantId,
                    storeId,
                    quantity: rItem.quantity,
                    type: 'RETURN'
                });
            }
        }
        // 2.1. Handle Loyalty Redemption
        let loyaltyRedemptionAmount = 0;
        if (customerId) {
            if (!customer) {
                customer = await Customer.findById(customerId).session(session);
            }
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

        const finalGrandTotal = Number(Math.max(0, (calculatedSubTotal || 0) + (totalTax || 0) - (discount || 0) - (loyaltyRedemptionAmount || 0) - (creditNoteAppliedAmount || 0) - (totalReturnValue || 0)).toFixed(2)) || 0;
        const exchangeAdjustment = totalReturnValue || 0;

        // 3. Create Sale Record
        const amountPaid = Number(saleData.amountPaid || 0);
        const dueAmount = Number((finalGrandTotal - amountPaid).toFixed(2)) || 0;

        // 5. Save Sale Record
        const sale = new Sale({
            saleNumber,
            storeId,
            destinationStoreId: saleData.destinationStoreId,
            cashierId: cashierId,
            customerId: saleData.customerId,
            customerName: saleData.customerName,
            customerMobile: saleData.customerMobile,
            customerAddress: saleData.customerAddress,
            type: saleData.type || 'RETAIL',
            parentSaleId,
            items: products.map(p => ({
                itemId: p.itemId,
                variantId: p.variantId,
                barcode: p.barcode,
                quantity: p.quantity,
                mrp: p.mrp,
                rate: p.rate,
                discount: p.discount || 0,
                taxAmount: p.taxAmount || 0,
                taxPercentage: p.taxPercentage || 0,
                total: p.total
            })),
            subTotal: calculatedSubTotal,
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
            grandTotal: finalGrandTotal,
            exchangeAdjustment,
            returnedItems: returnItemsProcessed,
            amountPaid,
            dueAmount,
            customerId: finalCustomerId,
            customerName: finalCustomerName,
            paymentMode: saleData.paymentMode || 'CASH',
            status: dueAmount > 0 ? SaleStatus.PARTIAL : SaleStatus.COMPLETED,
            saleDate: Date.now()
        });
        await sale.save({ session });

        // 4. Update Stock and Record in Ledger
        for (const mov of stockMovements) {
            if (mov.type === 'SALE') {
                await stockService.removeStock({
                    itemId: mov.itemId,
                    barcode: mov.barcode,
                    variantId: mov.variantId,
                    locationId: mov.storeId,
                    locationType: mov.locationType || 'STORE',
                    qty: mov.quantity,
                    type: 'SALE',
                    referenceId: sale._id,
                    referenceType: 'Sale',
                    performedBy: cashierId,
                    session
                });
            } else if (mov.type === 'RETURN') {
                await stockService.addStock({
                    itemId: mov.itemId,
                    barcode: mov.barcode,
                    variantId: mov.variantId,
                    locationId: mov.storeId,
                    locationType: 'STORE',
                    qty: mov.quantity,
                    type: 'RETURN',
                    referenceId: sale._id,
                    referenceType: 'Sale',
                    performedBy: cashierId,
                    session
                });
            }
        }

        // Record Loyalty Transactions (both Redeem and Earn)
        if (finalCustomerId) {
            if (sale.loyaltyRedeemed > 0) {
                await LoyaltyTransaction.create([{
                    customerId: finalCustomerId,
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
        if (customer || finalCustomerId) {
            const earnedPoints = Math.floor(finalGrandTotal / LOYALTY_EARNING_RATIO);
            if (earnedPoints > 0) {
                if (customer) {
                    customer.loyaltyPoints += earnedPoints;
                    customer.totalEarned += earnedPoints;
                }

                await LoyaltyTransaction.create([{
                    customerId: finalCustomerId,
                    saleId: sale._id,
                    type: LoyaltyType.EARN,
                    points: earnedPoints,
                    referenceNumber: saleNumber,
                    createdBy: cashierId,
                    date: Date.now()
                }], { session });
            }
            if (customer) {
                customer.purchaseHistory.push(sale._id);
                await customer.save({ session });
            }
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

        await sale.populate('storeId');
        return sale;
    };

    const result = sessionOuter ? await handle(sessionOuter) : await withTransaction(handle);

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
            .populate({
                path: 'items.itemId',
                select: 'itemName itemCode shade gstTax sizes categoryId hsCodeId',
                populate: [
                    { path: 'categoryId', select: 'name' },
                    { path: 'hsCodeId', select: 'code gstPercent' }
                ]
            }),
        Sale.countDocuments(filter)
    ]);

    return { sales, total, page: parseInt(page), limit: parseInt(limit) };
};

const getSaleById = async (id, user = null) => {
    const sale = await Sale.findOne({ _id: id, isDeleted: false })
        .populate('storeId')
        .populate('cashierId', 'name')
        .populate('customerId', 'customerName mobileNumber loyaltyPoints')
        .populate({
            path: 'items.itemId',
            select: 'itemName itemCode shade gstTax sizes categoryId hsCodeId',
            populate: [
                { path: 'categoryId', select: 'name' },
                { path: 'hsCodeId', select: 'code gstPercent' }
            ]
        });
    
    if (!sale) throw new Error('Sale not found');

    // Security check: Only allow access if user is Admin or belongs to this store
    if (user && user.role === 'store_staff' && sale.storeId && String(sale.storeId._id || sale.storeId) !== String(user.shopId)) {
        throw new Error('Access denied to this sale record');
    }

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
        const stockService = require('../../services/stock.service');
        for (const item of sale.items) {
            await stockService.addStock({
                variantId: item.variantId,
                locationId: sale.storeId,
                locationType: 'STORE',
                qty: item.quantity,
                type: 'RETURN',
                referenceId: sale._id,
                referenceType: 'Sale',
                performedBy: userId,
                session
            });

            // Update Store Inventory quantitySold
            await StoreInventory.findOneAndUpdate(
                { storeId: sale.storeId, barcode: item.barcode },
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
