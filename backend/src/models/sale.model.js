const mongoose = require('mongoose');
const { PaymentMethod, SaleStatus } = require('../core/enums');

const saleItemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    variantId: {
        type: String, // variant._id or SKU
        required: true
    },
    barcode: {
        type: String,
        required: true
    },
    itemName: { type: String },
    sku: { type: String },
    hsnCode: { type: String },
    category: { type: String },
    brand: { type: String },
    promoDiscount: { type: Number, default: 0 },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    mrp: {
        type: Number,
        required: true
    },
    rate: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    taxAmount: { type: Number, default: 0 },
    taxPercentage: { type: Number, default: 0 },
    total: {
        type: Number,
        required: true
    }
}, { _id: false });

const saleSchema = new mongoose.Schema(
    {
        saleNumber: {
            type: String,
            unique: true,
            trim: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true
        },
        cashierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        customerName: {
            type: String,
            trim: true
        },
        customerMobile: {
            type: String,
            trim: true
        },
        customerAddress: {
            type: String,
            trim: true
        },
        type: {
            type: String,
            enum: ['RETAIL', 'EXCHANGE', 'INTERNAL_SALE'],
            default: 'RETAIL'
        },
        destinationStoreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store'
        },
        parentSaleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sale'
        },
        challanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DeliveryChallan'
        },
        items: [saleItemSchema],
        subTotal: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0
        },
        loyaltyRedeemed: {
            type: Number,
            default: 0
        },
        creditNoteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CreditNote'
        },
        creditNoteApplied: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        taxAmount: { type: Number, default: 0 },
        taxPercentage: { type: Number, default: 0 },
        taxBreakup: {
            cgst: { type: Number, default: 0 },
            sgst: { type: Number, default: 0 },
            igst: { type: Number, default: 0 }
        },
        totalTax: { type: Number, default: 0 },
        paymentMode: {
            type: String,
            enum: Object.values(PaymentMethod),
            default: PaymentMethod.CASH
        },
        amountPaid: {
            type: Number,
            default: 0
        },
        dueAmount: {
            type: Number,
            default: 0
        },
        grandTotal: {
            type: Number,
            required: true
        },
        exchangeAdjustment: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: Object.values(SaleStatus),
            default: SaleStatus.COMPLETED
        },
        saleDate: {
            type: Date,
            default: Date.now
        },
        receiptStatus: {
            type: String,
            enum: ['PENDING', 'RECEIVED'],
            default: 'PENDING'
        },
        receivedAt: {
            type: Date
        },
        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
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
        ],
        returnedItems: [saleItemSchema]
    },
    { timestamps: true }
);

// Indexes
// saleSchema.index({ saleNumber: 1 }); // unique: true handles this
saleSchema.index({ storeId: 1 });
saleSchema.index({ cashierId: 1 });
saleSchema.index({ saleDate: -1 });

module.exports = mongoose.model('Sale', saleSchema);
