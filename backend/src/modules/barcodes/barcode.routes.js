const express = require('express');
const barcodeController = require('./barcode.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.use(protect);

router.post('/import-excel', requireAdmin, upload.single('file'), barcodeController.importBarcodeExcel);
router.get('/:barcode', barcodeController.getProductByBarcode);
router.patch('/regenerate/:productId', requireAdmin, barcodeController.regenerateBarcode);

module.exports = router;
