const reportService = require('./report.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const getDailySales = async (req, res, next) => {
    try {
        const { date } = req.query;
        const storeId = req.user.role === 'store_staff' ? req.user.shopId : req.query.storeId;
        const report = await reportService.getDailySalesReport(date, storeId);
        return sendSuccess(res, { report: report[0] || { totalRevenue: 0, totalSales: 0 } }, 'Daily sales report retrieved');
    } catch (err) {
        next(err);
    }
};

const getMonthlySales = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return sendError(res, 'Month and Year are required', 400);
        const storeId = req.user.role === 'store_staff' ? req.user.shopId : req.query.storeId;

        const report = await reportService.getMonthlySalesReport(parseInt(month), parseInt(year), storeId);
        return sendSuccess(res, { report }, 'Monthly sales report retrieved');
    } catch (err) {
        next(err);
    }
};

const getStoreWiseSales = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reportService.getStoreWiseSales(startDate, endDate);
        return sendSuccess(res, { report }, 'Store-wise sales report retrieved');
    } catch (err) {
        next(err);
    }
};

const getProductWiseSales = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const storeId = req.user.role === 'store_staff' ? req.user.shopId : req.query.storeId;
        const report = await reportService.getProductWiseSales(startDate, endDate, storeId);
        return sendSuccess(res, { report }, 'Product-wise sales report retrieved');
    } catch (err) {
        next(err);
    }
};

const getFabricConsumption = async (req, res, next) => {
    try {
        const report = await reportService.getFabricConsumption();
        return sendSuccess(res, { report }, 'Fabric consumption report retrieved');
    } catch (err) {
        next(err);
    }
};

const getLowStockReport = async (req, res, next) => {
    try {
        const storeId = req.user.role === 'store_staff' ? req.user.shopId : req.query.storeId;
        const report = await reportService.getLowStockReport(storeId);
        return sendSuccess(res, { report }, 'Low stock report retrieved');
    } catch (err) {
        next(err);
    }
};

const getReturnSummary = async (req, res, next) => {
    try {
        const storeId = req.user.role === 'store_staff' ? req.user.shopId : req.query.storeId;
        const report = await reportService.getReturnSummary(storeId);
        return sendSuccess(res, { report }, 'Return summary report retrieved');
    } catch (err) {
        next(err);
    }
};

const getStockHistory = async (req, res, next) => {
    try {
        const filters = { ...req.query };
        if (req.user.role === 'store_staff') {
            filters.storeId = req.user.shopId;
        }
        const history = await reportService.getStockHistory(filters);
        return sendSuccess(res, { history }, 'Stock history retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getAuditLogs = async (req, res, next) => {
    try {
        const logs = await reportService.getAuditLogs(req.query);
        return sendSuccess(res, { logs }, 'Audit logs retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getLedgerReport = async (req, res, next) => {
    try {
        const { accountId } = req.params;
        if (!accountId) return sendError(res, 'Account ID is required', 400);
        const report = await reportService.getLedgerReport(accountId);
        return sendSuccess(res, { report }, 'Ledger report retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getGstSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const storeId = req.user.role === 'store_staff' ? req.user.shopId : req.query.storeId;
        const report = await reportService.getGstSummary(startDate, endDate, storeId);
        return sendSuccess(res, { report }, 'GST summary report retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getPurchaseRegister = async (req, res, next) => {
    try {
        const { supplierId, startDate, endDate } = req.query;
        const storeId = req.user.role === 'store_staff' ? req.user.shopId : req.query.storeId;
        const report = await reportService.getPurchaseRegister(supplierId, startDate, endDate, storeId);
        return sendSuccess(res, { report: report[0] || { totalPurchase: 0, totalGST: 0, grandTotal: 0, count: 0 } }, 'Purchase register report retrieved');
    } catch (err) {
        next(err);
    }
};

const getTrialBalance = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reportService.getTrialBalance(startDate, endDate);
        return sendSuccess(res, { report }, 'Trial balance retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getProfitAndLoss = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reportService.getProfitAndLoss(startDate, endDate);
        return sendSuccess(res, { report }, 'Profit & Loss statement retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getBalanceSheet = async (req, res, next) => {
    try {
        const { asOfDate } = req.query;
        const report = await reportService.getBalanceSheet(asOfDate);
        return sendSuccess(res, { report }, 'Balance sheet retrieved successfully');
    } catch (err) {
        next(err);
    }
};

/**
 * Inventory export (stock-by-store & warehouse)
 */
const getInventoryExport = async (req, res, next) => {
    try {
        const storeId = req.user.role === 'store_staff' ? req.user.shopId : req.query.storeId;
        const rows = await reportService.getInventoryExport(storeId);
        return sendSuccess(res, { rows }, 'Inventory export data retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate, storeId } = req.query;
        const report = await reportService.getSalesReport(startDate, endDate, storeId);
        return sendSuccess(res, { report }, 'Sales report retrieved');
    } catch (err) {
        next(err);
    }
};

const getStockReport = async (req, res, next) => {
    try {
        const report = await reportService.getStockReport();
        return sendSuccess(res, { report }, 'Stock report retrieved');
    } catch (err) {
        next(err);
    }
};

const getMovementReport = async (req, res, next) => {
    try {
        const { startDate, endDate, variantId } = req.query;
        const report = await reportService.getMovementReport(startDate, endDate, variantId);
        return sendSuccess(res, { report, movements: report }, 'Movement report retrieved');
    } catch (err) {
        next(err);
    }
};

const getStockAging = async (req, res, next) => {
    try {
        const report = await reportService.getStockAgingReport();
        return sendSuccess(res, { report }, 'Stock aging report retrieved');
    } catch (err) {
        next(err);
    }
};

const getProfitReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reportService.getProfitReport(startDate, endDate);
        return sendSuccess(res, { report }, 'Profit report retrieved');
    } catch (err) {
        next(err);
    }
};

const getCustomerReport = async (req, res, next) => {
    try {
        const { startDate, endDate, customerId } = req.query;
        const data = await reportService.getSalesReport(startDate, endDate); // Assuming this gives customer-item details
        // Specific customer summary logic here if needed
        return sendSuccess(res, { report: data }, 'Customer report retrieved');
    } catch (err) { next(err); }
};

const getVendorReport = async (req, res, next) => {
    try {
        const { startDate, endDate, supplierId } = req.query;
        const report = await reportService.getPurchaseRegister(supplierId, startDate, endDate);
        return sendSuccess(res, { report }, 'Vendor report retrieved');
    } catch (err) { next(err); }
};

const getCollectionReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reportService.getDailySalesReport(startDate); // Simplified
        return sendSuccess(res, { report }, 'Collection report retrieved');
    } catch (err) { next(err); }
};

const getBankBookReport = async (req, res, next) => {
    try {
        const { bankId, startDate, endDate } = req.query;
        const report = await reportService.getLedgerReport(bankId); // Mapping bank transactions to ledger
        return sendSuccess(res, { report }, 'Bank book report retrieved');
    } catch (err) { next(err); }
};

const getAgeAnalysisReport = async (req, res, next) => {
    try {
        const Purchase = require('../../models/purchase.model');
        const now = new Date();
        const purchases = await Purchase.find({ status: { $in: ['PENDING', 'IN_PROGRESS'] } })
            .populate('supplierId', 'name').select('supplierId invoiceDate grandTotal invoiceNumber');
        const buckets = { '0-30': [], '31-60': [], '61-90': [], '90+': [] };
        purchases.forEach(p => {
            const days = Math.floor((now - new Date(p.invoiceDate)) / (1000 * 60 * 60 * 24));
            const entry = { invoice: p.invoiceNumber, supplier: p.supplierId?.name, amount: p.grandTotal, days };
            if (days <= 30) buckets['0-30'].push(entry);
            else if (days <= 60) buckets['31-60'].push(entry);
            else if (days <= 90) buckets['61-90'].push(entry);
            else buckets['90+'].push(entry);
        });
        return sendSuccess(res, { ageAnalysis: buckets }, 'Age analysis report retrieved');
    } catch (err) { next(err); }
};

const getSaleChallanReport = async (req, res, next) => {
    try {
        const { startDate, endDate, storeId } = req.query;
        const report = await reportService.getSaleChallanReport(startDate, endDate, storeId);
        return sendSuccess(res, { report }, 'Sale challan report retrieved');
    } catch (err) {
        next(err);
    }
};

const getSchemeReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reportService.getSchemeReport(startDate, endDate);
        return sendSuccess(res, { report }, 'Scheme report retrieved');
    } catch (err) {
        next(err);
    }
};

const getOrderReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reportService.getOrderReport(startDate, endDate);
        return sendSuccess(res, { report }, 'Order report retrieved');
    } catch (err) {
        next(err);
    }
};

const getAgentWiseReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reportService.getAgentWiseReport(startDate, endDate);
        return sendSuccess(res, { report }, 'Agent wise report retrieved');
    } catch (err) {
        next(err);
    }
};

