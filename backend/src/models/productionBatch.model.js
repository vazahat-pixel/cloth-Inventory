const mongoose = require('mongoose');
const { ProductionStatus, ProductionStage } = require('../core/enums');

const sizeBreakdownSchema = new mongoose.Schema({
    size: {
        type: String,
        required: true,
        enum: ['S', 'M', 'L', 'XL', 'XXL', 'FREE']
    },
    quantity: {
        type: Number,
        required: true,
        min: [0, 'Quantity cannot be negative']
    }
}, { _id: false });

const productionBatchSchema = new mongoose.Schema(
    {
        batchNumber: {
            type: String,
            unique: true,
            trim: true
        },
        fabricId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Fabric',
            required: [true, 'Fabric reference is required']
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product reference is required']
        },
        meterUsed: {
            type: Number,
            required: [true, 'Meter usage is required'],
            min: [0.1, 'Meter usage must be positive']
        },
        sizeBreakdown: [sizeBreakdownSchema],
        totalPieces: {
            type: Number,
            default: 0
        },
        stage: {
            type: String,
            enum: Object.values(ProductionStage),
            default: ProductionStage.MATERIAL_RECEIVED,
        },
        status: {
            type: String,
            enum: Object.values(ProductionStatus),
            default: ProductionStatus.ACTIVE,
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        notes: { type: String },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
    },
    { timestamps: true }
);

// Pre-save hook to calculate total pieces
productionBatchSchema.pre('save', function (next) {
    if (this.sizeBreakdown && this.sizeBreakdown.length > 0) {
        this.totalPieces = this.sizeBreakdown.reduce((sum, item) => sum + item.quantity, 0);
    }
    next();
});

// Indexes
// productionBatchSchema.index({ batchNumber: 1 }); // unique: true handles this
productionBatchSchema.index({ fabricId: 1 });
productionBatchSchema.index({ stage: 1 });
productionBatchSchema.index({ status: 1 });
productionBatchSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('ProductionBatch', productionBatchSchema);
