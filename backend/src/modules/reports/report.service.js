const mongoose = require('mongoose');
const Sale = require('../../models/sale.model');
const Product = require('../../models/product.model');
const StoreInventory = require('../../models/storeInventory.model');
const ProductionBatch = require('../../models/productionBatch.model');
const Return = require('../../models/return.model');
const Account = require('../../models/account.model');
const Ledger = require('../../models/ledger.model');
const Purchase = require('../../models/purchase.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const StockMovement = require('../../models/stockMovement.model');

/**
 * Daily Sales Report
 */
const getDailySalesReport = async (date, storeId) => {
    const start = new Date(date || Date.now());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const match = { saleDate: { $gte: start, $lte: end }, isDeleted: false };
    if (storeId) match.storeId = new (require('mongoose').Types.ObjectId)(storeId);

    return await Sale.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$grandTotal' },
                totalSales: { $count: {} }
            }
        }
    ]);
};

/**
 * Monthly Sales Report
 */
const getMonthlySalesReport = async (month, year, storeId) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const match = { saleDate: { $gte: start, $lte: end }, isDeleted: false };
    if (storeId) match.storeId = new (require('mongoose').Types.ObjectId)(storeId);

    return await Sale.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
                dailyRevenue: { $sum: '$grandTotal' },
                salesCount: { $count: {} }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

/**
 * Store-wise Sales Summary
 */
const getStoreWiseSales = async (startDate, endDate) => {
    const query = { isDeleted: false };
    if (startDate || endDate) {
        query.saleDate = {};
        if (startDate) query.saleDate.$gte = new Date(startDate);
        if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    return await Sale.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$storeId',
                revenue: { $sum: '$grandTotal' },
                salesCount: { $count: {} }
            }
        },
        {
            $lookup: {
                from: 'stores',
                localField: '_id',
                foreignField: '_id',
                as: 'store'
            }
        },
        { $unwind: '$store' },
        {
            $project: {
                storeName: '$store.name',
                revenue: 1,
                salesCount: 1
            }
        },
        { $sort: { revenue: -1 } }
    ]);
};

/**
 * Product-wise Sales Summary
 */
const getProductWiseSales = async (startDate, endDate, storeId) => {
    const query = { isDeleted: false };
    if (startDate || endDate) {
        query.saleDate = {};
        if (startDate) query.saleDate.$gte = new Date(startDate);
        if (endDate) query.saleDate.$lte = new Date(endDate);
    }
    if (storeId) query.storeId = new (require('mongoose').Types.ObjectId)(storeId);

    return await Sale.aggregate([
        { $match: query },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.itemId',
                totalSold: { $sum: '$items.quantity' },
                revenue: { $sum: '$items.total' }
            }
        },
        {
            $lookup: {
                from: 'items',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $project: {
                name: '$product.name',
                sku: '$product.sku',
                totalSold: 1,
                revenue: 1
            }
        },
        { $sort: { totalSold: -1 } }
    ]);
};

/**
 * Fabric Consumption Report
 */
const getFabricConsumption = async () => {
    return await ProductionBatch.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: '$fabricId',
                totalMeterUsed: { $sum: '$meterUsed' },
                batchesCount: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'fabrics',
                localField: '_id',
                foreignField: '_id',
                as: 'fabric'
            }
        },
        { $unwind: '$fabric' },
        {
            $project: {
                fabricType: '$fabric.fabricType',
                color: '$fabric.color',
                totalMeterUsed: 1,
                batchesCount: 1
            }
        }
    ]);
};

/**
 * Low Stock Report
 */
const getLowStockReport = async (storeId) => {
    const productQuery = { isDeleted: false };
    if (!storeId) {
        // Only return factory low stock if no specific store is requested
        const factoryLow = await Product.find({
            $expr: { $lte: ['$factoryStock', { $ifNull: ['$minStockLevel', 10] }] },
            isDeleted: false
        }).select('name sku factoryStock minStockLevel');
        
        const storeLow = await StoreInventory.find({
            $expr: { $lte: ['$quantityAvailable', { $ifNull: ['$minStockLevel', 10] }] }
        }).populate('storeId', 'name').populate('itemId', 'name sku');
        
        return { factoryLow, storeLow };
    }

    const storeLow = await StoreInventory.find({
        storeId,
        $expr: { $lte: ['$quantityAvailable', { $ifNull: ['$minStockLevel', 10] }] }
    }).populate('storeId', 'name').populate('itemId', 'name sku');

    return { factoryLow: [], storeLow };
};

/**
 * Inventory export - flattened stock by location (warehouses + stores)
 */
const getInventoryExport = async (storeId) => {
    // 1. Warehouse inventory
    const warehouseQuery = {};
    if (storeId) warehouseQuery.warehouseId = storeId;
    const warehouseInventory = await WarehouseInventory.find(warehouseQuery)
        .populate('warehouseId', 'name')
        .populate('itemId');

    // 2. Store inventory
    const storeQuery = {};
    if (storeId) storeQuery.storeId = storeId;
    const storeInventory = await StoreInventory.find(storeQuery)
        .populate('storeId', 'name')
        .populate('itemId');

    const rows = [];

    warehouseInventory.forEach((inv) => {
        if (!inv.itemId || !inv.warehouseId) return;
        
        // Find variant info if applicable
        const variant = inv.itemId.sizes?.find(s => s._id.toString() === inv.variantId || s.barcode === inv.barcode);
        
        rows.push({
            locationType: 'WAREHOUSE',
            locationName: inv.warehouseId.name,
            productName: inv.itemId.itemName,
            sku: variant?.sku || inv.itemId.itemCode,
            barcode: inv.barcode || variant?.barcode || inv.itemId.itemCode,
            size: variant?.size || inv.itemId.accessorySize || inv.itemId.width || '-',
            color: variant?.color || inv.itemId.shadeNo || '-',
            category: inv.itemId.categoryId,
            brand: inv.itemId.brand,
            quantity: inv.quantity,
            quantityAvailable: inv.quantity,
            minStockLevel: inv.reorderLevel || 0
        });
    });

    storeInventory.forEach((inv) => {
        if (!inv.itemId || !inv.storeId) return;
        
        const variant = inv.itemId.sizes?.find(s => s._id.toString() === inv.variantId || s.barcode === inv.barcode);
        const available = typeof inv.quantityAvailable === 'number' ? inv.quantityAvailable : inv.quantity || 0;
        
        rows.push({
            locationType: 'STORE',
            locationName: inv.storeId.name,
            productName: inv.itemId.itemName,
            sku: variant?.sku || inv.itemId.itemCode,
            barcode: inv.barcode || variant?.barcode || inv.itemId.itemCode,
            size: variant?.size || inv.itemId.accessorySize || inv.itemId.width || '-',
            color: variant?.color || inv.itemId.shadeNo || '-',
            category: inv.itemId.categoryId,
            brand: inv.itemId.brand,
            quantity: inv.quantity,
            quantityAvailable: available,
            minStockLevel: inv.reorderLevel || 0
        });
    });

    return rows;
};

