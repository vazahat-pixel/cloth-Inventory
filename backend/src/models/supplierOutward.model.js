const mongoose = require('mongoose');

const supplierOutwardSchema = new mongoose.Schema({
    outwardNumber: {
        type: String,
        required: true,
        unique: true
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    items: [{
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true
        },
        code: String, // Material Code / Roll #
        quantity: {
            type: Number,
            required: true,
            min: 0.1
        },
        uom: String
    }],
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
        default: 'COMPLETED'
    },
    outwardDate: {
        type: Date,
        default: Date.now
    },
    targetItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: false
    },
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('SupplierOutward', supplierOutwardSchema);
