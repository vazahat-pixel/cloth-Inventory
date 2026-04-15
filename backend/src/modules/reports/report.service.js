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
            $expr: { $lte: ['$factoryStock', '$minStockLevel'] },
            isDeleted: false
        }).select('name sku factoryStock minStockLevel');
        
        const storeLow = await StoreInventory.find({
            $expr: { $lte: ['$quantityAvailable', '$minStockLevel'] }
        }).populate('storeId', 'name').populate('itemId', 'name sku');
        
        return { factoryLow, storeLow };
    }

    const storeLow = await StoreInventory.find({
        storeId,
        $expr: { $lte: ['$quantityAvailable', '$minStockLevel'] }
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
    const rateSummary = {};
    const b2bInvoices = [];
    const b2cInvoices = [];
    const itemWiseDetails = [];

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

        sale.items.forEach(item => {
            const hsn = item.itemId?.hsCodeId?.code || 'N/A';
            const rate = item.taxPercentage || 0;
            const taxable = item.rate * item.quantity;
            const tax = item.taxAmount || 0;

            // Item-wise tracking
            itemWiseDetails.push({
                invoice: invSummary.invoice,
                date: invSummary.date,
                itemName: item.itemId?.itemName || 'Unknown',
                hsn,
                quantity: item.quantity,
                taxable: taxable,
                gstRate: rate,
                taxAmount: tax,
                customer: invSummary.customer
            });

            // HSN Summary
            if (!hsnSummary[hsn]) {
                hsnSummary[hsn] = { hsn, taxable: 0, igst: 0, cgst: 0, sgst: 0, totalTax: 0, qty: 0 };
            }
            hsnSummary[hsn].taxable += taxable;
            hsnSummary[hsn].qty += item.quantity;
            hsnSummary[hsn].totalTax += tax;
            if (invSummary.igst > 0) hsnSummary[hsn].igst += tax;
            else {
                hsnSummary[hsn].cgst += tax / 2;
                hsnSummary[hsn].sgst += tax / 2;
            }

            // Rate Summary
            const rateKey = `${rate}%`;
            if (!rateSummary[rateKey]) {
                rateSummary[rateKey] = { rate: rateKey, taxable: 0, igst: 0, cgst: 0, sgst: 0, totalTax: 0 };
            }
            rateSummary[rateKey].taxable += taxable;
            rateSummary[rateKey].totalTax += tax;
            if (invSummary.igst > 0) rateSummary[rateKey].igst += tax;
            else {
                rateSummary[rateKey].cgst += tax / 2;
                rateSummary[rateKey].sgst += tax / 2;
            }
        });
    });

    return {
        summary: {
            totalB2B: b2bInvoices.length,
            totalB2C: b2cInvoices.length,
            totalTaxable: Object.values(rateSummary).reduce((a, b) => a + b.taxable, 0),
            totalTax: Object.values(rateSummary).reduce((a, b) => a + b.totalTax, 0)
        },
        b2b: b2bInvoices,
        b2c: b2cInvoices,
        hsnSummary: Object.values(hsnSummary),
        rateSummary: Object.values(rateSummary),
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
    if (variantId) match.variantId = new (require('mongoose').Types.ObjectId)(variantId);
    
    if (storeId) {
        const oid = new (require('mongoose').Types.ObjectId)(storeId);
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
                localField: "variantId",
                foreignField: "sizes._id",
                as: "itemDoc"
            }
        },
        { $unwind: { path: "$itemDoc", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                matchedVariant: {
                    $filter: {
                        input: "$itemDoc.sizes",
                        as: "sz",
                        cond: { $eq: ["$$sz._id", "$variantId"] }
                    }
                }
            }
        },
        {
            $addFields: {
                variantInfo: { $arrayElemAt: ["$matchedVariant", 0] }
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
                itemName: { $ifNull: ["$itemDoc.itemName", "Unknown Item"] },
                productName: { $ifNull: ["$itemDoc.itemName", "Unknown Item"] },
                sku: { $ifNull: ["$variantInfo.sku", "$itemDoc.itemCode", "-"] },
                styleCode: { $ifNull: ["$itemDoc.itemCode", "-"] },
                size: { $ifNull: ["$variantInfo.size", "$itemDoc.accessorySize", "-"] },
                color: { $ifNull: ["$variantInfo.color", "$itemDoc.shadeNo", "-"] },
                qty: { $abs: "$qty" },
                quantityChange: "$qty",
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
    getDetailedGstReport
};
