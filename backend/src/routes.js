/**
 * routes.js — Central route loader for Logic ERP parity system
 */
const authRoutes = require('./modules/auth/auth.routes');
const groupRoutes = require('./modules/groups/group.routes');
const itemRoutes = require('./modules/items/item.routes');
const importRoutes = require('./modules/import/import.routes');
const gstRoutes = require('./modules/gst/gst.routes');
const setupRoutes = require('./modules/setup/setup.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const { requireAdmin } = require('./middlewares/role.middleware');
const { activityLogger } = require('./middlewares/logger.middleware');

const registerRoutes = (app) => {
    // Global Middlewares (Security & Logging)
    app.use(activityLogger('ERP_SYSTEM')); // Global logger for activity audit

    // Auth & Identity
    app.use('/api/auth', authRoutes);

    // Logic ERP Core Modules (Strict Admin only for critical setups)
    app.use('/api/groups', requireAdmin, groupRoutes);    
    app.use('/api/import', requireAdmin, importRoutes);  
    app.use('/api/gst', requireAdmin, gstRoutes);        
    app.use('/api/setup', requireAdmin, setupRoutes);    
    
    // Both roles (Filtered by controller internal logic)
    app.use('/api/items', itemRoutes);      
    app.use('/api/inventory', inventoryRoutes); 
    app.use('/api/sales', require('./modules/sales/sales.routes'));

    // Existing ERP Modules (Role validation inside routers)
    app.use('/api/stores', require('./modules/stores/store.routes'));
    app.use('/api/warehouses', require('./modules/warehouses/warehouse.routes'));
    app.use('/api/suppliers', require('./modules/suppliers/supplier.routes'));
    app.use('/api/supplier', require('./modules/suppliers/supplier.routes')); // Singular Alias for compatibility
    app.use('/api/production', require('./modules/production/production.routes'));
    app.use('/api/products', itemRoutes); // Alias
    app.use('/api/delivery-challans', require('./modules/deliveryChallan/deliveryChallan.routes'));
    app.use('/api/purchase', require('./modules/purchase/purchase.routes'));
    app.use('/api/reports', requireAdmin, require('./modules/reports/report.routes'));
    app.use('/api/grn', require('./modules/grn/grn.routes'));
    
    // Financial & Accounting Modules
    app.use('/api/account-groups', require('./modules/accountGroups/accountGroup.routes'));
    app.use('/api/account-master', require('./modules/accountMaster/accountMaster.routes'));
    app.use('/api/accounting', require('./modules/accounting/accounting.routes'));
    app.use('/api/accounts', require('./modules/accounts/accounts.routes'));
    app.use('/api/vouchers', require('./modules/vouchers/voucher.routes'));
    app.use('/api/banks', require('./modules/banks/bank.routes'));
};

module.exports = registerRoutes;
