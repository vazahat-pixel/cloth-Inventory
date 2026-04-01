const express = require('express');
const reportController = require('./report.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.get('/daily-sales', reportController.getDailySales);
router.get('/monthly-sales', reportController.getMonthlySales);
router.get('/store-wise', reportController.getStoreWiseSales);
router.get('/product-wise', reportController.getProductWiseSales);
router.get('/fabric-consumption', requireAdmin, reportController.getFabricConsumption);
router.get('/low-stock', reportController.getLowStockReport);
router.get('/returns', reportController.getReturnSummary);
router.get('/stock-history', reportController.getStockHistory);
router.get('/audit-logs', requireAdmin, reportController.getAuditLogs);
router.get('/ledger/:accountId', reportController.getLedgerReport);
router.get('/gst-summary', requireAdmin, reportController.getGstSummary);
router.get('/purchase-register', reportController.getPurchaseRegister);
router.get('/trial-balance', requireAdmin, reportController.getTrialBalance);
router.get('/profit-loss', requireAdmin, reportController.getProfitAndLoss);
router.get('/balance-sheet', requireAdmin, reportController.getBalanceSheet);

router.get('/sales', reportController.getSalesReport);
router.get('/stock', reportController.getStockReport);
router.get('/movement', reportController.getMovementReport);
router.get('/stock-aging', requireAdmin, reportController.getStockAging);
router.get('/profit', requireAdmin, reportController.getProfitReport);

// Inventory export (stock-by-store & warehouse) - HO only
router.get('/inventory-export', protect, reportController.getInventoryExport);

// NEW Report Endpoints
router.get('/customer', reportController.getCustomerReport);
router.get('/vendor', reportController.getVendorReport);
router.get('/collection', reportController.getCollectionReport);
router.get('/bank-book', reportController.getBankBookReport);
router.get('/age-analysis', requireAdmin, reportController.getAgeAnalysisReport);

// Added missing endpoints from implementation plan
router.get('/sale-challans', reportController.getSaleChallanReport);
router.get('/schemes', reportController.getSchemeReport);
router.get('/orders', reportController.getOrderReport);
router.get('/agent-wise', reportController.getAgentWiseReport);

module.exports = router;
