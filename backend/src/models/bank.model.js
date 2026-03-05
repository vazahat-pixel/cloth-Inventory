const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Bank name is required'],
            trim: true
        },
        accountNumber: {
            type: String,
            required: [true, 'Account number is required'],
            unique: true,
            trim: true
        },
        branch: {
            type: String,
            trim: true
        },
        ifsc: {
            type: String,
            trim: true
        },
        balance: {
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

module.exports = mongoose.model('Bank', bankSchema);
