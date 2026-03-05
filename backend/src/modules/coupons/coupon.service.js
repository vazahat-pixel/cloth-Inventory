const Coupon = require('../../models/coupon.model');

const createCoupon = async (data, userId) => {
    return await Coupon.create({ ...data, createdBy: userId });
};

const getAllCoupons = async (query = {}) => {
    const { isActive, code } = query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (code) filter.code = new RegExp(code, 'i');

    return await Coupon.find(filter).sort({ createdAt: -1 });
};

const validateCoupon = async (code, amount) => {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) throw new Error('Invalid coupon code');

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
        throw new Error('Coupon is not active or has expired');
    }

    if (coupon.usedCount >= coupon.usageLimit) {
        throw new Error('Coupon usage limit reached');
    }

    if (amount < coupon.minPurchaseAmount) {
        throw new Error(`Minimum purchase of ${coupon.minPurchaseAmount} required`);
    }

    return coupon;
};

const updateCoupon = async (id, data) => {
    return await Coupon.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteCoupon = async (id) => {
    return await Coupon.findByIdAndDelete(id);
};

module.exports = {
    createCoupon,
    getAllCoupons,
    validateCoupon,
    updateCoupon,
    deleteCoupon
};
