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

    const itemIds = [];
    const variantIds = [];
    const barcodes = [];

    inventoryItems.forEach(item => {
        if (item.itemId) itemIds.push(new mongoose.Types.ObjectId(String(item.itemId)));
        if (item.variantId) variantIds.push(String(item.variantId));
        if (item.barcode) barcodes.push(String(item.barcode));
    });

    const items = await Item.find({ 
        $or: [
            { _id: { $in: itemIds } },
            { "sizes._id": { $in: variantIds.filter(v => v.length === 24) } },
            { "sizes.sku": { $in: [...variantIds, ...barcodes] } },
            { "sizes.barcode": { $in: [...variantIds, ...barcodes] } }
        ]
    }).populate('hsCodeId').lean();

    // Create indexing Maps for O(1) lookup
    const itemMap = new Map();
    const variantToItemMap = new Map();
    const skuToItemMap = new Map();

    items.forEach(it => {
        itemMap.set(String(it._id), it);
        if (it.sizes) {
            it.sizes.forEach(sz => {
                variantToItemMap.set(String(sz._id), it);
                if (sz.sku) skuToItemMap.set(String(sz.sku), it);
                if (sz.barcode) skuToItemMap.set(String(sz.barcode), it);
            });
        }
    });

    return inventoryItems.map(item => {
        const vid = String(item.variantId || '');
        const parentId = String(item.itemId || '');
        const barcode = String(item.barcode || '');
        
        // Try looking up by ID, then variantId, then SKU/Barcode
        const parentItem = itemMap.get(parentId) || 
                          variantToItemMap.get(vid) || 
                          skuToItemMap.get(vid) || 
                          skuToItemMap.get(barcode);

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
                mrp: toFiniteNumber(variant.mrp || parentItem.mrp || variant.salePrice || parentItem.salePrice),
                hsnCode: parentItem.hsCodeId?.code || parentItem.hsnCode || 'N/A'
            };
        }
        
        return {
            ...item,
            id: item._id,
            itemCode: barcode || 'ORPHAN',
            itemName: 'Unknown Item (' + (barcode || vid) + ')',
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
    const { page = 1, limit = 50000, search, storeId, warehouseId, lowStock, type } = query;

    const storeFilter = {};
    const warehouseFilter = {};

    // 1. Enforce scoping
    const normalizedRole = (user.role || '').toLowerCase();
    
    // HO users (admin or any role without shopId) should see everything
    const isHOUser = normalizedRole.includes('admin') || !user.shopId;
    const isStoreRole = !isHOUser && (normalizedRole.includes('staff') || normalizedRole.includes('manager') || normalizedRole.includes('accountant'));
    
    if (isStoreRole) {
        if (!user.shopId) throw new Error('User is not linked to any store. Please contact your administrator.');
        storeFilter.storeId = user.shopId;
        warehouseFilter._id = { $exists: false }; // Hide warehouse for store staff
    } else {
        // Admin or HO role: filter by selected location if provided
        if (storeId && storeId !== 'all') {
            storeFilter.storeId = storeId;
            warehouseFilter.warehouseId = storeId;
        } else if (warehouseId && warehouseId !== 'all') {
            // Handle separate warehouse filter if passed
            warehouseFilter.warehouseId = warehouseId;
            storeFilter._id = { $exists: false }; 
        }
    }

    if (lowStock === 'true') {
        storeFilter.$expr = { $lte: ['$quantityAvailable', '$minStockLevel'] };
        warehouseFilter.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }

    // If search exists, find matching Item and Variant IDs first
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        const matchingItems = await Item.find({
            $or: [
                { itemName: searchRegex },
                { itemCode: searchRegex },
                { "sizes.sku": searchRegex },
                { "sizes.barcode": searchRegex },
                { type: searchRegex }
            ]
        }).select('_id sizes type');

        const vIds = [];
        const itemIds = [];
        matchingItems.forEach(it => {
            itemIds.push(it._id);
            it.sizes.forEach(sz => vIds.push(String(sz._id)));
        });

        storeFilter.$or = [
            { variantId: { $in: vIds } },
            { itemId: { $in: itemIds } },
            { barcode: searchRegex }
        ];
        warehouseFilter.$or = [
            { variantId: { $in: vIds } },
            { itemId: { $in: itemIds } },
            { barcode: searchRegex }
        ];
    }

    if (type && type !== 'all') {
        const matchingItems = await Item.find({ type }).select('_id');
        const itemIds = matchingItems.map(it => it._id);
        storeFilter.itemId = { $in: itemIds };
        warehouseFilter.itemId = { $in: itemIds };
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

    console.log(`[STOCK-OVERVIEW-DEBUG] Query Results: StoreCount=${storeInventory.length}, WarehouseCount=${warehouseInventory.length}, UserRole=${user.role}`);

    // Combine results
    const rawCombined = [...storeInventory, ...warehouseInventory];
    const populatedCombined = await populateInventoryManual(rawCombined);

    // Calculate totals across ALL items (before pagination)
    const totalQuantity = Math.round(populatedCombined.reduce((sum, item) => sum + Number(item.available ?? item.quantity ?? 0), 0));
    const total = populatedCombined.length;

    // Apply pagination
    const combined = populatedCombined.slice(skip, skip + parseInt(limit));

    console.log(`[STOCK-OVERVIEW-DEBUG] Final Combined: ${combined.length}, TotalQty: ${totalQuantity}`);

    return {
        inventory: combined,
        total,
        totalQuantity,
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

const { bulkAddStock } = require('../../services/stock.service');

/**
 * High-performance bulk import for Opening Stock via Excel
 */
const bulkImportOpeningStock = async (importData, userId) => {
    return await withTransaction(async (session) => {
        const { storeId, items } = importData;
        if (!storeId) throw new Error('Store ID is required for import');
        if (!items || !items.length) throw new Error('No items provided for import');

        // 1. Resolve all items by barcode in bulk
        const barcodes = [...new Set(items.map(i => String(i.itemCode || i.barcode || '').trim()).filter(Boolean))];
        const matchedItems = await Item.find({ 
            $or: [
                { "sizes.barcode": { $in: barcodes } },
                { "sizes.sku": { $in: barcodes } }
            ]
        }).session(session).lean();

        // 2. Create a map for quick lookup
        const barcodeMap = new Map();
        matchedItems.forEach(item => {
            if (item.sizes) {
                item.sizes.forEach(sz => {
                    if (sz.barcode) barcodeMap.set(sz.barcode, { item, variant: sz });
                    if (sz.sku) barcodeMap.set(sz.sku, { item, variant: sz });
                });
            }
        });

        // 3. Prepare items for bulkAddStock and perform validations
        const validItems = [];
        const errors = [];

        items.forEach(row => {
            const barcode = String(row.itemCode || row.barcode || '').trim();
            const match = barcodeMap.get(barcode);
            
            if (!match) {
                errors.push({ itemCode: barcode, error: 'Item not found in master' });
                return;
            }

            const { item, variant } = match;

            // Optional Attribute Validation (Name mismatch check)
            const excelName = String(row.itemName || '').trim().toLowerCase();
            const masterName = String(item.itemName || '').trim().toLowerCase();
            
            if (excelName && masterName && !masterName.includes(excelName) && !excelName.includes(masterName)) {
                errors.push({ itemCode: barcode, error: `Name mismatch: Excel(${excelName}) vs Master(${masterName})` });
                return;
            }

            validItems.push({
                itemId: item._id,
                variantId: variant._id,
                barcode: barcode,
                qty: Number(row.closingStock || row.quantity || 0)
            });
        });

        // 4. Perform bulk insert if we have valid items
        if (validItems.length > 0) {
            await bulkAddStock(validItems, {
                referenceId: new mongoose.Types.ObjectId(),
                referenceType: 'OpeningBalance',
                performedBy: userId,
                locationId: storeId,
                locationType: 'STORE',
                session,
                mode: 'SET'
            });
        }

        return {
            totalProcessed: items.length,
            successCount: validItems.length,
            failedCount: errors.length,
            errors
        };
    });
};

module.exports = {
    getStoreInventory,
    getProductInStore,
    adjustInventory,
    bulkImportOpeningStock
};
