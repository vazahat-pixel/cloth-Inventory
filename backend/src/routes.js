/**
 * routes.js — Central route loader
 */

const authRoutes = require('./modules/auth/auth.routes');

const registerRoutes = (app) => {
    app.use('/api/auth', authRoutes);
    app.use('/api/stores', require('./modules/stores/store.routes'));
    app.use('/api/warehouses', require('./modules/warehouses/warehouse.routes'));
    app.use('/api/suppliers', require('./modules/suppliers/supplier.routes'));
    app.use('/api/fabrics', require('./modules/fabrics/fabric.routes'));
    app.use('/api/production', require('./modules/production/production.routes'));
    app.use('/api/products', require('./modules/products/product.routes'));
    app.use('/api/barcodes', require('./modules/barcodes/barcode.routes'));
    app.use('/api/dispatch', require('./modules/dispatch/dispatch.routes'));
    app.use('/api/store-inventory', require('./modules/storeInventory/storeInventory.routes'));
    app.use('/api/sales', require('./modules/sales/sales.routes'));
    app.use('/api/returns', require('./modules/returns/return.routes'));
    app.use('/api/customers', require('./modules/customers/customer.routes'));
    app.use('/api/reports', require('./modules/reports/report.routes'));
    app.use('/api/dashboard', require('./modules/dashboard/dashboard.routes'));
    app.use('/api/categories', require('./modules/categories/category.routes'));
    app.use('/api/gst', require('./modules/gst/gst.routes'));
    app.use('/api/purchase', require('./modules/purchase/purchase.routes'));
    app.use('/api/purchase-orders', require('./modules/purchaseOrder/purchaseOrder.routes'));
    app.use('/api/pricing', require('./modules/pricing/pricing.routes'));
    app.use('/api/schemes', require('./modules/schemes/scheme.routes'));
    app.use('/api/coupons', require('./modules/coupons/coupon.routes'));
    app.use('/api/vouchers', require('./modules/vouchers/voucher.routes'));
    app.use('/api/accounts', require('./modules/accounts/accounts.routes'));
    app.use('/api/settings', require('./modules/settings/settings.routes'));
    app.use('/api/brands', require('./modules/brands/brand.routes'));
    app.use('/api/banks', require('./modules/banks/bank.routes'));
    app.use('/api/account-groups', require('./modules/accountGroups/accountGroup.routes'));
    app.use('/api/hsn-codes', require('./modules/hsnCode/hsnCode.routes'));
    app.use('/api/account-master', require('./modules/accountMaster/accountMaster.routes'));
    app.use('/api/counters', require('./modules/billingCounter/billingCounter.routes'));
    app.use('/api/documents', require('./modules/documents/document.routes'));
    app.use('/api/grn', require('./modules/grn/grn.routes'));
    app.use('/api/qc', require('./modules/qc/qc.routes'));
    app.use('/api/stock', require('./modules/stock/stock.routes'));
    app.use('/api/approval', require('./modules/approval/approval.routes'));
    app.use('/api/config', require('./modules/systemConfig/systemConfig.routes'));
    app.use('/api/notifications', require('./modules/notifications/notification.routes'));
    app.use('/api/rbac', require('./modules/rbac/rbac.routes'));
};

module.exports = registerRoutes;
