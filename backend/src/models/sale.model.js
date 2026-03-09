const mongoose = require('mongoose');
const { PaymentMethod, SaleStatus } = require('../core/enums');

const saleItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
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
    price: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number,
        default: 0
    },
    appliedPrice: {
        type: Number,
        required: true
    },
    pricingSource: {
        type: String,
        enum: ['DEFAULT', 'STORE_SPECIFIC'],
        default: 'DEFAULT'
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
        type: {
            type: String,
            enum: ['RETAIL', 'EXCHANGE'],
            default: 'RETAIL'
        },
        parentSaleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sale'
        },
        products: [saleItemSchema],
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
        taxBreakup: {
            cgst: { type: Number, default: 0 },
            sgst: { type: Number, default: 0 },
            igst: { type: Number, default: 0 }
        },
        totalTax: { type: Number, default: 0 },
        grandTotal: {
            type: Number,
            required: true
        },
        paymentMode: {
            type: String,
            enum: Object.values(PaymentMethod),
            default: PaymentMethod.CASH
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
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Indexes
// saleSchema.index({ saleNumber: 1 }); // unique: true handles this
saleSchema.index({ storeId: 1 });
saleSchema.index({ cashierId: 1 });
saleSchema.index({ saleDate: -1 });

module.exports = mongoose.model('Sale', saleSchema);
