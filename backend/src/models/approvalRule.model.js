const mongoose = require('mongoose');

const approvalRuleSchema = new mongoose.Schema({
    module: {
        type: String,
        required: true,
        enum: ['PURCHASE', 'SALE', 'GRN', 'QC', 'DISCOUNT']
    },
    action: {
        type: String,
        required: true // e.g., 'CREATE', 'APPLY_DISCOUNT', 'APPROVE_QC'
    },
    requiredRole: {
        type: String,
        required: true,
        enum: ['admin', 'manager', 'store_staff']
    },
    threshold: {
        type: Number,
        default: 0 // Amount for Purchase, % for Discount
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
