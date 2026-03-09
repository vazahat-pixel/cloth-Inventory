const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema(
    {
        poNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            required: true
        },
        storeId: { // Refers to the physical Warehouse/Store the PO is destined for
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: true
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },
                rate: {
                    type: Number,
                    required: true
                }
            }
        ],
        status: {
            type: String,
            enum: ['DRAFT', 'SENT', 'RECEIVED', 'CANCELLED'],
            default: 'DRAFT'
        },
        poDate: {
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
        }
    },
    { timestamps: true }
);

purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ supplierId: 1 });
purchaseOrderSchema.index({ storeId: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
