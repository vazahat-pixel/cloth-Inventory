const mongoose = require('mongoose');

const workflowLogSchema = new mongoose.Schema(
    {
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        documentType: {
            type: String,
            required: true,
            enum: ['PURCHASE', 'PO', 'GRN', 'QC', 'STOCK_UPDATE', 'SALE']
        },
        fromStatus: {
            type: String,
            default: null
        },
        toStatus: {
            type: String,
            required: true
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        notes: {
            type: String,
            trim: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('WorkflowLog', workflowLogSchema);
