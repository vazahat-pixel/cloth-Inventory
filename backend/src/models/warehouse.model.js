const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Warehouse name is required'],
            unique: true,
            trim: true
        },
        code: {
            type: String,
            unique: true,
            uppercase: true,
            trim: true
        },
        contactPerson: {
            type: String,
            required: [true, 'Contact person name is required'],
            trim: true
        },
        contactPhone: {
            type: String,
            required: [true, 'Contact phone is required'],
            trim: true
        },
        email: {
            type: String,
            lowercase: true,
            trim: true
        },
        location: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: String,
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
    { timestamps: true }
);

warehouseSchema.index({ name: 'text', 'location.city': 'text', 'location.state': 'text' });
warehouseSchema.index({ isActive: 1 });
warehouseSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);
