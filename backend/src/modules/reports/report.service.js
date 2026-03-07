const Sale = require('../../models/sale.model');
const Product = require('../../models/product.model');
const StoreInventory = require('../../models/storeInventory.model');
const ProductionBatch = require('../../models/productionBatch.model');
const Return = require('../../models/return.model');
const Account = require('../../models/account.model');
const Ledger = require('../../models/ledger.model');
const Purchase = require('../../models/purchase.model');

/**
 * Daily Sales Report
 */
const getDailySalesReport = async (date) => {
    const start = new Date(date || Date.now());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    return await Sale.aggregate([
        { $match: { saleDate: { $gte: start, $lte: end }, isDeleted: false } },
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
const getMonthlySalesReport = async (month, year) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    return await Sale.aggregate([
        { $match: { saleDate: { $gte: start, $lte: end }, isDeleted: false } },
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
const getProductWiseSales = async (startDate, endDate) => {
    const query = { isDeleted: false };
    if (startDate || endDate) {
        query.saleDate = {};
        if (startDate) query.saleDate.$gte = new Date(startDate);
        if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    return await Sale.aggregate([
        { $match: query },
        { $unwind: '$products' },
        {
            $group: {
                _id: '$products.productId',
                totalSold: { $sum: '$products.quantity' },
                revenue: { $sum: '$products.total' }
            }
        },
        {
            $lookup: {
                from: 'products',
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
const getLowStockReport = async () => {
    const factoryLow = await Product.find({
        $expr: { $lte: ['$factoryStock', '$minStockLevel'] },
        isDeleted: false
    }).select('name sku factoryStock minStockLevel');

    const storeLow = await StoreInventory.find({
        $expr: { $lte: ['$quantityAvailable', '$minStockLevel'] }
    }).populate('storeId', 'name').populate('productId', 'name sku');

    return { factoryLow, storeLow };
};

/**
 * Return Summary Report
 */
const getReturnSummary = async () => {
    return await Return.aggregate([
        { $match: { isDeleted: false } },
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
            runningBalance
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

    return { trialBalance, totalDebitSum, totalCreditSum };
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

    return { income, expense, totalIncome, totalExpense, netProfit: totalIncome - totalExpense };
};

/**
 * Balance Sheet
 */
const getBalanceSheet = async (asOfDate) => {
    const filterDate = asOfDate ? new Date(asOfDate) : new Date();

    // 1. Get Profit & Loss up to this date to calculate retained earnings if needed
    // In this simplified ERP, we'll just sum all INCOME/EXPENSE as part of equity or net profit
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

    const balanceSheet = { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };

    // Balance Check
    if (Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 0.1) {
        console.warn('Balance Sheet Error: Assets do not equal Liabilities + Equity');
    }

    return balanceSheet;
};

/**
 * Stock History Report
 */
const getStockHistory = async (query = {}) => {
    const { productId, type, storeId } = query;
    const filter = {};
    if (productId) filter.productId = productId;
    if (type) filter.type = type;
    if (storeId) filter.storeId = storeId;

    return await require('../../models/stockHistory.model').find(filter)
        .sort({ createdAt: -1 })
        .populate('productId', 'name sku')
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
const getPurchaseRegister = async (supplierId, startDate, endDate) => {
    const query = { status: 'COMPLETED' };

    if (supplierId) query.supplierId = supplierId;

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
const getGstSummary = async (startDate, endDate) => {
    const saleQuery = { isDeleted: false, status: 'COMPLETED' };
    const purchaseQuery = { status: 'COMPLETED' };

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
                taxableValue: { $sum: { $subtract: ["$grandTotal", "$totalTax"] } }, // Approximate if grandTotal is tax inclusive
                cgst: { $sum: "$taxBreakup.cgst" },
                sgst: { $sum: "$taxBreakup.sgst" },
                igst: { $sum: "$taxBreakup.igst" },
                totalTax: { $sum: "$totalTax" }
            }
        }
    ]);

    const purchaseGst = await Purchase.aggregate([
        { $match: purchaseQuery },
        {
            $group: {
                _id: null,
                taxableValue: { $sum: "$subTotal" },
                cgst: { $sum: { $divide: ["$totalTax", 2] } }, // Assuming 50/50 split if igst not tracked separately in purchase model
                sgst: { $sum: { $divide: ["$totalTax", 2] } },
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

module.exports = {
    getDailySalesReport,
    getMonthlySalesReport,
    getStoreWiseSales,
    getProductWiseSales,
    getFabricConsumption,
    getLowStockReport,
    getReturnSummary,
    getLedgerReport,
    getTrialBalance,
    getProfitAndLoss,
    getBalanceSheet,
    getStockHistory,
    getAuditLogs,
    getGstSummary,
    getPurchaseRegister
};
