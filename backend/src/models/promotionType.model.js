const mongoose = require('mongoose');

const promotionTypeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        baseLogic: { 
            type: String, 
            enum: ['PERCENTAGE', 'FLAT', 'BOGO', 'BUY_X_GET_Y', 'FIXED_PRICE', 'FREE_GIFT'], 
            required: true 
        },
        description: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('PromotionType', promotionTypeSchema);