/**
 * Return Summary Report
 */
const getReturnSummary = async (storeId) => {
    const match = { isDeleted: false };
    if (storeId) match.storeId = new (require('mongoose').Types.ObjectId)(storeId);
    
    return await Return.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$type',
                totalQuantity: { $sum: '$quantity' },
                count: { $sum: 1 }
            }
        }
    ]);
};

/**
 * Ledger Report with Running Balance
 */
const getLedgerReport = async (accountId) => {
    const entries = await Ledger.find({ accountId })
        .sort({ date: 1 })
        .populate('accountId', 'name type code')
        .populate('createdBy', 'name');

    let runningBalance = 0;
    return entries.map(entry => {
        const accountType = entry.accountId.type;
        // For Assets and Expenses: Balance = Debit - Credit
        // For Liabilities, Income, and Equity: Balance = Credit - Debit
        const isDebitNormal = ['ASSET', 'EXPENSE'].includes(accountType);
        const change = isDebitNormal ? (entry.debit - entry.credit) : (entry.credit - entry.debit);

        runningBalance += change;

        return {
            ...entry.toObject(),
            runningBalance: Number(runningBalance.toFixed(2))
        };
    });
};

/**
 * Trial Balance Report
 */
const getTrialBalance = async (startDate, endDate) => {
    const match = {};
    if (startDate || endDate) {
        match.date = {};
        if (startDate) match.date.$gte = new Date(startDate);
        if (endDate) match.date.$lte = new Date(endDate);
    }

    const trialBalance = await Ledger.aggregate([
        { $match: Object.keys(match).length ? match : {} },
        {
            $group: {
                _id: '$accountId',
                totalDebit: { $sum: '$debit' },
                totalCredit: { $sum: '$credit' }
            }
        },
        {
            $lookup: {
                from: 'accounts',
                localField: '_id',
                foreignField: '_id',
                as: 'account'
            }
        },
        { $unwind: '$account' },
        {
            $project: {
                name: '$account.name',
                code: '$account.code',
                type: '$account.type',
                totalDebit: 1,
                totalCredit: 1,
                balance: { $subtract: ['$totalDebit', '$totalCredit'] }
            }
        }
    ]);

    // Validation: Total Debits must equal Total Credits
    let totalDebitSum = 0;
    let totalCreditSum = 0;
    trialBalance.forEach(item => {
        totalDebitSum += item.totalDebit;
        totalCreditSum += item.totalCredit;
    });

    // Allowing very small decimal difference due to floating point
    if (Math.abs(totalDebitSum - totalCreditSum) > 0.1) {
        console.warn(`Financial Inconsistency: Total Debit (${totalDebitSum}) != Total Credit (${totalCreditSum})`);
    }

    return { 
        trialBalance: trialBalance.map(t => ({ ...t, balance: Number(t.balance.toFixed(2)) })), 
        totalDebitSum: Number(totalDebitSum.toFixed(2)), 
        totalCreditSum: Number(totalCreditSum.toFixed(2)) 
    };
};

/**
 * Profit & Loss Statement
 */
const getProfitAndLoss = async (startDate, endDate) => {
    const match = {};
    if (startDate || endDate) {
        match.date = {};
        if (startDate) match.date.$gte = new Date(startDate);
        if (endDate) match.date.$lte = new Date(endDate);
    }

    const accounts = await Account.find({ type: { $in: ['INCOME', 'EXPENSE'] } });
    const accountIds = accounts.map(a => a._id);

    const aggregates = await Ledger.aggregate([
        {
            $match: {
                ...(Object.keys(match).length ? match : {}),
                accountId: { $in: accountIds }
            }
        },
        {
            $group: {
                _id: '$accountId',
                totalDebit: { $sum: '$debit' },
                totalCredit: { $sum: '$credit' }
            }
        }
    ]);

    const income = [];
    const expense = [];
    let totalIncome = 0;
    let totalExpense = 0;

    aggregates.forEach(agg => {
        const acc = accounts.find(a => a._id.toString() === agg._id.toString());
        if (acc.type === 'INCOME') {
            const balance = agg.totalCredit - agg.totalDebit;
            income.push({ name: acc.name, balance });
            totalIncome += balance;
        } else {
            const balance = agg.totalDebit - agg.totalCredit;
            expense.push({ name: acc.name, balance });
            totalExpense += balance;
        }
    });

    return { 
        income: income.map(i => ({ ...i, balance: Number(i.balance.toFixed(2)) })), 
        expense: expense.map(e => ({ ...e, balance: Number(e.balance.toFixed(2)) })), 
        totalIncome: Number(totalIncome.toFixed(2)), 
        totalExpense: Number(totalExpense.toFixed(2)), 
        netProfit: Number((totalIncome - totalExpense).toFixed(2)) 
    };
};

/**
 * Balance Sheet
 */
