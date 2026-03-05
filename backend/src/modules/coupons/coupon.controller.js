const couponService = require('./coupon.service');
const { sendSuccess, sendCreated, sendError, sendNotFound } = require('../../utils/response.handler');

const createCoupon = async (req, res, next) => {
    try {
        const coupon = await couponService.createCoupon(req.body, req.user._id);
        return sendCreated(res, { coupon }, 'Coupon created successfully');
    } catch (err) {
        next(err);
    }
};

const getAllCoupons = async (req, res, next) => {
    try {
        const coupons = await couponService.getAllCoupons(req.query);
        return sendSuccess(res, { coupons }, 'Coupons retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const validateCoupon = async (req, res, next) => {
    try {
        const { code, amount } = req.body;
        const coupon = await couponService.validateCoupon(code, amount);
        return sendSuccess(res, { coupon }, 'Coupon is valid');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const updateCoupon = async (req, res, next) => {
    try {
        const coupon = await couponService.updateCoupon(req.params.id, req.body);
        if (!coupon) return sendNotFound(res, 'Coupon not found');
        return sendSuccess(res, { coupon }, 'Coupon updated successfully');
    } catch (err) {
        next(err);
    }
};

const deleteCoupon = async (req, res, next) => {
    try {
        const coupon = await couponService.deleteCoupon(req.params.id);
        if (!coupon) return sendNotFound(res, 'Coupon not found');
        return sendSuccess(res, {}, 'Coupon deleted successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createCoupon,
    getAllCoupons,
    validateCoupon,
    updateCoupon,
    deleteCoupon
};
