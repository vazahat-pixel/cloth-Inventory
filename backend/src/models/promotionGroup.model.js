const mongoose = require('mongoose');

const promotionGroupSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        applicableCategories: [{ type: mongoose.Schema.Types.Mixed }],
        applicableBrands: [{ type: mongoose.Schema.Types.Mixed }],
        applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
        isActive: { type: Boolean, default: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('PromotionGroup', promotionGroupSchema);
