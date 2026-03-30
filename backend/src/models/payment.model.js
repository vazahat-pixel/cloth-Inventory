const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['PAYABLE', 'RECEIVABLE'], // Payable = outgoing, Receivable = incoming
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    required: true,
    enum: ['Purchase', 'Sale', 'PurchaseReturn', 'SalesReturn']
  },
  partyId: {
     type: mongoose.Schema.Types.ObjectId,
     required: true, // Supplier or Customer
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CREDIT'],
    required: true
  },
  transactionDetails: {
     type: Map,
     of: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
