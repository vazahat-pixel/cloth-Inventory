const Sale = require('../../models/sale.model');
const Product = require('../../models/product.model');
const StoreInventory = require('../../models/storeInventory.model');
const Dispatch = require('../../models/dispatch.model');
const { DispatchStatus } = require('../../core/enums');

/**
 * Get core dashboard metrics
 */
const getDashboardMetrics = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [todayRevenue, monthRevenue, factoryStock, storeStock, topProducts, lowStockCount, pendingDispatch] = await Promise.all([
        // Revenue Today
        Sale.aggregate([
            { $match: { saleDate: { $gte: todayStart }, isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
        ]),
        // Revenue This Month
        Sale.aggregate([
            { $match: { saleDate: { $gte: monthStart }, isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
        ]),
        // Factory Stock Total
        Product.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$factoryStock' } } }
        ]),
        // Store Stock Total
        StoreInventory.aggregate([
            { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
        ]),
        // Top 5 Products
        Sale.aggregate([
            { $match: { isDeleted: false } },
            { $unwind: '$products' },
            { $group: { _id: '$products.productId', count: { $sum: '$products.quantity' } } },
            { $sort: { count: -1 } },
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
            { $project: { name: '$product.name', sku: '$product.sku', count: 1 } }
        ]),
        // Low Stock Alerts Count
        Product.countDocuments({ $expr: { $lte: ['$factoryStock', '$minStockLevel'] }, isDeleted: false }),
        // Pending Dispatch Count
        Dispatch.countDocuments({ status: DispatchStatus.PENDING, isDeleted: false })
    ]);

    return {
        revenueToday: todayRevenue[0]?.total || 0,
        revenueMonth: monthRevenue[0]?.total || 0,
        factoryStock: factoryStock[0]?.total || 0,
        storeStock: storeStock[0]?.total || 0,
        topProducts,
        lowStockCount,
        pendingDispatch
    };
};

/**
 * Get Recent Sales (10)
 */
const getRecentSales = async () => {
    return await Sale.find({ isDeleted: false })
        .sort({ saleDate: -1 })
        .limit(10)
        .populate('storeId', 'name')
        .populate('cashierId', 'name');
};

module.exports = {
    getDashboardMetrics,
    getRecentSales
};
