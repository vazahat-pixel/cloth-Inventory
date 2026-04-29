const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        type: {
            type: String,
            enum: ['PERCENTAGE', 'FLAT', 'BOGO', 'BUY_X_GET_Y', 'FREE_GIFT', 'FIXED_PRICE', 'MANUAL'],
            required: true
        },
        value: { type: Number, default: 0 }, // For percentage or flat
        buyQuantity: { type: Number, default: 0 }, // For BOGO/BuyXGetY
        getQuantity: { type: Number, default: 0 }, // For BOGO/BuyXGetY
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
        applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
        applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
        applicableBrands: [{ type: String }],
        applicableStores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Store' }],
        minPurchaseAmount: { type: Number, default: 0 },
        minPurchaseQuantity: { type: Number, default: 0 },
        giftItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        giftQuantity: { type: Number, default: 0 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Scheme', schemeSchema);