const getBalanceSheet = async (asOfDate) => {
    const filterDate = asOfDate ? new Date(asOfDate) : new Date();

    // 1. Get Profit & Loss up to this date to calculate retained earnings if needed
    const pl = await getProfitAndLoss(null, filterDate);

    const match = { date: { $lte: filterDate } };
    const accounts = await Account.find({ type: { $in: ['ASSET', 'LIABILITY', 'EQUITY'] } });
    const accountIds = accounts.map(a => a._id);

    const aggregates = await Ledger.aggregate([
        { $match: { ...match, accountId: { $in: accountIds } } },
        {
            $group: {
                _id: '$accountId',
                totalDebit: { $sum: '$debit' },
                totalCredit: { $sum: '$credit' }
            }
        }
    ]);

    const assets = [];
    const liabilities = [];
    const equity = [];
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    aggregates.forEach(agg => {
        const acc = accounts.find(a => a._id.toString() === agg._id.toString());
        if (acc.type === 'ASSET') {
            const balance = agg.totalDebit - agg.totalCredit;
            assets.push({ name: acc.name, balance });
            totalAssets += balance;
        } else if (acc.type === 'LIABILITY') {
            const balance = agg.totalCredit - agg.totalDebit;
            liabilities.push({ name: acc.name, balance });
            totalLiabilities += balance;
        } else {
            const balance = agg.totalCredit - agg.totalDebit;
            equity.push({ name: acc.name, balance });
            totalEquity += balance;
        }
    });

    // Add Net Profit to Equity (Simplified)
    equity.push({ name: 'Net Profit/Loss (Current Period)', balance: pl.netProfit });
    totalEquity += pl.netProfit;

    const balanceSheet = { 
        assets: assets.map(a => ({ ...a, balance: Number(a.balance.toFixed(2)) })), 
        liabilities: liabilities.map(l => ({ ...l, balance: Number(l.balance.toFixed(2)) })), 
        equity: equity.map(e => ({ ...e, balance: Number(e.balance.toFixed(2)) })), 
        totalAssets: Number(totalAssets.toFixed(2)), 
        totalLiabilities: Number(totalLiabilities.toFixed(2)), 
        totalEquity: Number(totalEquity.toFixed(2)) 
    };

    // Balance Check
    if (Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 0.1) {
        console.warn('Balance Sheet Error: Assets do not equal Liabilities + Equity');
    }

    return balanceSheet;
};

const getStockHistory = async (query = {}) => {
    const { itemId, type, storeId } = query;
    const filter = {};
    if (itemId) filter.variantId = itemId;
    if (type) filter.type = type;
    if (storeId) {
        filter.$or = [
            { fromLocation: storeId },
            { toLocation: storeId }
        ];
    }

    return await StockMovement.find(filter)
        .sort({ createdAt: -1 })
        .populate('variantId', 'name sku')
        .populate('performedBy', 'name')
        .limit(100);
};

/**
 * Audit Log Report
 */
const getAuditLogs = async (query = {}) => {
    const { module, action, performedBy } = query;
    const filter = {};
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (performedBy) filter.performedBy = performedBy;

    return await require('../../models/auditLog.model').find(filter)
        .sort({ createdAt: -1 })
        .populate('performedBy', 'name email')
        .limit(100);
};

/**
 * Purchase Register Report
 */
const getPurchaseRegister = async (supplierId, startDate, endDate, storeId) => {
    const query = { status: 'COMPLETED' };

    if (supplierId) query.supplierId = supplierId;
    if (storeId) query.storeId = storeId; 

    if (startDate || endDate) {
        query.invoiceDate = {};
        if (startDate) query.invoiceDate.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.invoiceDate.$lte = end;
        }
    }

    return await Purchase.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                totalPurchase: { $sum: '$subTotal' },
                totalGST: { $sum: '$totalTax' },
                grandTotal: { $sum: '$grandTotal' },
                count: { $sum: 1 }
            }
        }
    ]);
};

/**
 * GST Summary Report
 */
