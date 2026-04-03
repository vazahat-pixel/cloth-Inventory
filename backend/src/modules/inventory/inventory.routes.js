const express = require('express');
const router = express.Router();
const inventoryController = require('./inventory.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

// Stock Ledger System
router.get('/stock-ledger/:itemId', inventoryController.getLedgerByItem);

// Production-ready Warehouse Stock Retrieval
router.get('/warehouse-stock/:warehouseId', inventoryController.getWarehouseStock);
router.get('/warehouse/:warehouseId/scan/:barcode', inventoryController.scanWarehouseItem);

// Debug Visibility & Journey System
router.get('/dashboard-summary', inventoryController.getDashboardSummary);
router.get('/system-logs', inventoryController.getSystemLogs);
router.get('/error-logs', requireAdmin, inventoryController.getErrorLogs);

// Deep Trace & Audit
router.get('/trace/:itemId', inventoryController.getItemJourney);
router.get('/validation-report', inventoryController.getValidationReport);
router.get('/demo-metrics', inventoryController.getClientDemoMetrics);

module.exports = router;
