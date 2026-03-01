const mongoose = require('mongoose');
const { DispatchStatus } = require('../core/enums');

const dispatchItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const dispatchSchema = new mongoose.Schema(
    {
        dispatchNumber: {
            type: String,
            unique: true,
            trim: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: [true, 'Store reference is required']
        },
        products: [dispatchItemSchema],
        totalItems: {
            type: Number,
            default: 0
        },
        totalValue: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: Object.values(DispatchStatus),
            default: DispatchStatus.PENDING,
        },
        dispatchDate: {
            type: Date,
            default: Date.now
        },
        receivedDate: {
            type: Date
        },
        notes: {
            type: String
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

// Pre-save to calculate totals
dispatchSchema.pre('validate', function (next) {
    if (this.products && this.products.length > 0) {
        this.totalItems = this.products.reduce((sum, item) => sum + item.quantity, 0);
        this.totalValue = this.products.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }
    next();
});

// Indexes
// dispatchSchema.index({ dispatchNumber: 1 }); // unique: true handles this
dispatchSchema.index({ storeId: 1 });
dispatchSchema.index({ status: 1 });
dispatchSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Dispatch', dispatchSchema);
