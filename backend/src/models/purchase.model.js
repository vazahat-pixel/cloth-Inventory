 const mongoose = require('mongoose');
const { PurchaseStatus, GrnStatus } = require('../core/enums');

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
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: false // Optional for backward compatibility with existing data
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
                itemId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Item',
                    required: true
                },
                variantId: {
                    type: String, // Reference to Item.sizes._id
                    required: true
                },
                itemCode: { type: String },
                itemName: { type: String },
                size: { type: String },
                color: { type: String },
                sku: {
                    type: String
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
                discountPercentage: {
                    type: Number,
                    default: 0
                },
                taxPercentage: {
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
                },
                lotNumber: {
                    type: String,
                    trim: true
                },
                batchNo: {
                    type: String,
                    default: 'DEFAULT'
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
        otherCharges: {
            type: Number,
            default: 0
        },
        grandTotal: {
            type: Number,
            required: true
        },
        finalAmount: {
            type: Number,
            required: false // Calculated after discounts/charges
        },
        status: {
            type: String,
            enum: Object.values(PurchaseStatus),
            default: PurchaseStatus.DRAFT
        },
        grnStatus: {
            type: String,
            enum: Object.values(GrnStatus),
            default: GrnStatus.DRAFT
        },
        purchaseOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PurchaseOrder',
            required: false // Optional if direct purchase
        },
        grnId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GRN',
            required: false // Link to physical receipt
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

module.exports = mongoose.model('Purchase', purchaseSchema);
