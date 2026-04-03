const pricingService = require('./pricing.service');
const { sendSuccess, sendError, sendCreated } = require('../../utils/response.handler');

class PricingController {
    /**
     * EVALUATE OFFERS ELIGIBILITY
     */
    evaluateOffers = async (req, res) => {
        try {
            const { items, totalAmount, storeId } = req.body;
            if (!items || !items.length) {
                return sendError(res, 'Items are required for offer evaluation', 400);
            }
            const result = await pricingService.evaluateAllOffers({ items, totalAmount, storeId });
            return sendSuccess(res, result, 'Offers evaluated successfully');
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    };

    /**
     * READ SCHEMES
     */
    getSchemes = async (req, res) => {
        try {
            const schemes = await pricingService.listSchemes();
            return sendSuccess(res, { schemes }, 'Schemes fetched successfully');
        } catch (error) {
            return sendError(res, error.message);
        }
    };

    /**
     * READ SCHEME BY ID
     */
    getSchemeById = async (req, res) => {
        try {
            const Scheme = require('../../models/scheme.model');
            const scheme = await Scheme.findById(req.params.id);
            if (!scheme) return sendError(res, 'Scheme not found', 404);
            return sendSuccess(res, { scheme }, 'Scheme fetched successfully');
        } catch (error) {
            return sendError(res, error.message);
        }
    };

    /**
     * CREATE SCHEME
     */
    createScheme = async (req, res) => {
        try {
            const scheme = await pricingService.createScheme(req.body, req.user._id);
            return sendCreated(res, { scheme }, 'Scheme created successfully');
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    };

    /**
     * UPDATE SCHEME
     */
    updateScheme = async (req, res) => {
        try {
            const Scheme = require('../../models/scheme.model');
            const scheme = await Scheme.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!scheme) return sendError(res, 'Scheme not found', 404);
            return sendSuccess(res, { scheme }, 'Scheme updated successfully');
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    };

    /**
     * DELETE SCHEME
     */
    deleteScheme = async (req, res) => {
        try {
            const Scheme = require('../../models/scheme.model');
            const scheme = await Scheme.findByIdAndDelete(req.params.id);
            if (!scheme) return sendError(res, 'Scheme not found', 404);
            return sendSuccess(res, null, 'Scheme deleted successfully');
        } catch (error) {
            return sendError(res, error.message);
        }
    };

    /**
     * READ COUPONS
     */
    getCoupons = async (req, res) => {
        try {
            const Coupon = require('../../models/coupon.model');
            const coupons = await Coupon.find().sort({ createdAt: -1 });
            return sendSuccess(res, { coupons }, 'Coupons fetched successfully');
        } catch (error) {
            return sendError(res, error.message);
        }
    };

    /**
     * CREATE COUPON
     */
    createCoupon = async (req, res) => {
        try {
            const coupon = await pricingService.createCoupon(req.body, req.user._id);
            return sendCreated(res, { coupon }, 'Coupon created successfully');
        } catch (error) {
            return sendError(res, error.message, 400);
        }
    };
}

module.exports = new PricingController();
