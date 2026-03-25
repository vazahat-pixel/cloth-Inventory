const mongoose = require('mongoose');
const { ReturnType, ReturnStatus } = require('../core/enums');

const returnItemSchema = new mongoose.Schema({
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    rate: {
        type: Number,
        required: true
    },
    subTotal: {
        type: Number,
        required: true
    }
}, { _id: false });

const returnSchema = new mongoose.Schema(
    {
        returnNumber: {
            type: String,
            unique: true,
            trim: true
        },
        type: {
            type: String,
            enum: Object.values(ReturnType),
            required: true
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            // Dynamic reference based on type (handled in business logic)
        },
        locationId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            // Could be Store or Warehouse
        },
        items: [returnItemSchema],
        totalAmount: {
            type: Number,
            required: true
        },
        reason: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: Object.values(ReturnStatus),
            default: ReturnStatus.APPROVED
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true }
);

returnSchema.index({ returnNumber: 1 });
returnSchema.index({ type: 1 });
returnSchema.index({ referenceId: 1 });
returnSchema.index({ locationId: 1 });

module.exports = mongoose.model('Return', returnSchema);
