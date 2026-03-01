const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Supplier name is required'],
            unique: true,
            trim: true
        },
        contactPerson: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            lowercase: true,
            trim: true
        },
        address: {
            street: String,
            city: String,
            state: String,
            pincode: String,
        },
        gstNumber: {
            type: String,
            trim: true
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
        notes: { type: String },
    },
    { timestamps: true }
);

// Indexes
supplierSchema.index({ name: 'text', email: 'text' });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
