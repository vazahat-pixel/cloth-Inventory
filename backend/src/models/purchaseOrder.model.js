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
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false // Optional if no variants
        },
        qty: {
            type: Number,
            required: true
        },
        receivedQty: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: true
        }
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
    notes: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
