const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
    ruleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ApprovalRule',
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true // The Sale/Purchase/QC being approved
    },
    targetModel: {
        type: String,
        required: true // 'Sale', 'Purchase', etc.
    },
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
