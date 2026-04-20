const express = require('express');
const router = express.Router();
const barcodeController = require('./barcode.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect); // Secure all routes

// Get barcode labels from a GRN Document
router.get('/grn/:id', requireAdmin, barcodeController.getGrnBarcodes);

// Batch History & Maintenance
router.get('/', requireAdmin, barcodeController.listBatchBarcodes);
router.delete('/', requireAdmin, barcodeController.deleteAllBatchBarcodes);
router.delete('/:id', requireAdmin, barcodeController.deleteBatchBarcode);

module.exports = router;
