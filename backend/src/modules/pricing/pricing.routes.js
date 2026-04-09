const express = require('express');
const pricingController = require('./pricing.controller');
const promotionTypeController = require('./promotionType.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAny } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.get('/promotion-types', promotionTypeController.getPromotionTypes);
router.post('/promotion-types', promotionTypeController.createPromotionType);
router.delete('/promotion-types/:id', promotionTypeController.deletePromotionType);

router.get('/', (req, res) => require('../../utils/response.handler').sendSuccess(res, { schemes: [] }));

// CRUD for Schemes & Coupons (already handled by masters/setup in some places, but centralized here is better)
router.get('/schemes', pricingController.getSchemes);
router.post('/schemes', pricingController.createScheme);
router.get('/schemes/:id', pricingController.getSchemeById);
router.patch('/schemes/:id', pricingController.updateScheme);
router.delete('/schemes/:id', pricingController.deleteScheme);
router.get('/coupons', pricingController.getCoupons);
router.post('/coupons', pricingController.createCoupon);

// ELIGIBILITY ENGINE
// POST /api/pricing/evaluate
// Body: { items: [{ productId, quantity, price, brand, category }], totalAmount, storeId }
router.post('/evaluate', pricingController.evaluateOffers);

module.exports = router;
