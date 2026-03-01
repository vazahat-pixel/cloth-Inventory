const express = require('express');
const reportController = require('./report.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(requireAdmin); // Reports are admin-only

router.get('/daily-sales', reportController.getDailySales);
router.get('/monthly-sales', reportController.getMonthlySales);
router.get('/store-wise', reportController.getStoreWiseSales);
router.get('/product-wise', reportController.getProductWiseSales);
router.get('/fabric-consumption', reportController.getFabricConsumption);
router.get('/low-stock', reportController.getLowStockReport);
router.get('/returns', reportController.getReturnSummary);
router.get('/stock-history', reportController.getStockHistory);
router.get('/audit-logs', reportController.getAuditLogs);
router.get('/ledger/:accountId', reportController.getLedgerReport);
router.get('/gst-summary', reportController.getGstSummary);
router.get('/purchase-register', reportController.getPurchaseRegister);
router.get('/trial-balance', reportController.getTrialBalance);
router.get('/profit-loss', reportController.getProfitAndLoss);
router.get('/balance-sheet', reportController.getBalanceSheet);

module.exports = router;