const getGstSummary = async (startDate, endDate, storeId) => {
    const saleQuery = { isDeleted: false, status: 'COMPLETED' };
    const purchaseQuery = { status: 'COMPLETED' };

    if (storeId) {
        const oid = new (require('mongoose').Types.ObjectId)(storeId);
        saleQuery.storeId = oid;
        purchaseQuery.storeId = oid;
    }

    if (startDate || endDate) {
        saleQuery.saleDate = {};
        purchaseQuery.invoiceDate = {};
        if (startDate) {
            saleQuery.saleDate.$gte = new Date(startDate);
            purchaseQuery.invoiceDate.$gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            saleQuery.saleDate.$lte = end;
            purchaseQuery.invoiceDate.$lte = end;
        }
    }

    const salesGst = await Sale.aggregate([
        { $match: saleQuery },
        {
            $group: {
                _id: null,
                taxableValue: { $sum: "$subTotal" },
                cgst: { $sum: "$taxBreakup.cgst" },
                sgst: { $sum: "$taxBreakup.sgst" },
                igst: { $sum: "$taxBreakup.igst" },
                totalTax: { $sum: "$totalTax" }
            }
        }
    ]);

    const purchaseGst = await Purchase.aggregate([
        { $match: purchaseQuery },
        { $unwind: "$products" },
        {
            $group: {
                _id: "$_id",
                subTotal: { $first: "$subTotal" },
                totalTax: { $first: "$totalTax" },
                calcCGST: { $sum: { $cond: [{ $eq: ["$products.gstPercent", 0] }, 0, { $divide: ["$products.gstAmount", 2] }] } },
                calcSGST: { $sum: { $cond: [{ $eq: ["$products.gstPercent", 0] }, 0, { $divide: ["$products.gstAmount", 2] }] } }
            }
        },
        {
            $group: {
                _id: null,
                taxableValue: { $sum: "$subTotal" },
                cgst: { $sum: "$calcCGST" },
                sgst: { $sum: "$calcSGST" },
                igst: { $sum: 0 },
                totalTax: { $sum: "$totalTax" }
            }
        }
    ]);

    return {
        sales: salesGst[0] || { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
        purchases: purchaseGst[0] || { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 }
    };
};

/**
 * Detailed GST Report (GSTR-1 Ready)
 */
const getDetailedGstReport = async (startDate, endDate, storeId) => {
    const match = { isDeleted: false, status: 'COMPLETED' };
    if (storeId) match.storeId = new (require('mongoose').Types.ObjectId)(storeId);
    
    if (startDate || endDate) {
        match.saleDate = {};
        if (startDate) match.saleDate.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            match.saleDate.$lte = end;
        }
    }

    const sales = await Sale.find(match)
        .populate({
            path: 'items.itemId',
            populate: { path: 'hsCodeId' }
        })
        .populate('storeId', 'name gstin location')
        .sort({ saleDate: -1 });

    const hsnSummary = {};
    
    // Pre-populate required standard GST Slabs
    const slabSummary = {
        '5%': { slab: '5%', taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, invoiceValue: 0 },
        '12%': { slab: '12%', taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, invoiceValue: 0 },
        '18%': { slab: '18%', taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, invoiceValue: 0 },
        '28%': { slab: '28%', taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, invoiceValue: 0 }
    };
    
    const b2bInvoices = [];
    const b2cInvoices = [];
    const itemWiseDetails = [];

    let totalTaxableValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalGST = 0;
    let grandTotal = 0;

    sales.forEach(sale => {
        const isB2B = !!(sale.customerGst && sale.customerGst.length >= 15);
        const invSummary = {
            invoice: sale.invoiceNumber || sale.saleNumber,
            date: sale.saleDate,
            customer: sale.customerName,
            gstin: sale.customerGst || 'Unregistered',
            taxable: sale.subTotal,
            igst: sale.taxBreakup?.igst || 0,
            cgst: sale.taxBreakup?.cgst || 0,
            sgst: sale.taxBreakup?.sgst || 0,
            totalTax: sale.totalTax,
            grandTotal: sale.grandTotal
        };

        if (isB2B) b2bInvoices.push(invSummary);
        else b2cInvoices.push(invSummary);

        const isInterstate = sale.taxBreakup && (sale.taxBreakup.igst > 0);

        let saleTaxableSum = 0;
        let saleTaxSum = 0;
        let saleCGSTSum = 0;
        let saleSGSTSum = 0;
        let saleIGSTSum = 0;

        sale.items.forEach((item, idx) => {
            const hsn = item.hsnCode || item.itemId?.hsCodeId?.code || 'N/A';
            const rate = item.taxPercentage || 0;
            const category = item.category || item.itemId?.categoryName || item.itemId?.categoryId?.name || 'GARMENT';

            // Item taxable value (before invoice adjustments)
            const itemGross = item.total || 0;
            const itemTax = item.taxAmount || 0;
            const itemTaxable = itemGross - itemTax;

            // Invoice values
            const invoiceTotal = sale.grandTotal || 0;
            const invoiceSubtotal = sale.subTotal || 0;
            const invoiceTax = sale.totalTax || 0;
            const invoiceSum = invoiceSubtotal + invoiceTax;

            // Proration factor
            const factor = invoiceSum > 0 ? (invoiceTotal / invoiceSum) : 1;

            let taxable = itemTaxable * factor;
            let tax = itemTax * factor;

            const isLast = (idx === sale.items.length - 1);
            if (isLast) {
                // Adjustment to match invoice totals exactly
                const targetSaleTaxable = invoiceTotal - invoiceTax;
                const targetSaleTax = invoiceTax;

                taxable = targetSaleTaxable - saleTaxableSum;
                tax = targetSaleTax - saleTaxSum;
            }

            taxable = Number(taxable.toFixed(2));
            tax = Number(tax.toFixed(2));

            saleTaxableSum += taxable;
            saleTaxSum += tax;

            let cgst = isInterstate ? 0 : tax / 2;
            let sgst = isInterstate ? 0 : tax / 2;
            let igst = isInterstate ? tax : 0;

            if (isLast) {
                if (isInterstate) {
                    igst = invoiceTax - saleIGSTSum;
                } else {
                    const targetCGST = sale.taxBreakup?.cgst || (invoiceTax / 2);
                    const targetSGST = sale.taxBreakup?.sgst || (invoiceTax / 2);
                    cgst = targetCGST - saleCGSTSum;
                    sgst = targetSGST - saleSGSTSum;
                }
            }

            cgst = Number(cgst.toFixed(2));
            sgst = Number(sgst.toFixed(2));
            igst = Number(igst.toFixed(2));

            saleCGSTSum += cgst;
            saleSGSTSum += sgst;
            saleIGSTSum += igst;

            const netAmount = Number((taxable + tax).toFixed(2));

            // Totals Accumulation
            totalTaxableValue += taxable;
            totalCGST += cgst;
            totalSGST += sgst;
            totalIGST += igst;
            totalGST += tax;
            grandTotal += netAmount;

            // Detailed item-wise record
            itemWiseDetails.push({
                invoice: invSummary.invoice,
                date: invSummary.date,
                customer: invSummary.customer,
                category,
                hsn,
                quantity: item.quantity,
                taxable,
                cgstRate: isInterstate ? 0 : rate / 2,
                cgstAmount: cgst,
                sgstIgstRate: isInterstate ? rate : rate / 2,
                sgstIgstAmount: isInterstate ? igst : sgst,
                netAmount
            });

            // HSN Summary aggregation
            if (!hsnSummary[hsn]) {
                hsnSummary[hsn] = { hsnCode: hsn, qty: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, invoiceValue: 0 };
            }
            hsnSummary[hsn].qty += item.quantity;
            hsnSummary[hsn].taxable += taxable;
            hsnSummary[hsn].cgst += cgst;
            hsnSummary[hsn].sgst += sgst;
            hsnSummary[hsn].igst += igst;
            hsnSummary[hsn].totalTax += tax;
            hsnSummary[hsn].invoiceValue += netAmount;

            // Slab Summary aggregation
            const slabKey = `${rate}%`;
            if (!slabSummary[slabKey]) {
                slabSummary[slabKey] = { slab: slabKey, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, invoiceValue: 0 };
            }
            slabSummary[slabKey].taxable += taxable;
            slabSummary[slabKey].cgst += cgst;
            slabSummary[slabKey].sgst += sgst;
            slabSummary[slabKey].igst += igst;
            slabSummary[slabKey].totalTax += tax;
            slabSummary[slabKey].invoiceValue += netAmount;
        });
    });

    // Derive totalGST from already-rounded components to avoid float rounding drift
    // (e.g. summing tax/2 + tax/2 for many items can differ from summing raw tax)
    const _rCGST = Number(totalCGST.toFixed(2));
    const _rSGST = Number(totalSGST.toFixed(2));
    const _rIGST = Number(totalIGST.toFixed(2));

    const finalSummary = {
        totalTaxableValue: Number(totalTaxableValue.toFixed(2)),
        totalCGST: _rCGST,
        totalSGST: _rSGST,
        totalIGST: _rIGST,
        totalGST: Number((_rCGST + _rSGST + _rIGST).toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        totalB2B: b2bInvoices.length,
        totalB2C: b2cInvoices.length
    };

    return {
        summary: finalSummary,
        b2b: b2bInvoices,
        b2c: b2cInvoices,
        hsnSummary: Object.values(hsnSummary)
            .sort((a, b) => a.hsnCode.localeCompare(b.hsnCode))
            .map(h => {
                const rCgst = Number(h.cgst.toFixed(2));
                const rSgst = Number(h.sgst.toFixed(2));
                const rIgst = Number(h.igst.toFixed(2));
                return {
                    hsnCode: h.hsnCode,
                    qty: h.qty,
                    taxable: Number(h.taxable.toFixed(2)),
                    cgst: rCgst,
                    sgst: rSgst,
                    igst: rIgst,
                    totalTax: Number((rCgst + rSgst + rIgst).toFixed(2)),
                    invoiceValue: Number(h.invoiceValue.toFixed(2))
                };
            }),
        slabSummary: Object.values(slabSummary)
            .sort((a, b) => parseFloat(a.slab) - parseFloat(b.slab))
            .map(s => {
                const rCgst = Number(s.cgst.toFixed(2));
                const rSgst = Number(s.sgst.toFixed(2));
                const rIgst = Number(s.igst.toFixed(2));
                return {
                    slab: s.slab,
                    taxable: Number(s.taxable.toFixed(2)),
                    cgst: rCgst,
                    sgst: rSgst,
                    igst: rIgst,
                    totalTax: Number((rCgst + rSgst + rIgst).toFixed(2)),
                    invoiceValue: Number(s.invoiceValue.toFixed(2))
                };
            }),
        itemWise: itemWiseDetails
    };
};

/**
 * IN-TRANSIT STOCK MONITOR
 */
const getInTransitReport = async () => {
    const Dispatch = require('../../models/dispatch.model');
    const transits = await Dispatch.find({ status: 'PENDING' })
        .populate('sourceWarehouseId', 'name')
        .populate('destinationStoreId', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });

    return transits.map(t => ({
        dispatchNumber: t.dispatchNumber,
        source: t.sourceWarehouseId?.name,
        destination: t.destinationStoreId?.name,
        itemsCount: t.items?.reduce((acc, i) => acc + i.qty, 0) || 0,
        estimatedValue: t.totalAmount || 0,
        dispatchedAt: t.dispatchedAt || t.createdAt,
        vehicle: t.vehicleNumber,
        driver: t.driverName,
        reference: t.referenceNumber
    }));
};

