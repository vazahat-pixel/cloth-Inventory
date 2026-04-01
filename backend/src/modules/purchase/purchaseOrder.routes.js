const express = require('express');
const poController = require('./purchaseOrder.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
// Anyone authenticated can view list, detail or create. 
// However, approving is restricted to Admin.

router.route('/')
    .get(poController.getAllPOs)
    .post(poController.createPO);

router.post('/from-voucher/:voucherId', poController.createPOFromVoucher);

router.route('/:id')
    .get(poController.getPOById)
    .patch(poController.updatePO);

router.route('/:id/status')
    .patch(requireAdmin, poController.updateStatus);

module.exports = router;
