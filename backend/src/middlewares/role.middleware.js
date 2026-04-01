const { sendForbidden } = require('../utils/response.handler');

const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return sendForbidden(res, 'Access denied. Not authenticated.');
    const userRole = (req.user.role || '').toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());
    if (!allowedRoles.includes(userRole)) return sendForbidden(res, `Access denied. Requires one of: ${roles.join(', ')}`);
    next();
};

const requireAdmin = requireRole('admin');
const requireStoreStaff = requireRole('store_staff');
const requireAny = requireRole('admin', 'store_staff');

module.exports = { requireRole, requireAdmin, requireStoreStaff, requireAny };
