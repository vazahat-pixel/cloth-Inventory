const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  materialType: {
    type: String,
    enum: ['FABRIC', 'BASE_MATERIAL', 'YARN', 'OTHER'],
    default: 'FABRIC'
  },
  uom: {
    type: String,
    default: 'METER' // METER, KG, YARD
  },
  // Technical Specifications for Fabrics
  composition: String,
  gsm: Number,
  width: String,
  shrinkage: String,
  shadeNo: String,
  // Removed Accessory Specs as they are now in Garment Master
  
  hsnCode: String,
  gstRate: {
    type: Number,
    default: 5
  },
  openingStock: {
    type: Number,
    default: 0
  },
  currentStock: {
    type: Number,
    default: 0
  },
  reorderLevel: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Draft', 'Inactive'],
    default: 'Active'
  },
  notes: String,
  lastPurchaseDate: Date,
  lastIssueDate: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware to keep currentStock updated (basic logic)
rawMaterialSchema.pre('save', function(next) {
  if (this.isNew) {
    this.currentStock = this.openingStock;
  }
  next();
});

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
