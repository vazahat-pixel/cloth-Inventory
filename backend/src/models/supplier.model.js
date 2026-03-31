const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Supplier name is required'],
            unique: true,
            trim: true
        },
        supplierCode: {
            type: String,
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
            type: String
        },
        addressLine1: { type: String, trim: true },
        addressLine2: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pincode: { type: String, trim: true },
        country: { type: String, default: 'India' },
        bankDetails: {
            type: String
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AccountGroup'
        },
        gstNumber: {
            type: String,
            trim: true
        },
        panNo: { type: String, trim: true },
        openingBalance: { type: Number, default: 0 },
        creditDays: { type: Number, default: 0 },
        supplierType: { 
            type: String, 
            enum: ['General', 'Fabric', 'Trim', 'Finished Goods'],
            default: 'General'
        },
        alternatePhone: { type: String, trim: true },
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
