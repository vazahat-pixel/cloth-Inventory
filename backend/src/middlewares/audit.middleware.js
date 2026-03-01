const AuditLog = require('../models/auditLog.model');

/**
 * createAuditLog — manual helper for creating audit entries in controllers.
 */
const createAuditLog = async ({ action, module, performedBy, targetId, targetModel, before, after, req, session }) => {
    try {
        await AuditLog.create([{
            action,
            module,
            performedBy,
            targetId,
            targetModel,
            before,
            after,
            ipAddress: req?.ip,
            userAgent: req?.headers?.['user-agent'],
            storeId: performedBy?.shopId,
        }], { session });
    } catch (err) {
        // Audit log failure should never crash the main request unless we are in a transaction
        console.error('AuditLog write failed:', err.message);
        if (session) throw err; // Re-throw if in transaction to force rollback
    }
};

/**
 * auditMiddleware factory — attach to routes for automatic logging.
 * Usage: router.post('/...', protect, auditMiddleware('CREATE_PRODUCT', 'products'), controller)
 */
const auditMiddleware = (action, module) => async (req, res, next) => {
    // Store original json() to intercept response
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
        if (data?.success && req.user) {
            await createAuditLog({ action, module, performedBy: req.user._id, req });
        }
        return originalJson(data);
    };
    next();
};

module.exports = { auditMiddleware, createAuditLog };
