const express = require('express');
const router = express.Router();
const voucherController = require('./accountingVoucher.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.post('/', voucherController.createVoucher);
router.get('/', voucherController.getAllVouchers);
router.get('/:id', voucherController.getVoucherById);

module.exports = router;
