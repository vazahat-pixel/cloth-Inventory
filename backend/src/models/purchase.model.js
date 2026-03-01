const mongoose = require('mongoose');
const { PurchaseStatus } = require('../core/enums');

const purchaseSchema = new mongoose.Schema(
    {
        purchaseNumber: {
            type: String,
            required: true,
            unique: true
        },
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            required: true
        },
        invoiceNumber: {
            type: String,
            required: true
        },
        invoiceDate: {
            type: Date,
            required: true
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                },
                rate: {
                    type: Number,
                    required: true
                },
                taxableAmount: {
                    type: Number,
                    required: true
                },
                gstPercent: {
                    type: Number,
                    default: 0
                },
                gstAmount: {
                    type: Number,
                    default: 0
                },
                total: {
                    type: Number,
                    required: true
                }
            }
        ],
        subTotal: {
            type: Number,
            required: true
        },
        totalTax: {
            type: Number,
            required: true
        },
        grandTotal: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: Object.values(PurchaseStatus),
            default: PurchaseStatus.COMPLETED
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        notes: { type: String }
    },
    { timestamps: true }
);

purchaseSchema.index({ supplierId: 1, invoiceDate: -1 });
purchaseSchema.index({ purchaseNumber: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
