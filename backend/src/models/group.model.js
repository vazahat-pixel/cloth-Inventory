const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  groupType: {
    type: String,
    enum: ['Sub Section', 'Type', 'Design', 'Fabric', 'Vendor', 'Season', 'Brand', 'other'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Middleware for level calculation
groupSchema.pre('save', async function(next) {
  if (this.parentId) {
    const parent = await mongoose.model('Group').findById(this.parentId);
    if (parent) {
      this.level = parent.level + 1;
    }
  } else {
    this.level = 0;
  }
  next();
});

// For horizontal querying
groupSchema.index({ name: 1, groupType: 1 });
groupSchema.index({ parentId: 1 });

module.exports = mongoose.model('Group', groupSchema);
