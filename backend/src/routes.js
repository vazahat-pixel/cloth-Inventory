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
const { protect } = require('./middlewares/auth.middleware');
const { activityLogger } = require('./middlewares/logger.middleware');

const registerRoutes = (app) => {
    // Global Middlewares (Security & Logging)
    app.use(activityLogger('ERP_SYSTEM')); // Global logger for activity audit

    // Auth & Identity
    app.use('/api/auth', authRoutes);
    app.use('/api/media', require('./modules/media/media.routes'));

    // Logic ERP Core Modules (Strict Admin only for critical setups)
    app.use('/api/groups', protect, requireAdmin, groupRoutes);    
    app.use('/api/import', protect, requireAdmin, importRoutes);  
    app.use('/api/gst', protect, requireAdmin, gstRoutes);        
    app.use('/api/setup', protect, requireAdmin, setupRoutes);    
    app.use('/api/sizes', protect, requireAdmin, require('./modules/sizes/size.routes.js'));    
    
    // Both roles (Filtered by controller internal logic)
    app.use('/api/items', itemRoutes);      
    app.use('/api/inventory', inventoryRoutes); 
    app.use('/api/store-inventory', protect, require('./modules/storeInventory/storeInventory.routes'));
    app.use('/api/sales', require('./modules/sales/sales.routes'));

    // Existing ERP Modules (Role validation inside routers)
    app.use('/api/stores', require('./modules/stores/store.routes'));
    app.use('/api/warehouses', require('./modules/warehouses/warehouse.routes'));
    app.use('/api/suppliers', require('./modules/suppliers/supplier.routes'));
    app.use('/api/supplier', require('./modules/suppliers/supplier.routes')); // Singular Alias for compatibility
    app.use('/api/delivery-challans', require('./modules/deliveryChallan/deliveryChallan.routes'));
    app.use('/api/purchase', require('./modules/purchase/purchase.routes'));
    app.use('/api/purchase-orders', require('./modules/purchase/purchaseOrder.routes'));
    app.use('/api/reports', require('./modules/reports/report.routes'));
    app.use('/api/grn', require('./modules/grn/grn.routes'));
    
    // Financial & Accounting Modules
    app.use('/api/account-master', require('./modules/accountMaster/accountMaster.routes'));
    app.use('/api/accounting', require('./modules/accounting/accounting.routes'));
    app.use('/api/accounts', require('./modules/accounts/accounts.routes'));
    app.use('/api/vouchers', require('./modules/vouchers/voucher.routes'));
    app.use('/api/brands', require('./modules/brands/brand.routes'));
    app.use('/api/customers', require('./modules/customers/customer.routes'));
    app.use('/api/dispatch', require('./modules/dispatch/dispatch.routes'));
    app.use('/api/dashboard', require('./modules/dashboard/dashboard.routes'));
    app.use('/api/stock-returns', require('./modules/stockReturn/stockReturn.routes'));
    app.use('/api/supplier-outward', require('./modules/supplierOutward/supplierOutward.routes'));
    app.use('/api/pricing', require('./modules/pricing/pricing.routes'));
    app.use('/api/raw-materials', require('./routes/rawMaterial.route'));
};

module.exports = registerRoutes;
