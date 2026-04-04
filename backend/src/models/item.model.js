const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  mrp: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  stock: {
    type: Number,
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: false,
    index: true
  },

  description: {
    type: String,
    trim: true
  },
  uom: {
    type: String,
    default: 'PCS'
  },
  type: {
    type: String,
    enum: ['GARMENT', 'ACCESSORY'],
    default: 'GARMENT',
    index: true
  },
  fabric: { type: String, trim: true },
  pattern: { type: String, trim: true },
  fit: { type: String, trim: true },
  gender: { type: String, trim: true },
  occasion: { type: String, trim: true },
  
  // Professional Raw Material (Fabric) Specs
  composition: { type: String, trim: true }, // e.g. 100% Cotton
  gsm: { type: String, trim: true },         // e.g. 180 GSM
  width: { type: String, trim: true },       // e.g. 58 inches
  shrinkage: { type: String, trim: true },   // e.g. 2%
  shadeNo: { type: String, trim: true },     // e.g. SH-402
  
  // Professional Accessory Specs
  accessorySize: { type: String, trim: true }, // e.g. 18L, 24L
  packingType: { type: String, trim: true },   // e.g. Roll, Gross, Box
  
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  },
  styleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  },
  groupIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  }],
  hsCodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'HSNCode', index: true },
  gstPercent: { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  vendorId: {
    type: String,
    trim: true
  },
  // Inventory & Defaults

  defaultWarehouse: { type: String, trim: true },
  reorderLevel: { type: Number, default: 0 },
  reorderQty: { type: Number, default: 0 },
  openingStock: { type: Number, default: 0 },
  openingStockRate: { type: Number, default: 0 },
  stockTrackingEnabled: { type: Boolean, default: true },
  barcodeEnabled: { type: Boolean, default: true },
  images: {
    type: [String],
    default: []
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
