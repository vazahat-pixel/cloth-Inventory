const StoreInventory = require('../../models/storeInventory.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const Item = require('../../models/item.model');
const Product = require('../../models/product.model');
const mongoose = require('mongoose');

const toFiniteNumber = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
};

const populateInventoryManual = async (inventoryItems) => {
    if (!inventoryItems || inventoryItems.length === 0) return [];

    const itemIds = inventoryItems.map(item => {
        try {
            return item.itemId ? new mongoose.Types.ObjectId(String(item.itemId)) : null;
        } catch (e) {
            return null;
        }
    }).filter(Boolean);
    
    const variantIds = inventoryItems.map(item => String(item.variantId || '')).filter(Boolean);

    console.log(`[DEBUG-POPULATE] Inputs - ItemIds: ${itemIds.length}, VariantIds: ${variantIds.length}`);

    const items = await Item.find({ 
        $or: [
            { _id: { $in: itemIds } },
            { "sizes._id": { $in: variantIds.filter(v => v.length === 24) } },
            { "sizes.sku": { $in: variantIds } },
            { "sizes.barcode": { $in: variantIds } }
        ]
    }).lean();

    console.log(`[DEBUG-POPULATE] DB Results - Found ${items.length} items`);

    return inventoryItems.map(item => {
        const vid = String(item.variantId || '');
        const parentId = String(item.itemId || '');
        const barcode = String(item.barcode || '');
        
        const parentItem = items.find(it => 
            String(it._id) === parentId || 
            (it.sizes && it.sizes.some(sz => 
                String(sz._id) === vid || 
                String(sz.sku) === vid || 
                String(sz.barcode) === vid ||
                String(sz.sku) === barcode ||
                String(sz.barcode) === barcode
            ))
        );

        const type = parentItem?.type || 'GARMENT';
        
        if (!parentItem) {
            console.warn(`[DEBUG-POPULATE] ORPHAN FOUND: Barcode ${barcode}, ItemID ${parentId}, VarID ${vid}`);
        }

        if (parentItem) {
            const variant = parentItem.sizes.find(sz => 
                String(sz._id) === vid || 
                sz.sku === vid || 
                sz.barcode === vid ||
                sz.sku === barcode ||
                sz.barcode === barcode
            ) || parentItem.sizes[0] || {};
            
            return {
                ...item,
                id: item._id,
                variantId: variant._id || item.variantId,
                itemId: parentItem._id,
                itemCode: parentItem.itemCode,
                itemName: parentItem.itemName,
                type: parentItem.type || 'GARMENT',
                size: variant.size || 'UNI',
                color: variant.color || parentItem.shade || 'N/A',
                sku: variant.sku || variant.barcode || parentItem.itemCode,
                barcode: variant.barcode || variant.sku || parentItem.itemCode,
                brand: parentItem.brand || { name: 'N/A' },
                category: parentItem.groupIds?.find(g => g.groupType === 'Category') || parentItem.groupIds?.[0] || { name: 'N/A' },
                available: item.quantityAvailable ?? item.quantity,
                inTransit: item.quantityInTransit || 0,
                reorderLevel: item.reorderLevel || 0,
                location: item.warehouseId?.name || item.storeId?.name || 'Main Warehouse',
                warehouseName: item.warehouseId?.name || item.storeId?.name || 'Main Warehouse',
                salePrice: toFiniteNumber(variant.salePrice || parentItem.salePrice || variant.mrp || parentItem.mrp),
                mrp: toFiniteNumber(variant.mrp || parentItem.mrp || variant.salePrice || parentItem.salePrice)
            };
        }
        
        // Fallback for orphans so they don't disappear
        return {
            ...item,
            id: item._id,
            itemCode: barcode || 'ORPHAN',
            itemName: 'Unknown Item (' + barcode + ')',
            type: 'GARMENT', 
            size: '-',
            color: '-',
            warehouseName: item.warehouseId?.name || item.storeId?.name || 'N/A',
            available: item.quantityAvailable ?? item.quantity,
            inTransit: item.quantityInTransit || 0,
            status: 'ORPHAN'
        };
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
    const normalizedRole = (user.role || '').toLowerCase();
    const isStoreRole = normalizedRole.includes('staff') || normalizedRole.includes('manager') || normalizedRole.includes('accountant');
    
    if (isStoreRole) {
        if (!user.shopId) throw new Error('User is not linked to any store. Please contact your administrator.');
        storeFilter.storeId = user.shopId;
        warehouseFilter._id = { $exists: false }; // Hide warehouse for store staff
    } else {
        // Admin or non-store role: show all or filter by ID
        if (storeId) {
            storeFilter.storeId = storeId;
            warehouseFilter.warehouseId = storeId;
        }
    }

    if (lowStock === 'true') {
        storeFilter.$expr = { $lte: ['$quantityAvailable', '$minStockLevel'] };
    }

    // If search exists, find matching Item and Variant IDs first
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        const matchingItems = await Item.find({
            $or: [
                { itemName: searchRegex },
                { itemCode: searchRegex },
                { "sizes.sku": searchRegex },
                { "sizes.barcode": searchRegex }
            ]
        }).select('_id sizes');

        const vIds = [];
        matchingItems.forEach(it => {
            it.sizes.forEach(sz => vIds.push(String(sz._id)));
        });

        storeFilter.variantId = { $in: vIds };
        warehouseFilter.variantId = { $in: vIds };
    }

    const skip = (page - 1) * parseInt(limit);

    console.log('[STOCK-OVERVIEW-DEBUG] Filters:', { storeFilter, warehouseFilter });

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

    console.log(`[STOCK-OVERVIEW-DEBUG] Found: Store(${storeInventory.length}) Warehouse(${warehouseInventory.length})`);

    // Combine results
    const rawCombined = [...storeInventory, ...warehouseInventory];
    const populatedCombined = await populateInventoryManual(rawCombined);

    // Filter out orphaned records
    const total = populatedCombined.length;
    const combined = populatedCombined.slice(skip, skip + parseInt(limit));

    console.log(`[STOCK-OVERVIEW-DEBUG] Final Combined: ${combined.length}`);

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
const getProductInStore = async (storeId, id) => {
    const item = await StoreInventory.findOne({ 
        storeId, 
        $or: [{ variantId: id }, { itemId: id }] 
    })
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
        const { storeId, quantityChange, notes } = adjustmentData;
        const variantId = adjustmentData.variantId || adjustmentData.productId;
        const referenceId = adjustmentData.referenceId || new mongoose.Types.ObjectId();
        await adjustStoreStock({
            storeId,
            variantId,
            productId: variantId, // Keep for base compatibility if needed
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
