const mongoose = require('mongoose');
const { GrnStatus } = require('../core/enums');

const grnItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' // Assuming variants are products for now as per previous patterns
    },
    orderedQty: {
        type: Number,
        required: true
    },
    receivedQty: {
        type: Number,
        required: true
    }
}, { _id: false });

const grnSchema = new mongoose.Schema(
    {
        grnNumber: {
            type: String,
            unique: true,
            trim: true
        },
        purchaseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Purchase',
            required: true
        },
        items: [grnItemSchema],
        status: {
            type: String,
            enum: Object.values(GrnStatus),
            default: GrnStatus.PENDING
        },
        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        receivedAt: {
            type: Date,
            default: Date.now
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

grnSchema.index({ grnNumber: 1 });
grnSchema.index({ purchaseId: 1 });
grnSchema.index({ status: 1 });

module.exports = mongoose.model('GRN', grnSchema);
