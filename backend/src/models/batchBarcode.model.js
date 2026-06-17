const mongoose = require('mongoose');

const batchBarcodeSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: true,
    index: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  batchNo: {
    type: String,
    required: true
  },
  grnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GRN',
  },
  itemCode: { type: String, trim: true },
  itemName: { type: String, trim: true },
  printCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BatchBarcode', batchBarcodeSchema);