/**
 * Consolidated Sales Report
 */
const getSalesReport = async (startDate, endDate, storeId, filters = {}) => {
    const match = { isDeleted: false };
    if (startDate || endDate) {
        match.saleDate = {};
        if (startDate) match.saleDate.$gte = new Date(startDate);
        if (endDate) match.saleDate.$lte = new Date(endDate);
    }
    if (storeId && storeId !== 'all') match.storeId = new (require('mongoose').Types.ObjectId)(storeId);
    if (filters.warehouseId && filters.warehouseId !== 'all') match.storeId = new (require('mongoose').Types.ObjectId)(filters.warehouseId);
    if (filters.customerId && filters.customerId !== 'all') match.customerId = new (require('mongoose').Types.ObjectId)(filters.customerId);
    if (filters.salesmanId && filters.salesmanId !== 'all') match.cashierId = new (require('mongoose').Types.ObjectId)(filters.salesmanId);

    const salesByDate = await Sale.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
                totalRevenue: { $sum: "$grandTotal" },
                totalSales: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const itemWiseSales = await Sale.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.itemId",
                totalQty: { $sum: "$items.quantity" },
                totalRevenue: { $sum: "$items.total" }
            }
        },
        {
            $lookup: {
                from: "items",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $project: {
                name: "$product.name",
                sku: "$product.sku",
                totalQty: 1,
                totalRevenue: 1
            }
        },
        { $sort: { totalQty: -1 } }
    ]);

    return { salesByDate, itemWiseSales };
};

/**
 * Consolidated Stock Report
 */
const getStockReport = async () => {
    const storeStock = await StoreInventory.aggregate([
        {
            $group: {
                _id: "$productId",
                qty: { $sum: "$quantityAvailable" },
                locations: { $push: { storeId: "$storeId", qty: "$quantityAvailable" } }
            }
        },
        {
            $lookup: {
                from: "items",
                localField: "itemId",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $project: {
                name: "$product.name",
                sku: "$product.sku",
                minStockLevel: "$product.minStockLevel",
                totalQty: "$qty",
                isLowStock: { $lte: ["$qty", { $ifNull: ["$product.minStockLevel", 10] }] }
            }
        }
    ]);

    const warehouseStock = await WarehouseInventory.aggregate([
        {
            $group: {
                _id: "$productId",
                qty: { $sum: "$quantity" }
            }
        },
        {
            $lookup: {
                from: "items",
                localField: "itemId",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $project: {
                name: "$product.name",
                sku: "$product.sku",
                totalQty: "$qty"
            }
        }
    ]);

    const lowStockAlerts = storeStock.filter(s => s.isLowStock);

    return { storeStock, warehouseStock, lowStockAlerts };
};

/**
 * Movement Report
 */
const getMovementReport = async (startDate, endDate, variantId, storeId) => {
    const match = {};
    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            match.createdAt.$lte = end;
        }
    }
    if (variantId) match.variantId = new mongoose.Types.ObjectId(variantId);
    
    if (storeId) {
        const oid = new mongoose.Types.ObjectId(storeId);
        match.$or = [
            { fromLocation: oid },
            { toLocation: oid }
        ];
    }

    return await require('../../models/stockMovement.model').aggregate([
        { $match: match },
        {
            $lookup: {
                from: "items",
                let: { vId: "$variantId" },
                pipeline: [
                    { $match: { $expr: { $or: [
                        { $eq: ["$_id", "$$vId"] },
                        { $in: ["$$vId", { $ifNull: ["$sizes._id", []] }] }
                    ] } } }
                ],
                as: "itemDoc"
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "variantId",
                foreignField: "_id",
                as: "productDoc"
            }
        },
        { $unwind: { path: "$itemDoc", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$productDoc", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                variantInfo: {
                    $cond: {
                        if: { $eq: ["$itemDoc._id", "$variantId"] },
                        then: { 
                            sku: "$itemDoc.itemCode", 
                            size: "$itemDoc.accessorySize", 
                            color: "$itemDoc.shadeNo", 
                            purchasePrice: "$itemDoc.purchasePrice" 
                        },
                        else: {
                            $arrayElemAt: [
                                {
                                    $filter: {
                                        input: { $ifNull: ["$itemDoc.sizes", []] },
                                        as: "sz",
                                        cond: { $eq: ["$$sz._id", "$variantId"] }
                                    }
                                },
                                0
                            ]
                        }
                    }
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "performedBy",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "stores",
                localField: "toLocation",
                foreignField: "_id",
                as: "toLoc"
            }
        },
        {
            $lookup: {
                from: "warehouses",
                localField: "toLocation",
                foreignField: "_id",
                as: "toWh"
            }
        },
        {
            $project: {
                date: "$createdAt",
                type: 1,
                referenceId: 1,
                referenceType: 1,
                qty: 1,
                barcode: 1,
                itemName: { 
                    $ifNull: [
                        "$itemDoc.itemName", 
                        "$productDoc.name",
                        "Unknown Item"
                    ] 
                },
                productName: { 
                    $ifNull: [
                        "$itemDoc.itemName", 
                        "$productDoc.name",
                        "Unknown Item"
                    ] 
                },
                sku: { $ifNull: ["$variantInfo.sku", "$productDoc.sku", "-"] },
                size: { $ifNull: ["$variantInfo.size", "$productDoc.size", "-"] },
                color: { $ifNull: ["$variantInfo.color", "$productDoc.color", "-"] },
                purchaseRate: { $ifNull: ["$variantInfo.purchasePrice", "$productDoc.costPrice", 0] },
                totalValue: { 
                    $multiply: [
                        { $abs: "$qty" }, 
                        { $ifNull: ["$variantInfo.purchasePrice", "$productDoc.costPrice", 0] }
                    ] 
                },
                type: { $cond: [{ $gt: ["$qty", 0] }, "IN", "OUT"] },
                sourceType: "$type",
                fromLocation: 1,
                toLocation: 1,
                locationName: { 
                    $ifNull: [
                        { $arrayElemAt: ["$toLoc.name", 0] },
                        { $arrayElemAt: ["$toWh.name", 0] },
                        "Main Inventory"
                    ]
                },
                warehouseId: { $ifNull: ["$fromLocation", "$toLocation"] },
                reference: "$referenceType",
                performedBy: "$user.name",
                user: "$user.name"
            }
        },
        { $sort: { date: -1 } }
    ]);
};

