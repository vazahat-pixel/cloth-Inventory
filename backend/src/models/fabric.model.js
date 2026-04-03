const mongoose = require('mongoose');

const fabricSchema = new mongoose.Schema(
    {
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            required: [true, 'Supplier is required']
        },
        fabricType: {
            type: String,
            required: [true, 'Fabric type is required'],
            trim: true
        }, // e.g. Cotton, Denim
        color: {
            type: String,
            trim: true
        },
        gsm: {
            type: Number,
            trim: true
        },
        purchaseDate: {
            type: Date,
            default: Date.now,
            required: true
        },
        invoiceNumber: {
            type: String,
            required: true,
            trim: true
        },
        meterPurchased: {
            type: Number,
            required: [true, 'Meter purchased is required'],
            min: [0, 'Meter purchased cannot be negative']
        },
        meterAvailable: {
            type: Number,
            required: true,
            min: [0, 'Meter available cannot be negative']
        },
        ratePerMeter: {
            type: Number,
            required: [true, 'Rate per meter is required'],
            min: [0, 'Rate cannot be negative']
        },
        totalAmount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'CONSUMED'],
            default: 'ACTIVE'
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
        taxAmount: {
            type: Number,
            default: 0
        },
        grandTotal: {
            type: Number,
            default: 0
        },
        notes: { type: String },
    },
    { timestamps: true }
);

// Calculate totalAmount before saving
fabricSchema.pre('validate', function (next) {
    if (this.meterPurchased && this.ratePerMeter) {
        this.totalAmount = this.meterPurchased * this.ratePerMeter;
    }
    if (this.isNew || this.isModified('meterPurchased')) {
        if (this.meterAvailable === undefined || this.isNew) {
            this.meterAvailable = this.meterPurchased;
        }
    }
    next();
});

// Indexes
fabricSchema.index({ supplierId: 1 });
fabricSchema.index({ purchaseDate: -1 });
fabricSchema.index({ fabricType: 1 });
fabricSchema.index({ isDeleted: 1 });
fabricSchema.index({ status: 1 });

module.exports = mongoose.model('Fabric', fabricSchema);
