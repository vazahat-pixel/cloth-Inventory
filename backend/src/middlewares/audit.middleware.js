const SystemLog = require('../models/systemLog.model');

/**
 * createAuditLog — manual helper for creating system-wide audit entries.
 */
const createAuditLog = async ({ action, module, performedBy, details, req, session }) => {
    try {
        await SystemLog.create([{
            action,
            module,
            userId: performedBy,
            details,
            ipAddress: req?.ip,
            userAgent: req?.headers?.['user-agent']
        }], { session });
    } catch (err) {
        console.error('SystemLog write failed:', err.message);
        if (session) throw err; 
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
