const mongoose = require('mongoose');

const batchBarcodeSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  batchNo: {
    type: String,
    required: true
  },
  grnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase', // GRN is current Purchase with grnStatus APPROVED
    required: true
  },
  printCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BatchBarcode', batchBarcodeSchema);
