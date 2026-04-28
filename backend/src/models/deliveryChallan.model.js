const mongoose = require('mongoose');

const deliveryChallanSchema = new mongoose.Schema(
    {
        dcNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        sourceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse'
        },
        destinationStoreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true
        },
        type: {
            type: String,
            enum: ['CUSTOMER_DISPATCH', 'WAREHOUSE_TO_STORE'],
            default: 'WAREHOUSE_TO_STORE'
        },
        items: [
            {
                itemId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Item',
                    required: true
                },
                variantId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true
                },
                barcode: {
                    type: String,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },
                rate: {
                    type: Number,
                    required: true,
                    default: 0
                }
            }
        ],
        status: {
            type: String,
            enum: ['DRAFT', 'SENT', 'RECEIVED', 'CANCELLED'],
            default: 'DRAFT'
        },
        dcDate: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        notes: {
            type: String,
            trim: true
        },
        vehicleNumber: { type: String, trim: true },
        driverName: { type: String, trim: true },
        totalMRP: { type: Number, default: 0 },
        totalDiscount: { type: Number, default: 0 },
        taxableAmount: { type: Number, default: 0 },
        gstAmount: { type: Number, default: 0 },
        finalAmount: { type: Number, default: 0 },
        hsnSummary: [
            {
                hsnCode: String,
                totalQty: Number,
                gstPercent: Number,
                taxableAmount: Number,
                cgst: Number,
                sgst: Number,
                igst: Number
            }
        ]
    },
    { timestamps: true }
);

deliveryChallanSchema.index({ customerId: 1 });
deliveryChallanSchema.index({ storeId: 1 });

module.exports = mongoose.model('DeliveryChallan', deliveryChallanSchema);
