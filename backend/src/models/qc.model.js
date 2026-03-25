const mongoose = require('mongoose');
const { QcStatus } = require('../core/enums');

const qcItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    receivedQty: {
        type: Number,
        required: true
    },
    approvedQty: {
        type: Number,
        required: true,
        default: 0
    },
    rejectedQty: {
        type: Number,
        required: true,
        default: 0
    }
}, { _id: false });

const qcSchema = new mongoose.Schema(
    {
        qcNumber: {
            type: String,
            unique: true,
            trim: true
        },
        grnId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GRN',
            required: true
        },
        items: [qcItemSchema],
        status: {
            type: String,
            enum: Object.values(QcStatus),
            default: QcStatus.PENDING
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        completedAt: {
            type: Date
        },
        notes: {
            type: String
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

qcSchema.index({ qcNumber: 1 });
qcSchema.index({ grnId: 1 });
qcSchema.index({ status: 1 });

module.exports = mongoose.model('QC', qcSchema);
