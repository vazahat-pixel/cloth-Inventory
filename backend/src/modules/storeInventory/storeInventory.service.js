const StoreInventory = require('../../models/storeInventory.model');
const Product = require('../../models/product.model');

/**
 * Get store inventory with pagination and filters
 */
const getStoreInventory = async (query, user) => {
    const { page = 1, limit = 10, search, storeId, lowStock } = query;

    const filter = {};
    if (storeId) filter.storeId = storeId;

    if (lowStock === 'true') {
        filter.$expr = { $lte: ['$quantityAvailable', '$minStockLevel'] };
    }

    // If search exists, find matching product IDs first
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        const products = await Product.find({
            $or: [
                { name: searchRegex },
                { sku: searchRegex },
                { barcode: searchRegex }
            ]
        }).select('_id');

        filter.productId = { $in: products.map(p => p._id) };
    }

    const skip = (page - 1) * limit;

    const [inventory, total] = await Promise.all([
        StoreInventory.find(filter)
            .sort({ lastUpdated: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('storeId', 'name location')
            .populate('productId', 'name sku barcode size color category salePrice'),
        StoreInventory.countDocuments(filter)
    ]);

    return {
        inventory,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
    };
};

/**
 * Get specific product in store inventory
 */
const getProductInStore = async (storeId, productId) => {
    const item = await StoreInventory.findOne({ storeId, productId })
        .populate('storeId', 'name')
        .populate('productId');

    if (!item) {
        throw new Error('Product not found in store inventory');
    }
    return item;
};

const { adjustStoreStock } = require('../../services/stock.service');
const { StockHistoryType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');

const adjustInventory = async (adjustmentData, userId) => {
    return await withTransaction(async (session) => {
        const { storeId, productId, quantityChange, notes } = adjustmentData;
        await adjustStoreStock({
            storeId,
            productId,
            quantityChange,
            type: StockHistoryType.ADJUSTMENT,
            notes: notes || 'Manual Stock Adjustment',
            performedBy: userId,
            session
        });
        return { success: true };
    });
};

module.exports = {
    getStoreInventory,
    getProductInStore,
    adjustInventory
};
