const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  stack: String,
  path: String,
  method: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
     type: Date,
     default: Date.now,
     expires: '30d' // auto-delete after 30 days
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ErrorLog', errorLogSchema);
