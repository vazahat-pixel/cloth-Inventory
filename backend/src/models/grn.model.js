const mongoose = require('mongoose');
const { GrnStatus } = require('../core/enums');

const grnItemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    variantId: {
        type: String, // This is the _id of the size variant in the Item.sizes array
        required: true
    },
    sku: {
        type: String,
        required: true
    },
    receivedQty: {
        type: Number,
        required: true,
        min: 1
    },
    costPrice: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    batchNumber: {
        type: String,
        trim: true
    },
    size: String,
    color: String,
    tax: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    }
}, { _id: false });

const grnSchema = new mongoose.Schema(
    {
        grnNumber: {
            type: String,
            unique: true,
            trim: true
        },
        purchaseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Purchase',
            required: false // Optional if PO is used
        },
        purchaseOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PurchaseOrder',
            required: false
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
        invoiceNumber: {
            type: String,
            trim: true
        },
        invoiceDate: {
            type: Date
        },
        remarks: {
            type: String,
            trim: true
        },
        items: [grnItemSchema],
        status: {
            type: String,
            enum: Object.values(GrnStatus),
            default: GrnStatus.PENDING
        },
        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        receivedAt: {
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

grnSchema.index({ purchaseId: 1 });
grnSchema.index({ status: 1 });

module.exports = mongoose.model('GRN', grnSchema);
