const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        description: { type: String, trim: true },
        type: {
            type: String,
            enum: ['PERCENTAGE', 'FLAT'],
            required: true
        },
        value: { type: Number, required: true },
        minPurchaseAmount: { type: Number, default: 0 },
        maxDiscountAmount: { type: Number },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        usageLimit: { type: Number, default: 1 },
        usedCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
