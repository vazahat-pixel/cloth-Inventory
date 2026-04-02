const mongoose = require('mongoose');
const StoreInventory = require('../../models/storeInventory.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const Product = require('../../models/product.model');

/**
 * Get store inventory with pagination and filters
 */
const getStoreInventory = async (query, user) => {
    const { page = 1, limit = 1000, search, storeId, lowStock } = query;
    const Item = require('../../models/item.model');

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

    const [storeItems, warehouseItems, allStores, allWarehouses] = await Promise.all([
        StoreInventory.find(storeFilter).lean(),
        WarehouseInventory.find(warehouseFilter).lean(),
        require('../../models/store.model').find({}).select('name').lean(),
        require('../../models/warehouse.model').find({}).select('name').lean()
    ]);

    const storeMap = new Map(allStores.map(s => [s._id.toString(), s.name]));
    const whMap = new Map(allWarehouses.map(w => [w._id.toString(), w.name]));

    // 3. Extract unique variant IDs
    const variantIds = [...new Set([
        ...storeItems.map(si => si.productId.toString()),
        ...warehouseItems.map(wi => wi.productId.toString())
    ])];

    // 4. Fetch Parent Master Items
    const searchFilter = { "sizes._id": { $in: variantIds } };
    if (search) {
        const regex = new RegExp(search, 'i');
        searchFilter.$or = [
            { itemName: regex },
            { itemCode: regex },
            { "sizes.sku": regex }
        ];
    }

    const masterItems = await Item.find(searchFilter)
        .populate('brand', 'name')
        .populate('groupIds', 'name')
        .lean();

    // 5. Fetch In Transit quantities
    const Dispatch = require('../../models/dispatch.model');
    const inTransitRecords = await Dispatch.find({ 
        status: 'DISPATCHED',
        "items.variantId": { $in: variantIds }
    }).lean();

    const transitMap = new Map();
    inTransitRecords.forEach(d => {
        d.items.forEach(item => {
            const key = item.variantId.toString();
            transitMap.set(key, (transitMap.get(key) || 0) + item.qty);
        });
    });

    // 6. Flatten and Map
    const rows = [];
    
    // Map Store Inventory
    storeItems.forEach(si => {
        const parent = masterItems.find(m => m.sizes.some(s => s._id.toString() === si.productId.toString()));
        if (!parent) return;
        const variant = parent.sizes.find(s => s._id.toString() === si.productId.toString());
        const available = si.quantityAvailable || 0;
        const reorder = parent.reorderLevel || 0;
        
        rows.push({
            id: si._id,
            itemCode: parent.itemCode,
            itemName: parent.itemName,
            size: variant.size,
            sku: variant.sku,
            color: parent.shade || '--',
            locationName: storeMap.get(si.storeId.toString()) || 'Unknown Store',
            locationId: si.storeId,
            locationType: 'STORE',
            availableStock: available,
            reservedStock: 0,
            inTransit: 0, // Transit is from WH to Store, so it shows on WH side or globally
            reorderLevel: reorder,
            status: available <= 0 ? 'Out_Of_Stock' : (available <= reorder ? 'Low_Stock' : 'Active')
        });
    });

    // Map Warehouse Inventory
    warehouseItems.forEach(wi => {
        const parent = masterItems.find(m => m.sizes.some(s => s._id.toString() === wi.productId.toString()));
        if (!parent) return;
        const variant = parent.sizes.find(s => s._id.toString() === wi.productId.toString());
        const available = wi.quantity || 0;
        const reorder = parent.reorderLevel || 0;
        const transit = transitMap.get(wi.productId.toString()) || 0;

        rows.push({
            id: wi._id,
            itemCode: parent.itemCode,
            itemName: parent.itemName,
            size: variant.size,
            sku: variant.sku,
            color: parent.shade || '--',
            locationName: whMap.get(wi.warehouseId.toString()) || 'Unknown Warehouse',
            locationId: wi.warehouseId,
            locationType: 'WAREHOUSE',
            availableStock: available,
            reservedStock: wi.reservedQuantity || 0,
            inTransit: transit,
            reorderLevel: reorder,
            status: available <= 0 ? 'Out_Of_Stock' : (available <= reorder ? 'Low_Stock' : 'Active')
        });
    });

    const total = rows.length;
    const skip = (page - 1) * limit;
    const paginated = rows.slice(skip, skip + parseInt(limit));

    return {
        inventory: paginated,
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
