const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    required: true,
    enum: [
      'ERP_SYSTEM',
      'Setup',
      'Item',
      'Purchase',
      'PURCHASE',
      'GRN',
      'Barcode',
      'Inventory',
      'INVENTORY',
      'Transfer',
      'TRANSFER',
      'Sales',
      'SALE',
      'Accounting',
      'Groups',
      'Import',
      'GST',
      'Stores',
      'Warehouses',
      'Suppliers',
      'Production',
      'Reports',
      'Auth',
      'AUTH'
    ]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemLog', systemLogSchema);