/**
 * STOCK AGING REPORT
 */
const getStockAgingReport = async () => {
    return await Product.aggregate([
        { $match: { isDeleted: false, isActive: true } },
        {
            $project: {
                name: 1,
                sku: 1,
                currentStock: { $add: ["$factoryStock", 0] },
                createdAt: 1,
                daysInStock: {
                    $floor: {
                        $divide: [
                            { $subtract: [new Date(), "$createdAt"] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            }
        },
        {
            $project: {
                name: 1,
                sku: 1,
                currentStock: 1,
                daysInStock: 1,
                category: {
                    $cond: [
                        { $gte: ["$daysInStock", 90] }, "SLOW_MOVING",
                        { $cond: [{ $gte: ["$daysInStock", 30] }, "NORMAL", "FAST_MOVING"] }
                    ]
                }
            }
        },
        { $sort: { daysInStock: -1 } }
    ]);
};

/**
 * PROFIT REPORT
 */
const getProfitReport = async (startDate, endDate) => {
    const match = { isDeleted: false };
    if (startDate || endDate) {
        match.saleDate = {};
        if (startDate) match.saleDate.$gte = new Date(startDate);
        if (endDate) match.saleDate.$lte = new Date(endDate);
    }

    return await Sale.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "items",
                localField: "items.itemId",
                foreignField: "_id",
                as: "productData"
            }
        },
        { $unwind: "$productData" },
        {
            $group: {
                _id: { 
                    productId: "$items.itemId", 
                    variantId: "$items.variantId" 
                },
                itemName: { $first: "$productData.itemName" },
                itemCode: { $first: "$productData.itemCode" },
                variantName: { $first: "$items.variantId" }, // Or map from productData.sizes
                qtySold: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.total" },
                totalCost: { $sum: { $multiply: ["$items.quantity", { $ifNull: ["$productData.purchasePrice", 0] }] } }
            }
        },
        {
            $project: {
                name: "$itemName",
                sku: "$itemCode",
                variant: "$variantName",
                qtySold: 1,
                revenue: 1,
                totalCost: 1,
                profit: { $subtract: ["$revenue", "$totalCost"] },
                margin: {
                    $cond: [
                        { $eq: ["$revenue", 0] },
                        0,
                        { $multiply: [{ $divide: [{ $subtract: ["$revenue", "$totalCost"] }, "$revenue"] }, 100] }
                    ]
                }
            }
        },
        { $sort: { profit: -1 } }
    ]);
};

/**
 * SALE CHALLAN REPORT
 */
const getSaleChallanReport = async (startDate, endDate, storeId) => {
    const DeliveryChallan = require('../../models/deliveryChallan.model');
    const match = {};
    if (startDate || endDate) {
        match.dcDate = {};
        if (startDate) match.dcDate.$gte = new Date(startDate);
        if (endDate) match.dcDate.$lte = new Date(endDate);
    }
    if (storeId) match.storeId = new (require('mongoose').Types.ObjectId)(storeId);

    return await DeliveryChallan.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: { $reduce: { input: "$items", initialValue: 0, in: { $add: ["$$value", { $multiply: ["$$this.quantity", "$$this.price"] }] } } } }
            }
        },
        { $project: { status: '$_id', count: 1, totalAmount: 1 } }
    ]);
};

/**
 * SCHEME REPORT
 */
const getSchemeReport = async (startDate, endDate) => {
    const Scheme = require('../../models/scheme.model');
    return await Scheme.find({ isActive: true }).select('name type value startDate endDate');
};

/**
 * ORDER REPORT
 */
const getOrderReport = async (startDate, endDate) => {
    const SaleOrder = require('../../models/saleOrder.model');
    const PurchaseOrder = require('../../models/purchaseOrder.model');
    
    const match = {};
    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const saleOrders = await SaleOrder.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } }
    ]);

    const purchaseOrders = await PurchaseOrder.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } }
    ]);

    return { saleOrders, purchaseOrders };
};

/**
 * AGENT WISE REPORT
 */
const getAgentWiseReport = async (startDate, endDate) => {
    const match = { isDeleted: false };
    if (startDate || endDate) {
        match.saleDate = {};
        if (startDate) match.saleDate.$gte = new Date(startDate);
        if (endDate) match.saleDate.$lte = new Date(endDate);
    }

    return await Sale.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$cashierId', 
                totalSales: { $sum: '$grandTotal' },
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'agent'
            }
        },
        { $unwind: '$agent' },
        {
            $project: {
                agentName: '$agent.name',
                totalSales: 1,
                count: 1
            }
        },
        { $sort: { totalSales: -1 } }
    ]);
};

