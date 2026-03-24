const Sale = require('../../models/sale.model');
const Product = require('../../models/product.model');
const StoreInventory = require('../../models/storeInventory.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');

/**
 * Summary: Sales Today & Total Stock Metrics
 */
const getSummary = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [salesToday, warehouseStock, storeStock] = await Promise.all([
        // Sales Today
        Sale.aggregate([
            { $match: { saleDate: { $gte: todayStart }, isDeleted: false } },
            { 
                $group: { 
                    _id: null, 
                    revenue: { $sum: '$grandTotal' },
                    count: { $sum: 1 }
                } 
            }
        ]),
        // Warehouse Stock Total
        WarehouseInventory.aggregate([
            { $group: { _id: null, totalQty: { $sum: '$quantity' } } }
        ]),
        // Store Stock Total
        StoreInventory.aggregate([
            { $group: { _id: null, totalQty: { $sum: '$quantityAvailable' } } }
        ])
    ]);

    return {
        salesToday: salesToday[0] || { revenue: 0, count: 0 },
        totalStock: (warehouseStock[0]?.totalQty || 0) + (storeStock[0]?.totalQty || 0),
        warehouseStock: warehouseStock[0]?.totalQty || 0,
        storeStock: storeStock[0]?.totalQty || 0
    };
};

/**
 * Top Selling Products (By Quantity)
 */
const getTopProducts = async (limit = 5) => {
    return await Sale.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: '$products' },
        { 
            $group: { 
                _id: '$products.productId', 
                soldQty: { $sum: '$products.quantity' },
                totalRevenue: { $sum: '$products.total' }
            } 
        },
        { $sort: { soldQty: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        { 
            $project: { 
                name: '$product.name', 
                sku: '$product.sku', 
                soldQty: 1, 
                totalRevenue: 1 
            } 
        }
    ]);
};

/**
 * Low Stock Alerts (Across all locations)
 */
const getAlerts = async () => {
    // We'll aggregate store inventory and find where total qty < minStockLevel
    const storeAlerts = await StoreInventory.aggregate([
        {
            $group: {
                _id: "$productId",
                qty: { $sum: "$quantityAvailable" }
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $project: {
                name: "$product.name",
                sku: "$product.sku",
                qty: 1,
                minStockLevel: "$product.minStockLevel",
                isLow: { $lte: ["$qty", "$product.minStockLevel"] }
            }
        },
        { $match: { isLow: true } }
    ]);

    return { storeAlerts };
};

module.exports = {
    getSummary,
    getTopProducts,
    getAlerts
};
