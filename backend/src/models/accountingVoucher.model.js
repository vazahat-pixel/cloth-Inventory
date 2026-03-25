const mongoose = require('mongoose');

const accountingVoucherSchema = new mongoose.Schema(
    {
        voucherNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        type: {
            type: String,
            enum: [
                'JOURNAL', 
                'CREDIT_NOTE', 
                'DEBIT_NOTE', 
                'BANK_RECEIPT', 
                'BANK_PAYMENT', 
                'CASH_RECEIPT', 
                'CASH_PAYMENT'
            ],
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        referenceId: {
            type: String, // To link with external reference numbers (Bank Ref, Invoice No)
            trim: true
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId, // Supplier or Customer ID if needed
            refPath: 'entityModel'
        },
        entityModel: {
            type: String,
            enum: ['Supplier', 'Customer', null]
        },
        status: {
            type: String,
            enum: ['DRAFT', 'POSTED', 'CANCELLED'],
            default: 'DRAFT'
        },
        entries: [
            {
                accountId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Account',
                    required: true
                },
                debit: { type: Number, default: 0 },
                credit: { type: Number, default: 0 },
                narration: String
            }
        ],
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        narration: {
            type: String,
            trim: true
        },
        attachments: [
            {
                url: String,
                fileName: String,
                fileType: String
            }
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

accountingVoucherSchema.index({ voucherNumber: 1 });
accountingVoucherSchema.index({ type: 1 });
accountingVoucherSchema.index({ status: 1 });
accountingVoucherSchema.index({ date: 1 });

module.exports = mongoose.model('AccountingVoucher', accountingVoucherSchema);
