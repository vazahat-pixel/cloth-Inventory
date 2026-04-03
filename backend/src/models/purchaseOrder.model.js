const mongoose = require('mongoose');
const { PurchaseOrderStatus } = require('../core/enums');

const purchaseOrderSchema = new mongoose.Schema({
    poNumber: {
        type: String,
        required: true,
        unique: true
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    poDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    billingAddress: { type: String },
    deliveryAddress: { type: String },
    paymentTerms: { type: String },
    subTotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    totalQty: { type: Number, default: 0 },
    notes: { type: String },
    items: [{
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true
        },
        variantId: {
            type: String, // This is the _id of the size variant
            required: true
        },
        itemCode: { type: String },
        itemName: { type: String },
        size: { type: String },
        color: { type: String },
        sku: { type: String },
        qty: {
            type: Number,
            required: true
        },
        receivedQty: {
            type: Number,
            default: 0
        },
        billedQty: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: true
        },
        discountPercent: { type: Number, default: 0 },
        taxPercent: { type: Number, default: 0 },
        remarks: { type: String }
    }],
    status: {
        type: String,
        enum: Object.values(PurchaseOrderStatus),
        default: PurchaseOrderStatus.DRAFT
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    notes: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
