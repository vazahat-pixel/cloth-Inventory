const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    index: true
  },
  barcode: {
    type: String,
    required: true,
    index: true
  },
  batchNo: {
    type: String,
    default: 'DEFAULT'
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  locationType: {
    type: String,
    enum: ['STORE', 'WAREHOUSE'],
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['IN', 'OUT'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    enum: ['GRN', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'PURCHASE_RETURN', 'SALES_RETURN', 'DELIVERYCHALLAN', 'SUPPLIER_OUTWARD', 'PRODUCTION_RECEIPT'],
    required: true
  },
  referenceId: {
    type: String, // ID of GRN, Sale etc.
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate balance per item/barcode/location/batch
stockLedgerSchema.index({ itemId: 1, barcode: 1, locationId: 1, batchNo: 1, createdAt: -1 });

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
