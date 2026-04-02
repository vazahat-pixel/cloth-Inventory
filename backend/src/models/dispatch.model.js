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
        sourceWarehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: [true, 'Source warehouse reference is required']
        },
        destinationStoreId: {
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
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false // Link to DeliveryChallan or Sale
        },
        referenceType: {
            type: String,
            enum: ['Sale', 'DeliveryChallan'],
            required: false
        },
        dispatchedAt: {
            type: Date
        },
        receivedAt: {
            type: Date
        },
        notes: {
            type: String
        },
        vehicleNumber: { type: String, trim: true },
        driverName: { type: String, trim: true },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
    },
    { timestamps: true }
);

dispatchSchema.index({ sourceWarehouseId: 1 });
dispatchSchema.index({ destinationStoreId: 1 });
dispatchSchema.index({ status: 1 });
dispatchSchema.index({ referenceId: 1 });
dispatchSchema.index({ referenceType: 1 });

module.exports = mongoose.model('Dispatch', dispatchSchema);
