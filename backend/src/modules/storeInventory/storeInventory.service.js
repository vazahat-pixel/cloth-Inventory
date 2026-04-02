const StoreInventory = require('../../models/storeInventory.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const Item = require('../../models/item.model');
const Product = require('../../models/product.model');
const mongoose = require('mongoose');

const populateInventoryManual = async (inventoryItems) => {
    if (!inventoryItems || inventoryItems.length === 0) return [];

    const variantIds = inventoryItems.map(item => item.productId).filter(Boolean);

    // Find Items containing these variations
    const items = await Item.find({ "sizes._id": { $in: variantIds } })
        .populate('brand', 'name brandName')
        .populate('groupIds', 'name groupType groupName')
        .lean();

    // Map them back
    return inventoryItems.map(item => {
        const vid = String(item.productId);
        const parentItem = items.find(it => it.sizes.some(sz => String(sz._id) === vid));
        if (parentItem) {
            const variant = parentItem.sizes.find(sz => String(sz._id) === vid);
            return {
                ...item.toObject ? item.toObject() : item,
                productId: {
                    _id: variant._id,
                    name: parentItem.itemName,
                    sku: variant.sku || parentItem.itemCode,
                    barcode: variant.barcode || variant.sku || parentItem.itemCode,
                    size: variant.size,
                    color: variant.color || parentItem.shade || 'N/A',
                    brand: parentItem.brand || { name: 'Main' },
                    category: parentItem.groupIds?.[0] || { name: 'General' },
                    salePrice: variant.salePrice || 0
                }
            };
        }
        return item;
    });
};

/**
 * Get store inventory with pagination and filters
 */
const getStoreInventory = async (query, user) => {
    const { page = 1, limit = 1000, search, storeId, lowStock } = query;

    const storeFilter = {};
    const warehouseFilter = {};

    // 1. Enforce scoping
    if (user.role === 'store_staff') {
        if (!user.shopId) throw new Error('User is not linked to any store.');
        storeFilter.storeId = user.shopId;
        // In this ERP, store_staff usually only sees their store, 
        // but we'll allow warehouse inventory for HO admins or if explicitly needed.
        warehouseFilter._id = null;
    } else if (storeId) {
        storeFilter.storeId = storeId;
        warehouseFilter.warehouseId = storeId;
    }

    if (lowStock === 'true') {
        storeFilter.$expr = { $lte: ['$quantityAvailable', '$minStockLevel'] };
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

        const pIds = products.map(p => p._id);
        storeFilter.productId = { $in: pIds };
        warehouseFilter.productId = { $in: pIds };
    }

    const skip = (page - 1) * limit;

    const [storeInventory, warehouseInventory] = await Promise.all([
        StoreInventory.find(storeFilter)
            .sort({ lastUpdated: -1 })
            .populate('storeId', 'name location')
            .lean(),
        WarehouseInventory.find(warehouseFilter)
            .sort({ lastUpdated: -1 })
            .populate('warehouseId', 'name location')
            .lean()
    ]);

    // Combine results
    const rawCombined = [...storeInventory, ...warehouseInventory];
    const populatedCombined = await populateInventoryManual(rawCombined);

    // Filter out orphaned records
    const combinedFull = populatedCombined.filter(item => item && item.productId);
    const combined = combinedFull.slice(skip, skip + parseInt(limit));
    const total = combinedFull.length;

    return {
        inventory: combined,
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
        .lean();

    if (!item) {
        throw new Error('Product not found in store inventory');
    }

    const populated = await populateInventoryManual([item]);
    return populated[0];
};

const { adjustStoreStock } = require('../../services/stock.service');
const { StockMovementType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');

const adjustInventory = async (adjustmentData, userId) => {
    return await withTransaction(async (session) => {
        const { storeId, productId, quantityChange, notes } = adjustmentData;
        const referenceId = adjustmentData.referenceId || new mongoose.Types.ObjectId();
        await adjustStoreStock({
            storeId,
            productId,
            variantId: productId,
            quantityChange,
            type: StockMovementType.ADJUSTMENT,
            referenceId,
            referenceModel: 'Adjustment',
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
