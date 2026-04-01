const SystemLog = require('../models/systemLog.model');

/**
 * createAuditLog — manual helper for creating system-wide audit entries.
 */
const createAuditLog = async ({ action, module, performedBy, details, req, session }) => {
    try {
        // Normalize module to match enum: 'PURCHASE' -> 'Purchase', 'GRN' stays 'GRN', etc.
        const enumValues = [
            'ERP_SYSTEM', 'Setup', 'Item', 'Purchase', 'GRN', 'Barcode',
            'Inventory', 'Transfer', 'Sales', 'Accounting', 'Groups',
            'Import', 'GST', 'Stores', 'Warehouses', 'Suppliers',
            'Production', 'Reports', 'Auth'
        ];
        // Find case-insensitive match in enum, fallback to 'ERP_SYSTEM'
        const normalizedModule = enumValues.find(
            v => v.toUpperCase() === (module || '').toUpperCase()
        ) || 'ERP_SYSTEM';

        await SystemLog.create([{
            action,
            module: normalizedModule,
            userId: performedBy,
            details,
            ipAddress: req?.ip,
            userAgent: req?.headers?.['user-agent']
        }], { session });
    } catch (err) {
        // IMPORTANT: Audit log failure must NEVER fail the main business transaction.
        // Log the error but do not re-throw — the purchase/GRN must still save.
        console.error('SystemLog write failed:', err.message);
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
