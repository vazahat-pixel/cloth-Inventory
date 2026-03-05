const mongoose = require('mongoose');

const bankTransactionSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ['PAYMENT', 'RECEIPT'], required: true },
        bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank', required: true },
        supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        date: { type: Date, default: Date.now },
        chequeNo: { type: String },
        amount: { type: Number, required: true },
        narration: { type: String },
        allocatedBills: [{
            purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
            saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
            allocated: { type: Number }
        }],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('BankTransaction', bankTransactionSchema);
