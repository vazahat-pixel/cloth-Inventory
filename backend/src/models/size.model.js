const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true
  },
  label: {
    type: String,
    trim: true
  },
  sequence: {
    type: Number,
    default: 0
  },
  group: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

sizeSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Size', sizeSchema);
