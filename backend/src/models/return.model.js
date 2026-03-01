const mongoose = require('mongoose');
const { ReturnType, ReturnStatus } = require('../core/enums');

const returnSchema = new mongoose.Schema(
    {
        returnNumber: {
            type: String,
            unique: true,
            trim: true
        },
        type: {
            type: String,
            enum: Object.values(ReturnType),
            required: true
        },
        referenceSaleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sale'
        },
        creditNoteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CreditNote'
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true
        },
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
        reason: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: Object.values(ReturnStatus),
            default: ReturnStatus.APPROVED
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Indexes
// returnSchema.index({ returnNumber: 1 }); // unique: true handles this
returnSchema.index({ type: 1 });
returnSchema.index({ storeId: 1 });
returnSchema.index({ productId: 1 });
returnSchema.index({ referenceSaleId: 1 });
returnSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Return', returnSchema);
