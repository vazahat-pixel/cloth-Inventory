const reportService = require('./report.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const getDailySales = async (req, res, next) => {
    try {
        const { date } = req.query;
        const report = await reportService.getDailySalesReport(date);
        return sendSuccess(res, { report: report[0] || { totalRevenue: 0, totalSales: 0 } }, 'Daily sales report retrieved');
    } catch (err) {
        next(err);
    }
};

const getMonthlySales = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return sendError(res, 'Month and Year are required', 400);

        const report = await reportService.getMonthlySalesReport(parseInt(month), parseInt(year));
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
        const report = await reportService.getProductWiseSales(startDate, endDate);
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
        const report = await reportService.getLowStockReport();
        return sendSuccess(res, { report }, 'Low stock report retrieved');
    } catch (err) {
        next(err);
    }
};

const getReturnSummary = async (req, res, next) => {
    try {
        const report = await reportService.getReturnSummary();
        return sendSuccess(res, { report }, 'Return summary report retrieved');
    } catch (err) {
        next(err);
    }
};

const getStockHistory = async (req, res, next) => {
    try {
        const history = await reportService.getStockHistory(req.query);
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
        const report = await reportService.getGstSummary(startDate, endDate);
        return sendSuccess(res, { report }, 'GST summary report retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getPurchaseRegister = async (req, res, next) => {
    try {
        const { supplierId, startDate, endDate } = req.query;
        const report = await reportService.getPurchaseRegister(supplierId, startDate, endDate);
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
        const rows = await reportService.getInventoryExport();
        return sendSuccess(res, { rows }, 'Inventory export data retrieved successfully');
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
    getInventoryExport
};
