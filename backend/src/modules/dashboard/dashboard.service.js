const mongoose = require('mongoose');
const Sale = require('../../models/sale.model');
const Purchase = require('../../models/purchase.model');
const Product = require('../../models/product.model');

/**
 * DAILY DASHBOARD SUMMARY (For HO)
 */
/**
 * DAILY DASHBOARD SUMMARY
 * Supports global (HO) and store-specific (Branch) views
 */
const getDailyDashSummary = async (user) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tonight = new Date(today);
    tonight.setHours(23, 59, 59, 999);

    const isStoreStaff = user?.role === 'store_staff';
    const shopId = user?.shopId;

    const matchTodaySale = { saleDate: { $gte: today, $lte: tonight }, isDeleted: false };
    const matchTodayPurchase = { invoiceDate: { $gte: today, $lte: tonight } };

    if (isStoreStaff && shopId) {
        matchTodaySale.storeId = new mongoose.Types.ObjectId(shopId);
        matchTodayPurchase.storeId = new mongoose.Types.ObjectId(shopId);
    }

    // 1. Today's Revenue
    const salesStats = await Sale.aggregate([
        { $match: matchTodaySale },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$grandTotal' },
                count: { $sum: 1 }
            }
        }
    ]);

    // 2. Today's Purchases (GRN / Inward)
    const purchaseStats = await Purchase.aggregate([
        { $match: matchTodayPurchase },
        {
            $group: {
                _id: null,
                totalCost: { $sum: '$grandTotal' },
                count: { $sum: 1 }
            }
        }
    ]);

    // 3. Store-wise Sales (Only for HO, Stores only see their own)
    let storeStats = [];
    if (!isStoreStaff) {
        storeStats = await Sale.aggregate([
            { $match: matchTodaySale },
            {
                $group: {
                    _id: '$storeId',
                    revenue: { $sum: '$grandTotal' }
                }
            },
            {
                $lookup: {
                    from: 'stores',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'store'
                }
            },
            { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: { $ifNull: ['$store.name', 'Walk-in/Direct'] },
                    revenue: 1
                }
            },
            { $sort: { revenue: -1 } }
        ]);
    } else {
        // For store staff, just return their current store's name and revenue
        const myRevenue = salesStats[0]?.totalRevenue || 0;
        storeStats = [{ name: user.shopName || 'My Store', revenue: myRevenue }];
    }

    // 4. Top 5 Items Today
    const topItems = await Sale.aggregate([
        { $match: matchTodaySale },
        { $unwind: '$products' },
        {
            $group: {
                _id: '$products.productId',
                qty: { $sum: '$products.quantity' },
                revenue: { $sum: '$products.total' }
            }
        },
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
                qty: 1,
                revenue: 1
            }
        },
        { $sort: { qty: -1 } },
        { $limit: 5 }
    ]);

    return {
        sales: salesStats[0] || { totalRevenue: 0, count: 0 },
        purchase: purchaseStats[0] || { totalCost: 0, count: 0 },
        storeBreakdown: storeStats,
        topItems
    };
};

module.exports = {
    getDailyDashSummary
};
