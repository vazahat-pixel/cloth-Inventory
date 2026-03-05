const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Brand name is required'],
            unique: true,
            trim: true
        },
        shortName: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Brand', brandSchema);
