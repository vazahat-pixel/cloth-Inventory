const mongoose = require('mongoose');
const { DispatchStatus } = require('../core/enums');

const stockReturnItemSchema = new mongoose.Schema({
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

const stockReturnSchema = new mongoose.Schema(
    {
        returnNumber: {
            type: String,
            unique: true,
            required: true
        },
        sourceStoreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true
        },
        destinationWarehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: true
        },
        items: [stockReturnItemSchema],
        status: {
            type: String,
            enum: Object.values(DispatchStatus),
            default: DispatchStatus.PENDING
        },
        reason: {
            type: String,
            trim: true
        },
        initiatedAt: {
            type: Date,
            default: Date.now
        },
        receivedAt: {
            type: Date
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true }
);

stockReturnSchema.index({ returnNumber: 1 });
stockReturnSchema.index({ sourceStoreId: 1 });
stockReturnSchema.index({ destinationWarehouseId: 1 });
stockReturnSchema.index({ status: 1 });

module.exports = mongoose.model('StockReturn', stockReturnSchema);
