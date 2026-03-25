const mongoose = require('mongoose');
const { DocumentType, DocumentStatus } = require('../core/enums');

const documentItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' // Or Variant if applicable
    },
    orderedQty: {
        type: Number,
        default: 0
    },
    receivedQty: {
        type: Number,
        default: 0
    },
    approvedQty: {
        type: Number,
        default: 0
    },
    rejectedQty: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        default: 0
    }
}, { _id: false });

const documentSchema = new mongoose.Schema(
    {
        documentNumber: {
            type: String,
            unique: true,
            trim: true
        },
        type: {
            type: String,
            enum: Object.values(DocumentType),
            required: true
        },
        status: {
            type: String,
            enum: Object.values(DocumentStatus),
            default: DocumentStatus.DRAFT
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId
        },
        referenceType: {
            type: String
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store'
        },
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse'
        },
        entityName: {
            type: String,
            trim: true // Searchable name for supplier/customer
        },
        items: [documentItemSchema],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: {
            type: String
        },
        attachments: [
            {
                url: String,
                fileName: String,
                fileType: String
            }
        ],
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Indexes
documentSchema.index({ type: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ branchId: 1 });
documentSchema.index({ warehouseId: 1 });
documentSchema.index({ documentNumber: 1 });
documentSchema.index({ entityName: 1 });

module.exports = mongoose.model('Document', documentSchema);
