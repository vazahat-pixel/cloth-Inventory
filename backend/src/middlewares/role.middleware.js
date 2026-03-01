const { sendForbidden } = require('../utils/response.handler');

const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return sendForbidden(res, 'Access denied. Not authenticated.');
    if (!roles.includes(req.user.role)) return sendForbidden(res, `Access denied. Requires one of: ${roles.join(', ')}`);
    next();
};

const requireAdmin = requireRole('admin');
const requireStoreStaff = requireRole('store_staff');
const requireAny = requireRole('admin', 'store_staff');

module.exports = { requireRole, requireAdmin, requireStoreStaff, requireAny };
