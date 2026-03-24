const mongoose = require('mongoose');
const { DispatchStatus } = require('../core/enums');

const dispatchItemSchema = new mongoose.Schema({
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    qty: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });

const dispatchSchema = new mongoose.Schema(
    {
        dispatchNumber: {
            type: String,
            unique: true,
            trim: true
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false // Optional if dispatch can be manual
        },
        source: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: [true, 'Source warehouse reference is required']
        },
        destination: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: [true, 'Destination store reference is required']
        },
        items: [dispatchItemSchema],
        status: {
            type: String,
            enum: Object.values(DispatchStatus),
            default: DispatchStatus.PENDING,
        },
        dispatchedAt: {
            type: Date
        },
        deliveredAt: {
            type: Date
        },
        notes: {
            type: String
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
    },
    { timestamps: true }
);

dispatchSchema.index({ source: 1 });
dispatchSchema.index({ destination: 1 });
dispatchSchema.index({ status: 1 });

module.exports = mongoose.model('Dispatch', dispatchSchema);
