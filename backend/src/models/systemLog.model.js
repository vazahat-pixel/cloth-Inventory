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
      'GRN',
      'Barcode',
      'Inventory',
      'Transfer',
      'Sales',
      'Accounting',
      'Groups',
      'Import',
      'GST',
      'Stores',
      'Warehouses',
      'Suppliers',
      'Production',
      'REPORTS',
      'AUTH',
      'SALES'
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
