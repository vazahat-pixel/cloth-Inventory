const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true
        },
        sku: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        styleCode: {
            type: String,
            trim: true,
            index: true
        },
        barcode: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductionBatch',
            required: false
        },
        size: {
            type: String,
            required: true,
            enum: ['S', 'M', 'L', 'XL', 'XXL', 'FREE'],
            trim: true
        },
        color: {
            type: String,
            trim: true
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required']
        },
        groupIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        }],
        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand',
            required: [true, 'Brand is required']
        },
        costPrice: {
            type: Number,
            default: 0,
            min: 0
        },
        salePrice: {
            type: Number,
            required: [true, 'Sale price is required'],
            min: 0
        },
        factoryStock: {
            type: Number,
            default: 0,
            min: 0
        },
        minStockLevel: {
            type: Number,
            default: 5
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        gstSlabId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GstSlab',
            default: null
        },
        image: { type: String }, // Backward compatibility
        images: [{ type: String }],
        description: { type: String, trim: true },
        attributes: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        hsnCodeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HsnCode'
        },
        gender: { type: String },
        season: { type: String },
        fabric: { type: String },
        fabricType: { type: String }
    },
    { timestamps: true }
);

// Text Indexes
productSchema.index({ name: 'text', category: 'text' });
productSchema.index({ sku: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ isDeleted: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
