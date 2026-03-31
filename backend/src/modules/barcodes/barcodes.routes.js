const express = require('express');
const router = express.Router();
const barcodesController = require('./barcodes.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/import-excel', protect, barcodesController.importExcelAndGenerateBarcodes);

module.exports = router;
