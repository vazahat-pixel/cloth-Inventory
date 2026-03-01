const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Store name is required'],
            unique: true,
            trim: true
        },
        storeCode: {
            type: String,
            unique: true,
            uppercase: true,
            trim: true
        },
        managerName: {
            type: String,
            required: [true, 'Manager name is required'],
            trim: true
        },
        managerPhone: {
            type: String,
            required: [true, 'Manager phone is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true
        },
        location: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: String,
        },
        gstNumber: {
            type: String,
            trim: true,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
    },
    {
        timestamps: true
    }
);

// Indexes for search performance
storeSchema.index({ name: 'text', 'location.city': 'text', 'location.state': 'text' });
// storeSchema.index({ storeCode: 1 }); // unique: true handles this
storeSchema.index({ isActive: 1 });
storeSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Store', storeSchema);
