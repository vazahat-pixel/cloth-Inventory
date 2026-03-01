/**
 * permissions.js — Permission maps per role
 */

const { Roles } = require('./enums');

const PERMISSIONS = {
    [Roles.ADMIN]: [
        'products:read', 'products:write', 'products:delete',
        'stock:read', 'stock:write',
        'production:read', 'production:write',
        'dispatch:read', 'dispatch:write',
        'stores:read', 'stores:write',
        'sales:read', 'sales:write',
        'reports:read',
        'users:read', 'users:write',
        'suppliers:read', 'suppliers:write',
        'fabrics:read', 'fabrics:write',
        'auditLogs:read',
    ],
    [Roles.STORE_STAFF]: [
        'products:read',
        'stock:read', 'stock:write',
        'sales:read', 'sales:write',
        'returns:read', 'returns:write',
    ],
};

const hasPermission = (role, permission) => {
    const rolePermissions = PERMISSIONS[role] || [];
    return rolePermissions.includes(permission);
};

module.exports = { PERMISSIONS, hasPermission };
