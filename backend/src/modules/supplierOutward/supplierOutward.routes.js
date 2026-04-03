const express = require('express');
const router = express.Router();
const supplierOutwardController = require('./supplierOutward.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

router.route('/')
    .get(supplierOutwardController.getOutwards)
    .post(requireAdmin, supplierOutwardController.createOutward);

router.route('/:id')
    .get(supplierOutwardController.getOutwardById);

module.exports = router;
