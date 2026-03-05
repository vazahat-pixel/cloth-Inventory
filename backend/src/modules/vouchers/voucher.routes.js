const express = require('express');
const router = express.Router();
const voucherController = require('./voucher.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

router.post('/', requireAdmin, voucherController.createVoucher);
router.get('/', voucherController.getAllVouchers);
router.get('/:number', voucherController.getVoucherByNumber);
router.patch('/:id', requireAdmin, voucherController.updateVoucher);

module.exports = router;
