const express = require('express');
const returnController = require('./return.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/', returnController.createReturn);
router.post('/purchase-return', returnController.purchaseReturn);
router.post('/sales-return', returnController.salesReturn);
router.get('/', returnController.getReturns);
router.get('/:id', returnController.getById);

module.exports = router;
