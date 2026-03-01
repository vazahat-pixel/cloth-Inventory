const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        action: { type: String, required: true },          // e.g. 'CREATE_SALE', 'UPDATE_PRODUCT'
        module: { type: String, required: true },          // e.g. 'sales', 'products'
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        targetId: { type: mongoose.Schema.Types.ObjectId }, // The affected document
        targetModel: { type: String },                      // Model name
        before: { type: mongoose.Schema.Types.Mixed },     // State before change
        after: { type: mongoose.Schema.Types.Mixed },      // State after change
        ipAddress: { type: String },
        userAgent: { type: String },
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    },
    {
        timestamps: true,
        // Keep audit logs for a long time — don't expire
    }
);

// Index for fast queries by action, module, and user
auditLogSchema.index({ action: 1, module: 1, performedBy: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
