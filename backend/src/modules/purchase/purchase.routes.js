const express = require('express');
const purchaseController = require('./purchase.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');
const { createPurchaseValidation } = require('./purchase.validation');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

router.use(protect);
router.use(requireAdmin);

router.route('/')
    .get(purchaseController.getAllPurchases)
    .post(createPurchaseValidation, validate, purchaseController.createPurchase);

router.route('/:id')
    .get(purchaseController.getPurchaseById)
    .patch(purchaseController.updatePurchase); 

router.patch('/:id/cancel', purchaseController.cancelPurchase);
router.post('/:id/post', purchaseController.postVoucher);
router.get('/returns/list', purchaseController.getAllPurchaseReturns);
router.post('/returns/add', purchaseController.createPurchaseReturn);

module.exports = router;
