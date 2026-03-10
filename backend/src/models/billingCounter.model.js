const mongoose = require('mongoose');

const billingCounterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('BillingCounter', billingCounterSchema);
