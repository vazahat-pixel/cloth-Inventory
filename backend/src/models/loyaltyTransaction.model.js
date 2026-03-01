const mongoose = require('mongoose');
const { LoyaltyType } = require('../core/enums');

const loyaltyTransactionSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true
        },
        saleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sale'
        },
        type: {
            type: String,
            enum: Object.values(LoyaltyType),
            required: true
        },
        points: {
            type: Number,
            required: true
        },
        referenceNumber: {
            type: String
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

loyaltyTransactionSchema.index({ customerId: 1 });
loyaltyTransactionSchema.index({ saleId: 1 });

module.exports = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);
