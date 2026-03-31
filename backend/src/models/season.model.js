const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Season name is required'],
            unique: true,
            trim: true
        },
        code: {
            type: String,
            unique: true,
            trim: true
        },
        year: {
            type: Number,
            required: [true, 'Year is required']
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

module.exports = mongoose.model('Season', seasonSchema);
