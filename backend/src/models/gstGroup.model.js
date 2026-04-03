const mongoose = require('mongoose');

const gstGroupSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, unique: true },
        description: { type: String },
        status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('GstGroup', gstGroupSchema);
