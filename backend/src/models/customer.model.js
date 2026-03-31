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
        loyaltyPoints: {
            type: Number,
            default: 0
        },
        purchaseHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Sale'
            }
        ],
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

customerSchema.index({ name: 'text' });
customerSchema.index({ purchaseHistory: 1 });

module.exports = mongoose.model('Customer', customerSchema);
