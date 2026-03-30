const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  label: {
    type: String,
    required: true
  },
  fieldType: {
    type: String,
    enum: ['text', 'number', 'date', 'select', 'boolean'],
    default: 'text'
  },
  options: [String], // for select field
  module: {
    type: String,
    enum: ['Item', 'Group', 'Purchase', 'Sales'],
    default: 'Item'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomField', customFieldSchema);
