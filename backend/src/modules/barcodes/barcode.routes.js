const express = require('express');
const barcodeController = require('./barcode.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.get('/:barcode', barcodeController.getProductByBarcode);
router.patch('/regenerate/:productId', requireAdmin, barcodeController.regenerateBarcode);

module.exports = router;