const getInTransitReport = async (req, res, next) => {
    try {
        const report = await reportService.getInTransitReport();
        return sendSuccess(res, { report }, 'In-transit stock report retrieved');
    } catch (err) { next(err); }
};

const getConsolidatedStock = async (req, res, next) => {
    try {
        const WarehouseInventory = require('../../models/warehouseInventory.model');
        const StoreInventory = require('../../models/storeInventory.model');
        const SupplierInventory = require('../../models/supplierInventory.model');
        const Item = require('../../models/item.model');

        // Total by Warehouse
        const whStock = await WarehouseInventory.aggregate([
            { $group: { _id: '$warehouseId', totalQty: { $sum: '$quantity' }, items: { $addToSet: '$itemId' } } }
        ]);

        // Total by Store
        const storeStock = await StoreInventory.aggregate([
            { $group: { _id: '$storeId', totalQty: { $sum: '$quantity' } } }
        ]);

        // Total by Supplier (Job Work)
        const supplierStock = await SupplierInventory.aggregate([
            { $group: { _id: '$supplierId', totalQty: { $sum: '$quantity' } } }
        ]);

        return sendSuccess(res, { 
            warehouseStock: whStock, 
            storeStock: storeStock, 
            contractorStock: supplierStock,
            summary: {
                warehouseUnits: whStock.reduce((a, b) => a + b.totalQty, 0),
                storeUnits: storeStock.reduce((a, b) => a + b.totalQty, 0),
                contractorUnits: supplierStock.reduce((a, b) => a + b.totalQty, 0)
            }
        }, 'Consolidated stock report retrieved');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getDailySales,
    getMonthlySales,
    getStoreWiseSales,
    getProductWiseSales,
    getFabricConsumption,
    getLowStockReport,
    getReturnSummary,
    getStockHistory,
    getAuditLogs,
    getLedgerReport,
    getGstSummary,
    getPurchaseRegister,
    getTrialBalance,
    getProfitAndLoss,
    getBalanceSheet,
    getInventoryExport,
    getSalesReport,
    getStockReport,
    getMovementReport,
    getStockAging,
    getProfitReport,
    getCustomerReport,
    getVendorReport,
    getCollectionReport,
    getBankBookReport,
    getAgeAnalysisReport,
    getSaleChallanReport,
    getSchemeReport,
    getOrderReport,
    getAgentWiseReport,
    getConsolidatedStock,
    getInTransitReport
};
