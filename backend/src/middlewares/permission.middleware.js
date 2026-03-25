const Role = require('../models/role.model');
const { sendError } = require('../utils/response.handler');

/**
 * RBAC Permission Middleware
 * Usage: router.post('/...', protect, checkPermission('purchase:create'), controller.create)
 */
const checkPermission = (requiredPermission) => async (req, res, next) => {
    try {
        if (!req.user) {
            return sendError(res, 'User session not found', 401);
        }

        const { role } = req.user;
        
        // Find permission list for the given role string
        // We can cache this for performance in a real production environment
        const roleDoc = await Role.findOne({ name: role });
        
        if (!roleDoc) {
            return sendError(res, `Permissions not configured for role: ${role}`, 403);
        }

        // Admin has full access to everything if needed or matching specific permission
        if (role === 'admin') {
            return next();
        }

        if (!roleDoc.permissions.includes(requiredPermission)) {
            return sendError(res, `Forbidden: You do not have permission to ${requiredPermission}`, 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    checkPermission
};
