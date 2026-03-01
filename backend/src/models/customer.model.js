const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            trim: true
        },
        email: {
            type: String,
            lowercase: true,
            trim: true
        },
        address: { type: String },
        points: {
            type: Number,
            default: 0
        },
        totalEarned: {
            type: Number,
            default: 0
        },
        totalRedeemed: {
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

customerSchema.index({ phone: 1 });
customerSchema.index({ name: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
