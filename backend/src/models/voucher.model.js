const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
    {
        voucherNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
        initialValue: { type: Number, required: true },
        remainingValue: { type: Number, required: true },
        expiryDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ['ACTIVE', 'EXPIRED', 'USED', 'CANCELLED'],
            default: 'ACTIVE'
        },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        issuedDate: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Voucher', voucherSchema);
