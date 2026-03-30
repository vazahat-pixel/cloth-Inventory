const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  mrp: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true }); // Use _id for each variant

const itemSchema = new mongoose.Schema({
  itemCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  shade: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  groupIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  }],
  hsCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HsnCode'
  },
  gstTax: {
    type: Number,
    min: 0,
    max: 100
  },
  vendorId: {
    type: String,
    trim: true
  },
  session: {
    type: String,
    trim: true
  },
  // Dynamic Attributes
  attributes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Custom Fields (C.F. System)
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Size + Pack Matrix
  sizes: {
    type: [variantSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one size variant is required'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Full-text search on code and name
itemSchema.index({ itemName: 'text', itemCode: 'text', shade: 'text' });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
