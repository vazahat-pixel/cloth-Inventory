const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    qty: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['PURCHASE', 'QC_APPROVED', 'SALE', 'TRANSFER', 'RETURN', 'DAMAGED', 'ADJUSTMENT', 'GRN_RECEIPT'],
        index: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    referenceType: {
        type: String,
        required: true,
        enum: ['Purchase', 'QC', 'Sale', 'Dispatch', 'Return', 'ProductionBatch', 'Adjustment', 'Audit', 'DeliveryChallan', 'GRN']
    },
    fromLocation: {
        type: mongoose.Schema.Types.ObjectId,
        required: false, // For additions like purchase, fromLocation could be null
        index: true
    },
    toLocation: {
        type: mongoose.Schema.Types.ObjectId,
        required: false, // For deductions like sale, toLocation could be null
        index: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('StockMovement', stockMovementSchema);
