const express = require('express');
const pricingController = require('./pricing.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(requireAdmin);

router.route('/')
    .get(pricingController.getPricingRules)
    .post(pricingController.createPricingRule);

router.route('/:id')
    .patch(pricingController.updatePricingRule)
    .delete(pricingController.deletePricingRule);

module.exports = router;
