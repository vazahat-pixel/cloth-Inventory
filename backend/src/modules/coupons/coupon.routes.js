const express = require('express');
const router = express.Router();
const couponController = require('./coupon.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

router.post('/', requireAdmin, couponController.createCoupon);
router.get('/', couponController.getAllCoupons);
router.post('/validate', couponController.validateCoupon);
router.patch('/:id', requireAdmin, couponController.updateCoupon);
router.delete('/:id', requireAdmin, couponController.deleteCoupon);

module.exports = router;
