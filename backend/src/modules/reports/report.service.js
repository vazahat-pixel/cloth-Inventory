const Sale = require('../../models/sale.model');
const Product = require('../../models/product.model');
const StoreInventory = require('../../models/storeInventory.model');
const ProductionBatch = require('../../models/productionBatch.model');
const Return = require('../../models/return.model');
const Account = require('../../models/account.model');
const Ledger = require('../../models/ledger.model');
const Purchase = require('../../models/purchase.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');

/**
 * Daily Sales Report
 */
const getDailySalesReport = async (date, storeId) => {
    const start = new Date(date || Date.now());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const match = { saleDate: { $gte: start, $lte: end }, isDeleted: false };
    if (storeId) match.storeId = new require('mongoose').Types.ObjectId(storeId);

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
    if (storeId) match.storeId = new require('mongoose').Types.ObjectId(storeId);

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
    if (storeId) query.storeId = new require('mongoose').Types.ObjectId(storeId);

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
const getLowStockReport = async (storeId) => {
    const productQuery = { isDeleted: false };
    if (!storeId) {
        // Only return factory low stock if no specific store is requested
        const factoryLow = await Product.find({
            $expr: { $lte: ['$factoryStock', '$minStockLevel'] },
            isDeleted: false
        }).select('name sku factoryStock minStockLevel');
        
        const storeLow = await StoreInventory.find({
            $expr: { $lte: ['$quantityAvailable', '$minStockLevel'] }
        }).populate('storeId', 'name').populate('productId', 'name sku');
        
        return { factoryLow, storeLow };
    }

    const storeLow = await StoreInventory.find({
        storeId,
        $expr: { $lte: ['$quantityAvailable', '$minStockLevel'] }
    }).populate('storeId', 'name').populate('productId', 'name sku');

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
        .populate('productId', 'name sku barcode size color category brand');

    // 2. Store inventory
    const storeQuery = {};
    if (storeId) storeQuery.storeId = storeId;
    const storeInventory = await StoreInventory.find(storeQuery)
        .populate('storeId', 'name')
        .populate('productId', 'name sku barcode size color category brand');

    const rows = [];

    warehouseInventory.forEach((inv) => {
        if (!inv.productId || !inv.warehouseId) return;
        rows.push({
            locationType: 'WAREHOUSE',
            locationName: inv.warehouseId.name,
            productName: inv.productId.name,
            sku: inv.productId.sku,
            barcode: inv.productId.barcode,
            size: inv.productId.size,
            color: inv.productId.color,
            category: inv.productId.category,
            brand: inv.productId.brand,
            quantity: inv.quantity,
            quantityAvailable: inv.quantity, // warehouse is always available
            minStockLevel: inv.minStockLevel || 0
        });
    });

    storeInventory.forEach((inv) => {
        if (!inv.productId || !inv.storeId) return;
        const available = typeof inv.quantityAvailable === 'number'
            ? inv.quantityAvailable
            : inv.quantity || 0;
        rows.push({
            locationType: 'STORE',
            locationName: inv.storeId.name,
            productName: inv.productId.name,
            sku: inv.productId.sku,
            barcode: inv.productId.barcode,
            size: inv.productId.size,
            color: inv.productId.color,
            category: inv.productId.category,
            brand: inv.productId.brand,
            quantity: inv.quantity,
            quantityAvailable: available,
            minStockLevel: inv.minStockLevel || 0
        });
    });

    return rows;
};

/**
 * Return Summary Report
 */
const getReturnSummary = async (storeId) => {
    const match = { isDeleted: false };
    if (storeId) match.storeId = new require('mongoose').Types.ObjectId(storeId);
    
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
const getPurchaseRegister = async (supplierId, startDate, endDate, storeId) => {
    const query = { status: 'COMPLETED' };

    if (supplierId) query.supplierId = supplierId;
    if (storeId) query.storeId = storeId; // Assuming Purchase model has storeId if relevant, else ignore

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
        const oid = new require('mongoose').Types.ObjectId(storeId);
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

/**
 * Consolidated Sales Report (Total by Date + Item-wise)
 */
const getSalesReport = async (startDate, endDate, storeId) => {
    const match = { isDeleted: false };
    if (startDate || endDate) {
        match.saleDate = {};
        if (startDate) match.saleDate.$gte = new Date(startDate);
        if (endDate) match.saleDate.$lte = new Date(endDate);
    }
    if (storeId) match.storeId = new (require('mongoose').Types.ObjectId)(storeId);

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
        { $unwind: "$products" },
        {
            $group: {
                _id: "$products.productId",
                totalQty: { $sum: "$products.quantity" },
                totalRevenue: { $sum: "$products.total" }
            }
        },
        {
            $lookup: {
                from: "products",
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
 * Consolidated Stock Report (Current Stock + Low Stock Alerts)
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
                from: "products",
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
                minStockLevel: "$product.minStockLevel",
                totalQty: "$qty",
                isLowStock: { $lte: ["$qty", "$product.minStockLevel"] }
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
                from: "products",
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
                totalQty: "$qty"
            }
        }
    ]);

    const lowStockAlerts = storeStock.filter(s => s.isLowStock);

    return { storeStock, warehouseStock, lowStockAlerts };
};

/**
 * Movement Report (History from StockMovement)
 */
const getMovementReport = async (startDate, endDate, variantId) => {
    const match = {};
    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    if (variantId) match.variantId = new (require('mongoose').Types.ObjectId)(variantId);

    return await require('../../models/stockMovement.model').aggregate([
        { $match: match },
        {
            $lookup: {
                from: "products",
                localField: "variantId",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
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
            $project: {
                date: "$createdAt",
                productName: "$product.name",
                sku: "$product.sku",
                qty: 1,
                type: 1,
                fromLocation: 1,
                toLocation: 1,
                performedBy: "$user.name"
            }
        },
        { $sort: { date: -1 } }
    ]);
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
    getMovementReport
};

