const mongoose = require('mongoose');
const { CreditNoteStatus } = require('../core/enums');

const creditNoteSchema = new mongoose.Schema(
    {
        creditNoteNumber: {
            type: String,
            required: true,
            unique: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true
        },
        referenceReturnId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Return'
        },
        saleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sale'
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        remainingAmount: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: Object.values(CreditNoteStatus),
            default: CreditNoteStatus.ACTIVE
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: { type: String }
    },
    { timestamps: true }
);

creditNoteSchema.index({ customerId: 1 });
creditNoteSchema.index({ creditNoteNumber: 1 });
creditNoteSchema.index({ status: 1 });

module.exports = mongoose.model('CreditNote', creditNoteSchema);
