const mongoose = require('mongoose');

const storePricingSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        effectiveFrom: {
            type: Date,
            default: Date.now
        },
        effectiveTo: {
            type: Date,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: { type: String }
    },
    { timestamps: true }
);

// Compound unique index ensuring one pricing rule per store-product pair
storePricingSchema.index({ storeId: 1, productId: 1 }, { unique: true });
storePricingSchema.index({ isActive: 1 });

module.exports = mongoose.model('StorePricing', storePricingSchema);
