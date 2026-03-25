const express = require('express');
const accountingController = require('./accounting.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.post('/vouchers', accountingController.createVoucher);
router.put('/vouchers/:id/post', requireAdmin, accountingController.postVoucher);
router.get('/vouchers', accountingController.getVouchers);
router.get('/vouchers/:id', accountingController.getVoucherById);

module.exports = router;
