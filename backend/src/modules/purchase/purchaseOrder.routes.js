const express = require('express');
const poController = require('./purchaseOrder.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(requireAdmin);

router.route('/')
    .get(poController.getAllPOs)
    .post(poController.createPO);

router.route('/:id')
    .get(poController.getPOById)
    .patch(poController.updatePO);

router.route('/:id/status')
    .patch(poController.updateStatus);

module.exports = router;
