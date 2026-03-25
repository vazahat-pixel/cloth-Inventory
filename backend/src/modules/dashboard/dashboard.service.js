const Sale = require('../../models/sale.model');
const Product = require('../../models/product.model');
const StoreInventory = require('../../models/storeInventory.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const ApprovalRequest = require('../../models/approvalRequest.model');

/**
 * EXECUTIVE DASHBOARD INSIGHTS
 * 1. Total Sales Today
 * 2. Total Stock Value
 * 3. Low Stock Alerts
 * 4. Top Selling Products
 */
const getDashboardStats = async (storeId = null) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Total Sales Today
    const saleQuery = { saleDate: { $gte: today }, isDeleted: false };
    if (storeId) saleQuery.storeId = storeId;
    const salesToday = await Sale.aggregate([
        { $match: saleQuery },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);
    // 2. Stock Value (Cost Price based)
    const productStats = await Product.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$costPrice', '$factoryStock'] } } } }
    ]);
    // 3. Low Stock Count
    const lowStockAlerts = await StoreInventory.countDocuments({
        $expr: { $lte: ['$quantityAvailable', '$minStockLevel'] }
    });
    // 4. Pending Approvals Count
    const pendingApprovals = await ApprovalRequest.countDocuments({ status: 'PENDING' });
    // 5. Top 5 Products
    const topProducts = await Sale.aggregate([
        { $match: { isDeleted: false } }, // Global top
        { $unwind: '$products' },
        { $group: { _id: '$products.productId', totalQty: { $sum: '$products.quantity' } } },
        { $sort: { totalQty: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        { $project: { name: '$product.name', sku: '$product.sku', totalQty: 1 } }
    ]);

    return {
        revenueToday: salesToday[0]?.total || 0,
        salesCountToday: salesToday[0]?.count || 0,
        inventoryValue: productStats[0]?.totalValue || 0,
        lowStockAlerts,
        pendingApprovals,
        topProducts
    };
};

module.exports = {
    getDashboardStats
};
