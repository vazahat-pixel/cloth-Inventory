const express = require('express');
const router = express.Router();
const barcodeController = require('./barcode.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect); // Secure all routes

// Get barcode labels from a GRN Document
router.get('/grn/:id', requireAdmin, barcodeController.getGrnBarcodes);

// Extensible placeholders for future features
// router.post('/import-excel', requireAdmin, upload.single('file'), barcodeController.importExcelBarcodes);

module.exports = router;
