const mongoose = require('mongoose');

const purchaseReturnSchema = new mongoose.Schema({
  returnNumber: {
    type: String,
    required: true,
    unique: true
  },
  purchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  locationType: {
    type: String,
    enum: ['WAREHOUSE', 'STORE'],
    required: true
  },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
      variantId: { type: String }, // To link to specific size/color SKU
      quantity: { type: Number, required: true },
      rate: { type: Number, required: true },
      taxPercent: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
      reason: String
    }
  ],
  subTotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT'
  },
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountingVoucher'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);