/**
 * Custom Consolidated Branch Sales & Stock Report
 */
const getBranchSalesStockReport = async (startDate, endDate, storeId) => {
    console.log('[BranchSalesStockReport] Params:', { startDate, endDate, storeId });

    let targetStoreIds = null;
    if (storeId && storeId !== 'all') {
        try {
            const parsedIds = String(storeId).split(',')
                .map(id => id.trim())
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
            if (parsedIds.length > 0) {
                targetStoreIds = parsedIds;
            }
        } catch (e) {
            console.error('[BranchSalesStockReport] Error parsing storeId:', e);
        }
    }

    const storeQuery = {};
    if (targetStoreIds) {
        storeQuery.storeId = { $in: targetStoreIds };
    }

    console.log('[BranchSalesStockReport] storeQuery:', storeQuery);

    const storeInventory = await StoreInventory.find(storeQuery)
        .populate('storeId', 'name')
        .populate({
            path: 'itemId',
            populate: [
                { path: 'brand', select: 'name brandName' },
                { path: 'categoryId', select: 'name' },
                { path: 'subCategoryId', select: 'name' }
            ]
        })
        .lean();

    console.log('[BranchSalesStockReport] StoreInventory records found:', storeInventory.length);

    // 1. Fetch Sales
    const salesQuery = { isDeleted: false };
    if (targetStoreIds) {
        salesQuery.storeId = { $in: targetStoreIds };
    }
    if (startDate || endDate) {
        salesQuery.saleDate = {};
        if (startDate) salesQuery.saleDate.$gte = new Date(startDate);
        if (endDate) salesQuery.saleDate.$lte = new Date(endDate);
    }
    const sales = await Sale.find(salesQuery).lean();

    // 2. Fetch Customer Returns
    const Return = mongoose.models.Return || require('../../models/return.model');
    const retQuery = { status: 'APPROVED' };
    if (targetStoreIds) {
        retQuery.locationId = { $in: targetStoreIds };
    }
    if (startDate || endDate) {
        retQuery.createdAt = {};
        if (startDate) retQuery.createdAt.$gte = new Date(startDate);
        if (endDate) retQuery.createdAt.$lte = new Date(endDate);
    }
    const customerReturns = await Return.find(retQuery).lean();

    // 3. Fetch Purchase Returns
    const PurchaseReturn = mongoose.models.PurchaseReturn || require('../../models/purchaseReturn.model');
    const prQuery = { status: 'COMPLETED' };
    if (targetStoreIds) {
        prQuery.locationId = { $in: targetStoreIds };
    }
    if (startDate || endDate) {
        prQuery.createdAt = {};
        if (startDate) prQuery.createdAt.$gte = new Date(startDate);
        if (endDate) prQuery.createdAt.$lte = new Date(endDate);
    }
    const purchaseReturns = await PurchaseReturn.find(prQuery).lean();

    // Initialize temporary mapping fields for storeInventory records
    const inventoryMap = {};
    storeInventory.forEach(inv => {
        inv.netSaleAttr = 0;
        inv.custReturnAttr = 0;
        inv.purReturnAttr = 0;
        inventoryMap[inv._id.toString()] = inv;
    });

    // Group sales items by storeId_itemId_variantId to allow fallback matching
    const salesGroup = {};
    sales.forEach(s => {
        s.items.forEach(item => {
            const grpKey = `${s.storeId}_${item.itemId}_${item.variantId}`;
            if (!salesGroup[grpKey]) {
                salesGroup[grpKey] = [];
            }
            salesGroup[grpKey].push({
                barcode: item.barcode,
                quantity: item.quantity,
                remainingQty: item.quantity
            });
        });
    });

    // Pre-select fallback receiver for general group keys (storeId_itemId_variantId)
    // to handle duplicate inventory records correctly (e.g. item code vs variant barcode)
    const fallbackReceiverMap = {};
    const groupInvRecords = {};
    storeInventory.forEach(inv => {
        const storeIdStr = inv.storeId?._id?.toString() || inv.storeId?.toString();
        const itemIdStr = inv.itemId?._id?.toString() || inv.itemId?.toString();
        const grpKey = `${storeIdStr}_${itemIdStr}_${inv.variantId}`;
        if (!groupInvRecords[grpKey]) {
            groupInvRecords[grpKey] = [];
        }
        groupInvRecords[grpKey].push(inv);
    });

    Object.entries(groupInvRecords).forEach(([grpKey, list]) => {
        // Choose the best fallback receiver: prefer the record with generic barcode (e.g. no hyphen)
        const best = list.find(inv => !inv.barcode.includes('-')) || list[0];
        fallbackReceiverMap[grpKey] = best._id.toString();
    });

    // Sales Pass 1: Exact barcode match
    storeInventory.forEach(inv => {
        const storeIdStr = inv.storeId?._id?.toString() || inv.storeId?.toString();
        const itemIdStr = inv.itemId?._id?.toString() || inv.itemId?.toString();
        const grpKey = `${storeIdStr}_${itemIdStr}_${inv.variantId}`;
        const group = salesGroup[grpKey];
        if (group) {
            const exactMatch = group.find(item => item.barcode === inv.barcode && item.remainingQty > 0);
            if (exactMatch) {
                inv.netSaleAttr += exactMatch.remainingQty;
                exactMatch.remainingQty = 0;
            }
        }
    });

    // Sales Pass 2: Fallback (attribute remaining sale quantities to the fallback receiver)
    storeInventory.forEach(inv => {
        const storeIdStr = inv.storeId?._id?.toString() || inv.storeId?.toString();
        const itemIdStr = inv.itemId?._id?.toString() || inv.itemId?.toString();
        const grpKey = `${storeIdStr}_${itemIdStr}_${inv.variantId}`;
        const group = salesGroup[grpKey];
        if (group && fallbackReceiverMap[grpKey] === inv._id.toString()) {
            const remainingQty = group.reduce((acc, item) => acc + item.remainingQty, 0);
            if (remainingQty > 0) {
                inv.netSaleAttr += remainingQty;
                group.forEach(item => item.remainingQty = 0);
            }
        }
    });

    // Group customer returns items by locationId_variantId
    const returnsGroup = {};
    customerReturns.forEach(ret => {
        ret.items.forEach(item => {
            const grpKey = `${ret.locationId}_${item.variantId}`;
            if (!returnsGroup[grpKey]) {
                returnsGroup[grpKey] = [];
            }
            returnsGroup[grpKey].push({
                quantity: item.quantity,
                remainingQty: item.quantity
            });
        });
    });

    // Pre-select fallback receiver for return group keys (storeId_variantId)
    const retFallbackReceiverMap = {};
    const retGroupInvRecords = {};
    storeInventory.forEach(inv => {
        const storeIdStr = inv.storeId?._id?.toString() || inv.storeId?.toString();
        const grpKey = `${storeIdStr}_${inv.variantId}`;
        if (!retGroupInvRecords[grpKey]) {
            retGroupInvRecords[grpKey] = [];
        }
        retGroupInvRecords[grpKey].push(inv);
    });

    Object.entries(retGroupInvRecords).forEach(([grpKey, list]) => {
        const best = list.find(inv => !inv.barcode.includes('-')) || list[0];
        retFallbackReceiverMap[grpKey] = best._id.toString();
    });

    // Attribute customer returns to fallback receiver to prevent double counting
    storeInventory.forEach(inv => {
        const storeIdStr = inv.storeId?._id?.toString() || inv.storeId?.toString();
        const grpKey = `${storeIdStr}_${inv.variantId}`;
        const group = returnsGroup[grpKey];
        if (group && retFallbackReceiverMap[grpKey] === inv._id.toString()) {
            const remainingQty = group.reduce((acc, item) => acc + item.remainingQty, 0);
            if (remainingQty > 0) {
                inv.custReturnAttr += remainingQty;
                group.forEach(item => item.remainingQty = 0);
            }
        }
    });

    // Group purchase returns items by storeId_itemId_variantId
    const prGroup = {};
    purchaseReturns.forEach(pr => {
        pr.items.forEach(item => {
            const grpKey = `${pr.locationId}_${item.productId}_${item.variantId}`;
            if (!prGroup[grpKey]) {
                prGroup[grpKey] = [];
            }
            prGroup[grpKey].push({
                quantity: item.quantity,
                remainingQty: item.quantity
            });
        });
    });

    // Attribute purchase returns to fallback receiver
    storeInventory.forEach(inv => {
        const storeIdStr = inv.storeId?._id?.toString() || inv.storeId?.toString();
        const itemIdStr = inv.itemId?._id?.toString() || inv.itemId?.toString();
        const grpKey = `${storeIdStr}_${itemIdStr}_${inv.variantId}`;
        const group = prGroup[grpKey];
        if (group && fallbackReceiverMap[grpKey] === inv._id.toString()) {
            const remainingQty = group.reduce((acc, item) => acc + item.remainingQty, 0);
            if (remainingQty > 0) {
                inv.purReturnAttr += remainingQty;
                group.forEach(item => item.remainingQty = 0);
            }
        }
    });

    // 4. Construct rows with exactly 16 columns matching requested spec with 'NIL' fallbacks
    const rows = storeInventory.map((inv, index) => {
        if (!inv.itemId) return null;

        const branchName = inv.storeId?.name || 'NIL';
        const itemName = inv.itemId.itemName || 'NIL';
        const itemCode = inv.itemId.itemCode || 'NIL';

        // Retrieve variant info from itemId.sizes array
        const variant = inv.itemId.sizes?.find(s => s._id.toString() === inv.variantId || s.barcode === inv.barcode || s.sku === inv.barcode);
        const shadeName = variant?.color || inv.itemId.shadeNo || inv.itemId.color || 'NIL';
        const description = inv.itemId.itemName || inv.itemId.name || 'NIL';
        const packSize = variant?.size || inv.itemId.accessorySize || inv.itemId.packingType || 'NIL';
        const subSection = inv.itemId.categoryName || inv.itemId.categoryId?.name || 'NIL';
        const type = inv.itemId.type || 'NIL';
        const design = inv.itemId.pattern || 'NIL';
        const fabric = inv.itemId.fabric || 'NIL';
        const fabricType = inv.itemId.composition || 'NIL';
        const vendor = inv.itemId.brand?.brandName || inv.itemId.brand?.name || 'NIL';

        // Net Sale & Purchase Return from attributed quantities
        const netSale = inv.netSaleAttr - inv.custReturnAttr;
        const prQty = inv.purReturnAttr;

        // Closing Stock
        const closingStock = (typeof inv.quantityAvailable === 'number') ? inv.quantityAvailable : (inv.quantity || 0);

        // Helper to format values as 'NIL' if falsy/empty/N/A
        const formatVal = (val) => {
            if (val === null || val === undefined || val === '' || val === '""' || String(val).trim().toUpperCase() === 'N/A' || String(val).trim().toUpperCase() === 'NIL') {
                return 'NIL';
            }
            return val;
        };

        return {
            sno: index + 1,
            branchName: formatVal(branchName),
            itemName: formatVal(itemName),
            itemCode: formatVal(itemCode),
            shadeName: formatVal(shadeName),
            itemDescription: formatVal(description),
            packSize: formatVal(packSize),
            subSection: formatVal(subSection),
            type: formatVal(type),
            design: formatVal(design),
            fabric: formatVal(fabric),
            fabricType: formatVal(fabricType),
            vendor: formatVal(vendor),
            netSale: netSale || 0,
            purReturn: prQty || 0,
            closingStock: closingStock || 0
        };
    }).filter(Boolean);

    return rows;
};

module.exports = {
    getDailySalesReport,
    getMonthlySalesReport,
    getStoreWiseSales,
    getProductWiseSales,
    getFabricConsumption,
    getLowStockReport,
    getInventoryExport,
    getReturnSummary,
    getLedgerReport,
    getTrialBalance,
    getProfitAndLoss,
    getBalanceSheet,
    getStockHistory,
    getAuditLogs,
    getGstSummary,
    getPurchaseRegister,
    getSalesReport,
    getStockReport,
    getMovementReport,
    getStockAgingReport,
    getProfitReport,
    getSaleChallanReport,
    getSchemeReport,
    getOrderReport,
    getAgentWiseReport,
    getInTransitReport,
    getDetailedGstReport,
    getBranchSalesStockReport
};
