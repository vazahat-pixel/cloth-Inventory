const mongoose = require('mongoose');

const formulaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  // Template format: {fabric} + " " + {design} + " " + {shade} + " " + {item_code}
  formula: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Formula', formulaSchema);
