const StoreInventory = require('../../models/storeInventory.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const Item = require('../../models/item.model');
const Product = require('../../models/product.model');
const mongoose = require('mongoose');

const toFiniteNumber = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
};

const formatInventoryLocation = (item) => {
    if (item.storeId) return `[Store] ${item.storeId.name}`;
    if (item.warehouseId) {
        const whName = item.warehouseId.name || item.warehouseId.warehouseName || 'Main Warehouse';
        return `[Warehouse] ${whName}`;
    }
    return 'Main Warehouse';
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
            { itemCode: { $in: [...variantIds, ...barcodes] } },
            { "sizes._id": { $in: variantIds.filter(v => v.length === 24) } },
            { "sizes.sku": { $in: [...variantIds, ...barcodes] } },
            { "sizes.barcode": { $in: [...variantIds, ...barcodes] } }
        ]
    }).populate('hsCodeId categoryId brand').lean();

    // Create indexing Maps for O(1) lookup
    const itemMap = new Map();
    const variantToItemMap = new Map();
    const skuToItemMap = new Map();
    const codeToItemMap = new Map();

    items.forEach(it => {
        itemMap.set(String(it._id), it);
        if (it.itemCode) {
            codeToItemMap.set(it.itemCode, it);
        }
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
        
        // Try looking up by ID, then variantId, then SKU/Barcode/ItemCode
        const parentItem = itemMap.get(parentId) || 
                          variantToItemMap.get(vid) || 
                          skuToItemMap.get(vid) || 
                          skuToItemMap.get(barcode) ||
                          codeToItemMap.get(vid) ||
                          codeToItemMap.get(barcode);

        if (parentItem) {
            const variant = parentItem.sizes?.find(sz => 
                String(sz._id) === vid || 
                sz.sku === vid || 
                sz.barcode === vid ||
                sz.sku === barcode ||
                sz.barcode === barcode
            ) || parentItem.sizes?.[0] || {};
            
            return {
                ...item,
                id: item._id,
                variantId: variant._id || item.variantId,
                itemId: parentItem._id,
                itemCode: parentItem.itemCode,
                itemName: parentItem.itemName,
                type: parentItem.type || 'GARMENT',
                size: variant.size || 'UNI',
                color: variant.color || parentItem.color || parentItem.shadeNo || 'N/A',
                sku: variant.sku || variant.barcode || parentItem.itemCode,
                barcode: variant.barcode || variant.sku || parentItem.itemCode,
                brand: parentItem.brand?.name || parentItem.brandName || 'N/A',
                category: parentItem.categoryId?.name || parentItem.categoryName || (parentItem.groupIds?.find(g => g.groupType === 'Category') || parentItem.groupIds?.[0])?.name || 'GARMENT',
                available: item.quantityAvailable ?? item.quantity,
                inTransit: item.quantityInTransit || 0,
                reorderLevel: item.reorderLevel || 0,
                location: formatInventoryLocation(item),
                warehouseName: formatInventoryLocation(item),
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
            warehouseName: formatInventoryLocation(item),
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
    const { getPagination } = require('../../utils/pagination.helper');
    const { page, limit, skip } = getPagination(query);
    const { search, storeId, warehouseId, lowStock, outOfStock, type } = query;

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
        } else if (warehouseId && warehouseId !== 'all') {
            // Handle separate warehouse filter if passed
            warehouseFilter.warehouseId = warehouseId;
            storeFilter._id = { $exists: false }; 
        } else {
            // Default HO view or 'all' selected: Show ONLY Warehouse inventory!
            // This hides store inventory from the Head Office overview as requested.
            storeFilter._id = { $in: [] };
        }
    }
    if (lowStock === 'true') {
        storeFilter.$expr = { $lte: ['$quantityAvailable', '$minStockLevel'] };
        warehouseFilter.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }
    if (outOfStock === 'true') {
        storeFilter.quantityAvailable = { $lte: 0 };
        warehouseFilter.quantity = { $lte: 0 };
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

    const forReport = query.forReport === true || query.forReport === 'true';
    const { REPORT_MAX_PAGE_SIZE } = require('../../core/constants');

    if (forReport) {
        const reportLimit = REPORT_MAX_PAGE_SIZE;
        const effectiveStoreId = isStoreRole
            ? user.shopId
            : (storeId && storeId !== 'all' ? storeId : null);

        if (effectiveStoreId) {
            const sf = { ...storeFilter, storeId: effectiveStoreId };
            delete sf._id;

            const [rows, agg] = await Promise.all([
                StoreInventory.find(sf).sort({ lastUpdated: -1 }).limit(reportLimit).lean(),
                StoreInventory.aggregate([
                    { $match: sf },
                    { $group: { _id: null, totalQty: { $sum: '$quantityAvailable' }, count: { $sum: 1 } } },
                ]),
            ]);
            const inventory = await populateInventoryManual(rows);
            return {
                inventory,
                total: agg[0]?.count || inventory.length,
                totalQuantity: Math.round(agg[0]?.totalQty || 0),
                page: 1,
                limit: reportLimit,
            };
        }

        if (!isStoreRole) {
            const wf = { ...warehouseFilter };
            delete wf._id;

            const [rows, agg] = await Promise.all([
                WarehouseInventory.find(wf).sort({ lastUpdated: -1 }).limit(reportLimit).lean(),
                WarehouseInventory.aggregate([
                    { $match: wf },
                    { $group: { _id: null, totalQty: { $sum: '$quantity' }, count: { $sum: 1 } } },
                ]),
            ]);
            const inventory = await populateInventoryManual(rows);
            return {
                inventory,
                total: agg[0]?.count || inventory.length,
                totalQuantity: Math.round(agg[0]?.totalQty || 0),
                page: 1,
                limit: reportLimit,
            };
        }
    }

    console.log('[STOCK-OVERVIEW-DEBUG] Filters:', { storeFilter, warehouseFilter });

    // Fetch totals in parallel with the main query
    const [totalStoreRows, totalWarehouseRows] = await Promise.all([
        StoreInventory.countDocuments(storeFilter),
        WarehouseInventory.countDocuments(warehouseFilter)
    ]);
    const total = totalStoreRows + totalWarehouseRows;

    // Apply limit to database queries to prevent fetching 100k+ records into memory
    // We fetch (skip + limit) from both and then slice to handle the combination properly
    const dbLimit = skip + parseInt(limit);

    const [storeInventory, warehouseInventory] = await Promise.all([
        StoreInventory.find(storeFilter)
            .sort({ lastUpdated: -1 })
            .limit(dbLimit)
            .populate('storeId', 'name location')
            .lean(),
        WarehouseInventory.find(warehouseFilter)
            .sort({ lastUpdated: -1 })
            .limit(dbLimit)
            .populate('warehouseId', 'name location')
            .lean()
    ]);

    // Combine and apply pagination BEFORE population for speed
    const rawCombined = [...storeInventory, ...warehouseInventory];
    const combinedSlice = rawCombined.slice(skip, skip + parseInt(limit));

    // Only populate the current page
    const inventory = await populateInventoryManual(combinedSlice);

    // Calculate totals across ALL items (lightweight aggregation for accuracy)
    const [storeQtyRes, warehouseQtyRes] = await Promise.all([
        StoreInventory.aggregate([
            { $match: storeFilter },
            { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
        ]),
        WarehouseInventory.aggregate([
            { $match: warehouseFilter },
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ])
    ]);

    const totalQuantity = Math.round((storeQtyRes[0]?.total || 0) + (warehouseQtyRes[0]?.total || 0));

    console.log(`[STOCK-OVERVIEW-DEBUG] Slice: ${inventory.length}, Total: ${total}, TotalQty: ${totalQuantity}`);

    return {
        inventory,
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
    const { storeId, items } = importData;
    if (!storeId) throw new Error('Store ID is required for import');
    if (!items || !items.length) throw new Error('No items provided for import');

    // 1. Resolve all items by barcode in bulk
    const barcodes = [...new Set(items.map(i => String(i.itemCode || i.barcode || '').trim()).filter(Boolean))];
    const matchedItems = await Item.find({ 
        $or: [
            { itemCode: { $in: barcodes } },
            { "sizes.barcode": { $in: barcodes } },
            { "sizes.sku": { $in: barcodes } }
        ]
    }).lean();

    // 2. Create a map for quick lookup
    const barcodeMap = new Map();
    matchedItems.forEach(item => {
        if (item.itemCode) {
            const defaultVariant = item.sizes?.[0] || { _id: item._id, size: 'UNI' };
            barcodeMap.set(item.itemCode, { item, variant: defaultVariant });
        }
        if (item.sizes) {
            item.sizes.forEach(sz => {
                if (sz.barcode) barcodeMap.set(sz.barcode, { item, variant: sz });
                if (sz.sku) barcodeMap.set(sz.sku, { item, variant: sz });
            });
        }
    });

    // 3. Prepare items for bulkAddStock and perform validations (Aggregate by barcode)
    const validItemsMap = new Map();
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

        const qty = Number(row.closingStock || row.quantity || 0);

        if (validItemsMap.has(barcode)) {
            const existing = validItemsMap.get(barcode);
            existing.qty += qty; // Sum quantities for duplicate rows in same file
        } else {
            validItemsMap.set(barcode, {
                itemId: item._id,
                variantId: variant._id,
                barcode: barcode,
                qty: qty
            });
        }
    });

    const validItems = Array.from(validItemsMap.values());

    // 4. Perform bulk insert if we have valid items
    if (validItems.length > 0) {
        await bulkAddStock(validItems, {
            referenceId: new mongoose.Types.ObjectId(),
            referenceType: 'OpeningBalance',
            performedBy: userId,
            locationId: storeId,
            locationType: 'STORE',
            mode: 'SET'
        });
    }

    return {
        totalProcessed: items.length,
        successCount: validItems.length,
        failedCount: errors.length,
        errors
    };
};

/**
 * Safely clears all inventory for a given store.
 * Updates master item quantities, records outward StockMovement, and logs StockLedger adjustments.
 */
const clearStoreInventory = async (storeId, userId) => {
    return await withTransaction(async (session) => {
        if (!storeId) throw new Error('Store ID is required');

        // Find all non-zero inventory items for this store
        const inventoryItems = await StoreInventory.find({ storeId }).session(session);

        const itemOps = [];
        const movements = [];
        const ledgerEntries = [];
        const referenceId = new mongoose.Types.ObjectId();

        for (const item of inventoryItems) {
            const qty = item.quantity || 0;
            if (qty <= 0) continue;

            // 1. Prepare master stock decrement
            itemOps.push({
                updateOne: {
                    filter: { "sizes._id": item.variantId },
                    update: { $inc: { "sizes.$.stock": -qty } }
                }
            });

            // 2. Prepare Stock Movement record
            movements.push({
                variantId: item.variantId,
                qty: -qty,
                type: StockMovementType.ADJUSTMENT,
                referenceId,
                referenceType: 'Adjustment',
                fromLocation: storeId,
                performedBy: userId
            });

            // 3. Prepare Stock Ledger entry
            ledgerEntries.push({
                itemId: item.itemId,
                barcode: item.barcode,
                type: 'OUT',
                quantity: qty,
                source: 'ADJUSTMENT',
                referenceId: referenceId.toString(),
                balanceAfter: 0,
                userId,
                locationId: storeId,
                locationType: 'STORE',
                batchNo: 'DEFAULT'
            });
        }

        // Execute master updates, movements, and ledger entries in bulk if there are any
        if (itemOps.length > 0) {
            await Item.bulkWrite(itemOps, { session });
        }
        if (movements.length > 0) {
            const StockMovement = require('../../models/stockMovement.model');
            await StockMovement.insertMany(movements, { session, ordered: false });
        }
        if (ledgerEntries.length > 0) {
            const StockLedger = require('../../models/stockLedger.model');
            await StockLedger.insertMany(ledgerEntries, { session, ordered: false });
        }

        // Delete all Store Inventory records for this store
        const deleteResult = await StoreInventory.deleteMany({ storeId }).session(session);

        // Record a System Log
        const SystemLog = require('../../models/systemLog.model');
        await SystemLog.create([{
            action: 'DELETE_STORE_INVENTORY',
            module: 'Inventory',
            userId,
            details: `Cleared all inventory for store ${storeId}. Deleted ${deleteResult.deletedCount} inventory records.`
        }], { session });

        return {
            success: true,
            deletedCount: deleteResult.deletedCount
        };
    });
};

/**
 * Clear all inventory for a specific warehouse
 * Decrements master stock, adds movement logs, and removes the warehouse inventory records.
 */
const clearWarehouseInventory = async (warehouseId, userId) => {
    try {
        const WarehouseInventory = require('../../models/warehouseInventory.model');
        const Item = require('../../models/item.model');
        const { StockMovementType } = require('../../core/enums');

        // Get all inventory for this warehouse
        const inventoryItems = await WarehouseInventory.find({ warehouseId });
        
        if (inventoryItems.length === 0) {
            return { success: true, deletedCount: 0, message: 'No inventory found to clear.' };
        }

        const itemOps = [];
        const movements = [];
        const ledgerEntries = [];
        const referenceId = new mongoose.Types.ObjectId();

        for (const item of inventoryItems) {
            const qty = item.quantity || 0;
            if (qty <= 0) continue;

            // 1. Prepare master stock decrement
            itemOps.push({
                updateOne: {
                    filter: { "sizes._id": item.variantId },
                    update: { $inc: { "sizes.$.stock": -qty } }
                }
            });

            // 2. Prepare Stock Movement record
            movements.push({
                variantId: item.variantId,
                qty: -qty,
                type: StockMovementType.ADJUSTMENT,
                referenceId,
                referenceType: 'Adjustment',
                fromLocation: warehouseId,
                performedBy: userId
            });

            // 3. Prepare Stock Ledger entry
            ledgerEntries.push({
                itemId: item.itemId,
                barcode: item.barcode,
                type: 'OUT',
                quantity: qty,
                source: 'ADJUSTMENT',
                referenceId: referenceId.toString(),
                balanceAfter: 0,
                userId,
                locationId: warehouseId,
                locationType: 'WAREHOUSE',
                batchNo: 'DEFAULT'
            });
        }

        // Execute master updates, movements, and ledger entries in bulk if there are any
        if (itemOps.length > 0) {
            await Item.bulkWrite(itemOps);
        }
        if (movements.length > 0) {
            const StockMovement = require('../../models/stockMovement.model');
            await StockMovement.insertMany(movements, { ordered: false });
        }
        if (ledgerEntries.length > 0) {
            const StockLedger = require('../../models/stockLedger.model');
            await StockLedger.insertMany(ledgerEntries, { ordered: false });
        }

        // Delete all Warehouse Inventory records for this warehouse
        const deleteResult = await WarehouseInventory.deleteMany({ warehouseId });

        // Record a System Log
        const SystemLog = require('../../models/systemLog.model');
        await SystemLog.create([{
            action: 'DELETE_WAREHOUSE_INVENTORY',
            module: 'Inventory',
            userId,
            details: `Cleared all inventory for warehouse ${warehouseId}. Deleted ${deleteResult.deletedCount} inventory records.`
        }]);

        return {
            success: true,
            deletedCount: deleteResult.deletedCount
        };
    } catch (err) {
        console.error('CRITICAL ERROR in clearWarehouseInventory:', err);
        throw err;
    }
};

const buildScopedInventoryFilters = (user) => {
    const storeFilter = {};
    const warehouseFilter = {};

    const normalizedRole = (user.role || '').toLowerCase();
    const isHOUser = normalizedRole.includes('admin') || !user.shopId;
    const isStoreRole = !isHOUser && (
        normalizedRole.includes('staff')
        || normalizedRole.includes('manager')
        || normalizedRole.includes('accountant')
    );

    if (isStoreRole) {
        if (!user.shopId) {
            throw new Error('User is not linked to any store. Please contact your administrator.');
        }
        storeFilter.storeId = user.shopId;
        warehouseFilter._id = { $exists: false };
    } else {
        storeFilter._id = { $in: [] };
    }

    return { storeFilter, warehouseFilter };
};

/**
 * Lightweight stock stats for dashboard (no full inventory list).
 */
const getHomeStockStats = async (user, query = {}) => {
    const threshold = Math.max(0, Number(query.lowStockThreshold) || 10);
    const sampleLimit = 20;
    const { storeFilter, warehouseFilter } = buildScopedInventoryFilters(user);

    const storeMatch = { ...storeFilter };
    const warehouseMatch = { ...warehouseFilter };
    delete warehouseMatch._id;

    const storeLowMatch = {
        ...storeFilter,
        quantityAvailable: { $gt: 0, $lte: threshold },
    };
    const warehouseLowMatch = {
        ...warehouseMatch,
        quantity: { $gt: 0, $lte: threshold },
    };

    const [
        storeAgg,
        warehouseAgg,
        storeLowCount,
        warehouseLowCount,
        storeLowRows,
        warehouseLowRows,
    ] = await Promise.all([
        StoreInventory.aggregate([
            { $match: storeMatch },
            { $group: { _id: null, count: { $sum: 1 }, totalQty: { $sum: '$quantityAvailable' } } },
        ]),
        WarehouseInventory.aggregate([
            { $match: warehouseMatch },
            { $group: { _id: null, count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } },
        ]),
        StoreInventory.countDocuments(storeLowMatch),
        WarehouseInventory.countDocuments(warehouseLowMatch),
        StoreInventory.find(storeLowMatch).sort({ quantityAvailable: 1 }).limit(sampleLimit).lean(),
        WarehouseInventory.find(warehouseLowMatch).sort({ quantity: 1 }).limit(sampleLimit).lean(),
    ]);

    const combinedLow = [...storeLowRows, ...warehouseLowRows]
        .sort((left, right) => {
            const leftQty = Number(left.quantityAvailable ?? left.quantity ?? 0);
            const rightQty = Number(right.quantityAvailable ?? right.quantity ?? 0);
            return leftQty - rightQty;
        })
        .slice(0, sampleLimit);

    const populated = await populateInventoryManual(combinedLow);

    return {
        totalRows: (storeAgg[0]?.count || 0) + (warehouseAgg[0]?.count || 0),
        totalQuantity: Math.round((storeAgg[0]?.totalQty || 0) + (warehouseAgg[0]?.totalQty || 0)),
        lowStockCount: storeLowCount + warehouseLowCount,
        lowStockItems: populated.map((row) => ({
            id: row.id || row._id,
            itemName: row.itemName || 'Unknown',
            sku: row.sku || row.barcode || row.itemCode || '',
            quantity: Number(row.available ?? row.quantityAvailable ?? row.quantity ?? 0),
        })),
    };
};

module.exports = {
    getStoreInventory,
    getHomeStockStats,
    getProductInStore,
    adjustInventory,
    bulkImportOpeningStock,
    clearStoreInventory,
    clearWarehouseInventory
};

