const express = require('express');
const router = express.Router();
const accountsController = require('./accounts.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

router.post('/bank-payment', requireAdmin, accountsController.createBankPayment);
router.post('/bank-receipt', requireAdmin, accountsController.createBankReceipt);
router.get('/bank-payment', accountsController.getBankPayments);
router.get('/bank-receipt', accountsController.getBankReceipts);

module.exports = router;
