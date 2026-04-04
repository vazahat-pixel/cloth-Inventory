const mongoose = require('mongoose');

const hsnCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'HSN Code is required'],
            unique: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        gstPercent: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// HSN Indexing is handled by unique: true on the code field

module.exports = mongoose.model('HSNCode', hsnCodeSchema);
