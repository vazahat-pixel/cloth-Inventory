const mongoose = require('mongoose');
const { DispatchStatus } = require('../core/enums');

const dispatchItemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    barcode: {
        type: String,
        required: true
    },
    qty: {
        type: Number,
        required: true,
        min: 1
    },
    rate: {
        type: Number,
        default: 0
    },
    mrp: {
        type: Number,
        default: 0
    },
    discountPercent: {
        type: Number,
        default: 0
    },
    taxPercentage: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
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
        /**
         * IDEMPOTENCY LOCK — set atomically the FIRST time stock is physically
         * added to the destination store.  Once set, this field can never be
         * overwritten, making duplicate stock-in impossible even via scripts.
         */
        stockReceivedAt: {
            type: Date,
            default: null
        },
        receiptToken: {
            type: String,
            default: null
        },
        notes: {
            type: String
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
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

dispatchSchema.index({ sourceWarehouseId: 1 });
dispatchSchema.index({ destinationStoreId: 1 });
dispatchSchema.index({ status: 1 });
dispatchSchema.index({ status: 1, createdAt: -1 });
dispatchSchema.index({ referenceId: 1 });
dispatchSchema.index({ referenceType: 1 });
// Idempotency index — used by the atomic duplicate-receive guard
dispatchSchema.index({ status: 1, stockReceivedAt: 1 });
dispatchSchema.index({ receiptToken: 1 }, { sparse: true, unique: true });

module.exports = mongoose.model('Dispatch', dispatchSchema);
