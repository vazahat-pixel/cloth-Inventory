const express = require('express');
const router = express.Router();
const accountsController = require('./accounts.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin, requireAny } = require('../../middlewares/role.middleware');

router.use(protect);

// Bank Vouchers
router.post('/bank-payment', requireAdmin, accountsController.createBankPayment);
router.post('/bank-receipt', requireAdmin, accountsController.createBankReceipt);
router.get('/bank-payment', accountsController.getBankPayments);
router.get('/bank-receipt', accountsController.getBankReceipts);

// Cash Vouchers
router.post('/cash-receipt', requireAny, accountsController.createCashReceipt);
router.post('/cash-payment', requireAny, accountsController.createCashPayment);

// Journal
router.post('/journal', requireAdmin, accountsController.createJournalEntry);

// All Vouchers
router.get('/vouchers', requireAny, accountsController.getAllVouchers);

module.exports = router;
