const StoreInventory = require('../models/storeInventory.model');
const WarehouseInventory = require('../models/warehouseInventory.model');
const StockMovement = require('../models/stockMovement.model');
const Item = require('../models/item.model');
const Store = require('../models/store.model');
const Warehouse = require('../models/warehouse.model');
const systemConfigService = require('../modules/systemConfig/systemConfig.service');
const { createAuditLog } = require('../middlewares/audit.middleware');
const { StockMovementType } = require('../core/enums');
const stockLedgerService = require('../modules/inventory/stockLedger.service');
const SystemLog = require('../models/systemLog.model');

const resolveReferenceType = (referenceType, fallback = 'Adjustment') => referenceType || fallback;

const toFiniteNumber = (value, label = 'quantity') => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        throw new Error(`Invalid ${label}`);
    }
    return numeric;
};

const _getItemMetadata = async (variantId, barcode, session) => {
    try {
        if (session) {
            session.itemMetadataCache = session.itemMetadataCache || new Map();
            const cacheKey = variantId ? String(variantId) : String(barcode);
            if (session.itemMetadataCache.has(cacheKey)) {
                return session.itemMetadataCache.get(cacheKey);
            }
        }

        const item = await Item.findOne({
            $or: [
                { "sizes._id": variantId },
                { "sizes.barcode": barcode },
                { "sizes.sku": barcode },
                { itemCode: barcode }
            ]
        }).session(session).lean();

        if (!item) return {};

        const variant = item.sizes?.find(s => 
            String(s._id) === String(variantId) || 
            s.barcode === barcode || 
            s.sku === barcode
        ) || item.sizes?.[0] || {};

        const metadata = {
            itemName: item.itemName,
            sku: variant.sku || item.itemCode,
            barcode: variant.barcode || variant.sku || item.itemCode,
            color: variant.color || item.color
        };

        if (session) {
            const cacheKey = variantId ? String(variantId) : String(barcode);
            session.itemMetadataCache.set(cacheKey, metadata);
        }

        return metadata;
    } catch (err) {
        console.error('Error fetching item metadata for movement:', err);
        return {};
    }
};

const _resolveStockIdentifiers = async ({ itemId, barcode, variantId, session }) => {
    let resolvedItemId = itemId || null;
    let resolvedBarcode = barcode ? String(barcode).trim() : '';
    let resolvedVariantId = variantId || null;

    if (resolvedItemId && resolvedBarcode) {
        return {
            itemId: resolvedItemId,
            barcode: resolvedBarcode,
            variantId: resolvedVariantId,
        };
    }

    const mongoose = require('mongoose');
    const lookupClauses = [];

    if (resolvedBarcode) {
        lookupClauses.push(
            { itemCode: resolvedBarcode.toUpperCase() },
            { 'sizes.barcode': resolvedBarcode },
            { 'sizes.sku': resolvedBarcode },
        );
    }
    if (resolvedVariantId && mongoose.Types.ObjectId.isValid(resolvedVariantId)) {
        lookupClauses.push(
            { _id: resolvedVariantId },
            { 'sizes._id': resolvedVariantId },
        );
    }
    if (resolvedItemId && mongoose.Types.ObjectId.isValid(resolvedItemId)) {
        lookupClauses.push({ _id: resolvedItemId });
    }

    if (lookupClauses.length) {
        const item = await Item.findOne({ $or: lookupClauses }).session(session).lean();
        if (item) {
            resolvedItemId = resolvedItemId || item._id;
            const variant =
                item.sizes?.find(
                    (size) =>
                        String(size._id) === String(resolvedVariantId) ||
                        (resolvedBarcode &&
                            (size.barcode === resolvedBarcode || size.sku === resolvedBarcode)),
                ) || item.sizes?.[0];
            resolvedVariantId = resolvedVariantId || variant?._id || null;
            resolvedBarcode =
                resolvedBarcode || variant?.barcode || variant?.sku || item.itemCode || '';
        }
    }

    if (!resolvedItemId || !resolvedBarcode) {
        throw new Error('Unable to resolve itemId and barcode for stock movement');
    }

    return {
        itemId: resolvedItemId,
        barcode: resolvedBarcode,
        variantId: resolvedVariantId,
    };
};

/**
 * Core internal function to update inventory collection based on location type
 */
const _updateInventory = async ({ itemId, barcode, variantId, locationId, locationType, qty, session }) => {
    const delta = toFiniteNumber(qty);

    // 1. Strict ID Validation (With caching on transactional session for massive performance speedup)
    if (session) {
        session.locationExistsCache = session.locationExistsCache || new Set();
        const cacheKey = `${locationType}_${locationId}`;
        if (!session.locationExistsCache.has(cacheKey)) {
            if (locationType === 'STORE') {
                const storeExists = await Store.exists({ _id: locationId });
                if (!storeExists) throw new Error(`Invalid Store ID: ${locationId}`);
            } else if (locationType === 'WAREHOUSE') {
                const warehouseExists = await Warehouse.exists({ _id: locationId });
                if (!warehouseExists) throw new Error(`Invalid Warehouse ID: ${locationId}`);
            } else {
                throw new Error('Invalid location type: ' + locationType);
            }
            session.locationExistsCache.add(cacheKey);
        }
    } else {
        if (locationType === 'STORE') {
            const storeExists = await Store.exists({ _id: locationId });
            if (!storeExists) throw new Error(`Invalid Store ID: ${locationId}`);
        } else if (locationType === 'WAREHOUSE') {
            const warehouseExists = await Warehouse.exists({ _id: locationId });
            if (!warehouseExists) throw new Error(`Invalid Warehouse ID: ${locationId}`);
        } else {
            throw new Error('Invalid location type: ' + locationType);
        }
    }

    let InventoryModel;
    const locField = locationType === 'STORE' ? 'storeId' : 'warehouseId';
    if (locationType === 'STORE') {
        InventoryModel = StoreInventory;
    } else {
        InventoryModel = WarehouseInventory;
    }

    let inventory = await InventoryModel.findOne({
        [locField]: locationId,
        $or: [
            { barcode },
            variantId ? { variantId: String(variantId) } : null
        ].filter(Boolean)
    }).session(session);

    if (!inventory && itemId) {
        inventory = await InventoryModel.findOne({
            [locField]: locationId,
            itemId
        }).session(session);
    }

    if (!inventory) {
        const Item = require('../models/item.model');
        const mongoose = require('mongoose');
        const isValidId = variantId ? mongoose.Types.ObjectId.isValid(variantId) : false;
        const resolvedItem = await Item.findOne({
            $or: [
                { itemCode: String(barcode).toUpperCase() },
                { "sizes.barcode": barcode },
                { "sizes.sku": barcode },
                isValidId ? { _id: variantId } : null,
                isValidId ? { "sizes._id": variantId } : null
            ].filter(Boolean)
        }).session(session);

        if (resolvedItem) {
            inventory = await InventoryModel.findOne({
                [locField]: locationId,
                $or: [
                    { itemId: resolvedItem._id },
                    { barcode: resolvedItem.itemCode },
                    { barcode: resolvedItem.itemCode.toUpperCase() },
                    { barcode: barcode }
                ]
            }).session(session);
        }
    }
    
    const allowNegative = await systemConfigService.getConfigByKey('allowNegativeStock', false);

    if (!inventory) {
        if (qty < 0 && !allowNegative) throw new Error(`Insufficient stock for barcode ${barcode} at ${locationType}`);
        const initData = { barcode, [locField]: locationId, itemId, variantId, quantity: 0 };
        if (locationType === 'STORE') initData.quantityAvailable = 0;
        inventory = new InventoryModel(initData);
    }
    
    const newQty = (inventory.quantity || 0) + delta;
    
    if (!allowNegative && newQty < 0) {
        throw new Error(`Negative stock not allowed at ${locationType}. Requested Change: ${delta}, Current: ${inventory.quantity}`);
    }
    
    inventory.quantity = newQty;
    if (locationType === 'STORE') {
        inventory.quantityAvailable = newQty;
        // Update purchase history rate for COGS logic
        if (arguments[0].purchaseRate && arguments[0].purchaseRate > 0) {
            inventory.lastPurchaseRate = arguments[0].purchaseRate;
        }
    }
    inventory.lastUpdated = Date.now();
    await inventory.save({ session });
    
    console.log(`[INVENTORY-UPDATE] Location: ${locationId} (${locationType}), Barcode: ${barcode}, Balance: ${inventory.quantity} (Change: ${delta})`);
    
    // MASTER STOCK UPDATE: Sync with Item model for global/master view denormalized cache.
    const syncMasterStock = async () => {
        try {
            const ItemModel = require('../models/item.model');
            await ItemModel.updateOne(
                { "sizes._id": variantId },
                { $inc: { "sizes.$.stock": delta } }
            );
        } catch (err) {
            console.warn(`[BG-STOCK-WARN] Background master stock sync failed for variant ${variantId}:`, err.message);
        }
    };

    if (session && session.postCommitCallbacks) {
        // Safe: Queue update and run ONLY after the transaction commits successfully
        session.postCommitCallbacks.push(syncMasterStock);
    } else {
        // Not in a transaction context, run on next tick
        setImmediate(syncMasterStock);
    }
    
    return inventory;
};

/**
 * Add stock to In-Transit pool (Dispatch from Source)
 */
const addInTransit = async ({ itemId, barcode, variantId, locationId, locationType, qty, session }) => {
    const transitQty = toFiniteNumber(qty);
    if (transitQty <= 0) throw new Error('In-Transit quantity must be positive');

    const resolved = await _resolveStockIdentifiers({ itemId, barcode, variantId, session });
    itemId = resolved.itemId;
    barcode = resolved.barcode;
    variantId = resolved.variantId;

    const filter = { barcode };
    let InventoryModel;
    if (locationType === 'STORE') {
        filter.storeId = locationId;
        InventoryModel = StoreInventory;
    } else {
        filter.warehouseId = locationId;
        InventoryModel = WarehouseInventory;
    }

    let inventory = await InventoryModel.findOne(filter).session(session);
    if (!inventory) {
        inventory = new InventoryModel({ ...filter, itemId, variantId, quantity: 0, quantityInTransit: 0 });
    }

    inventory.quantityInTransit = (inventory.quantityInTransit || 0) + transitQty;
    inventory.lastUpdated = Date.now();
    await inventory.save({ session });
    
    console.log(`[IN-TRANSIT-ADD] Location: ${locationId} (${locationType}), Barcode: ${barcode}, Balance: ${inventory.quantityInTransit}`);
    return inventory;
};

/**
 * Remove stock from In-Transit pool (Received by Destination)
 */
const removeInTransit = async ({ itemId, barcode, variantId, locationId, locationType, qty, session }) => {
    const transitQty = toFiniteNumber(qty);
    if (transitQty <= 0) throw new Error('Quantity must be positive');

    const resolved = await _resolveStockIdentifiers({ itemId, barcode, variantId, session });
    itemId = resolved.itemId;
    barcode = resolved.barcode;
    variantId = resolved.variantId;

    let InventoryModel;
    const filter = {};
    if (locationType === 'STORE') {
        filter.storeId = locationId;
        InventoryModel = StoreInventory;
    } else {
        filter.warehouseId = locationId;
        InventoryModel = WarehouseInventory;
    }

    // Attempt 1: Strict Barcode Search
    let inventory = await InventoryModel.findOne({ ...filter, barcode }).session(session);
    
    // Attempt 2: Fallback to Variant Search (Handle barcode changes or legacy dispatches)
    if (!inventory && variantId) {
        inventory = await InventoryModel.findOne({ ...filter, variantId }).session(session);
    }

    if (!inventory) {
        throw new Error(`CRITICAL: No in-transit record found for Item Code ${barcode || 'N/A'} (Variant: ${variantId}) at ${locationType} ${locationId}. Stock pool may be out of sync.`);
    }

    const currentTransit = inventory.quantityInTransit || 0;
    if (currentTransit < transitQty) {
        console.warn(`[SYNC-WARNING] Forcing receipt of ${transitQty} despite pool having only ${currentTransit}. Syncing pool to 0.`);
    }

    // Safety: Ensure we don't go below 0 for in-transit pool
    inventory.quantityInTransit = Math.max(0, currentTransit - transitQty);
    inventory.lastUpdated = Date.now();
    await inventory.save({ session });
    
    console.log(`[IN-TRANSIT-REMOVE] Location: ${locationId} (${locationType}), Barcode: ${inventory.barcode}, Left in Transit: ${inventory.quantityInTransit}`);
    return inventory;
};

/**
 * Add stock to a location (Creation/Purchase/Return)
 */
const addStock = async ({ itemId, barcode, variantId, locationId, locationType, qty, type, referenceId, referenceType, performedBy, purchaseRate, session }) => {
    const movementQty = toFiniteNumber(qty);
    if (movementQty <= 0) throw new Error('Quantity to add must be positive');
    if (!referenceId) throw new Error('referenceId is required for stock movement');

    const resolved = await _resolveStockIdentifiers({ itemId, barcode, variantId, session });
    itemId = resolved.itemId;
    barcode = resolved.barcode;
    variantId = resolved.variantId;

    const filter = { barcode };
    if (locationType === 'STORE') filter.storeId = locationId;
    if (locationType === 'WAREHOUSE') filter.warehouseId = locationId;
    
    const beforeInv = await (locationType === 'STORE' ? StoreInventory : WarehouseInventory).findOne(filter).session(session);
    const before = beforeInv ? beforeInv.toObject() : null;

    const inventory = await _updateInventory({ itemId, barcode, variantId, locationId, locationType, qty: movementQty, purchaseRate, session });
    const metadata = await _getItemMetadata(variantId, barcode, session);

    await StockMovement.create([{
        variantId,
        qty: movementQty,
        type: type || StockMovementType.ADJUSTMENT,
        referenceId,
        referenceType: resolveReferenceType(referenceType),
        toLocation: locationId,
        performedBy,
        ...metadata
    }], { session });

    // Audit Logging
    await createAuditLog({
        action: 'ADD_STOCK',
        module: 'Inventory',
        performedBy,
        targetId: inventory._id,
        targetModel: locationType === 'STORE' ? 'StoreInventory' : 'WarehouseInventory',
        before,
        after: inventory.toObject(),
        session
    });

    // New: Record in Stock Ledger (Logic ERP Style)
    await stockLedgerService.recordMovement({
        itemId: itemId,
        variantId,
        barcode: barcode,
        type: 'IN',
        quantity: movementQty,
        source: resolveReferenceType(referenceType).toUpperCase(),
        referenceId: referenceId.toString(),
        userId: performedBy,
        locationId,
        locationType,
        batchNo: 'DEFAULT',
        session
    });

    return inventory;
};

/**
 * Remove stock from a location (Sale/Loss)
 */
const removeStock = async ({ itemId, barcode, variantId, locationId, locationType, qty, type, referenceId, referenceType, performedBy, session }) => {
    const movementQty = toFiniteNumber(qty);
    if (movementQty <= 0) throw new Error('Quantity to remove must be positive');
    if (!referenceId) throw new Error('referenceId is required for stock movement');

    const resolved = await _resolveStockIdentifiers({ itemId, barcode, variantId, session });
    itemId = resolved.itemId;
    barcode = resolved.barcode;
    variantId = resolved.variantId;

    const filter = { barcode };
    if (locationType === 'STORE') filter.storeId = locationId;
    if (locationType === 'WAREHOUSE') filter.warehouseId = locationId;
    
    const beforeInv = await (locationType === 'STORE' ? StoreInventory : WarehouseInventory).findOne(filter).session(session);
    const before = beforeInv ? beforeInv.toObject() : null;

    const inventory = await _updateInventory({ itemId, barcode, variantId, locationId, locationType, qty: -movementQty, session });
    const metadata = await _getItemMetadata(variantId, barcode, session);

    await StockMovement.create([{
        variantId,
        qty: -movementQty,
        type: type || StockMovementType.ADJUSTMENT,
        referenceId,
        referenceType: resolveReferenceType(referenceType),
        fromLocation: locationId,
        performedBy,
        ...metadata
    }], { session });

    // Audit Logging
    await createAuditLog({
        action: 'REMOVE_STOCK',
        module: 'Inventory',
        performedBy,
        targetId: inventory._id,
        targetModel: locationType === 'STORE' ? 'StoreInventory' : 'WarehouseInventory',
        before,
        after: inventory.toObject(),
        session
    });

    // New: Record in Stock Ledger (Logic ERP Style)
    await stockLedgerService.recordMovement({
        itemId: itemId,
        variantId,
        barcode: barcode,
        type: 'OUT',
        quantity: movementQty,
        source: resolveReferenceType(referenceType).toUpperCase(),
        referenceId: referenceId.toString(),
        userId: performedBy,
        locationId,
        locationType,
        batchNo: 'DEFAULT',
        session
    });

    return inventory;
};

/**
 * Transfer stock between locations
 */
const transferStock = async ({ itemId, barcode, variantId, fromLocationId, fromLocationType, toLocationId, toLocationType, qty, type = 'TRANSFER', referenceId, referenceType = 'Dispatch', performedBy, session }) => {
    const movementQty = toFiniteNumber(qty);
    if (movementQty <= 0) throw new Error('Quantity to transfer must be positive');
    if (!referenceId) throw new Error('referenceId is required for stock movement');

    // 1. Remove from source
    await _updateInventory({ itemId, barcode, variantId, locationId: fromLocationId, locationType: fromLocationType, qty: -movementQty, session });

    // 2. Add to destination
    await _updateInventory({ itemId, barcode, variantId, locationId: toLocationId, locationType: toLocationType, qty: movementQty, session });

    // 3. Log single movement record for transfer
    const metadata = await _getItemMetadata(variantId, barcode, session);
    await StockMovement.create([{
        variantId,
        qty: movementQty,
        type: type || StockMovementType.TRANSFER,
        referenceId,
        referenceType: resolveReferenceType(referenceType, 'Dispatch'),
        fromLocation: fromLocationId,
        toLocation: toLocationId,
        performedBy,
        ...metadata
    }], { session });

    // New: Record transfer in Stock Ledger
    await stockLedgerService.recordMovement({
        itemId: itemId,
        variantId,
        barcode: barcode,
        type: 'OUT',
        quantity: movementQty,
        source: 'TRANSFER_FROM',
        referenceId: referenceId.toString(),
        userId: performedBy,
        locationId: fromLocationId,
        locationType: fromLocationType,
        session
    });

    await stockLedgerService.recordMovement({
        itemId: itemId,
        variantId,
        barcode: barcode,
        type: 'IN',
        quantity: movementQty,
        source: 'TRANSFER_TO',
        referenceId: referenceId.toString(),
        userId: performedBy,
        locationId: toLocationId,
        locationType: toLocationType,
        session
    });

    return true;
};

/**
 * Backward compatibility helpers
 */
const adjustWarehouseStock = async ({ productId, variantId, warehouseId, quantityChange, type, referenceId, referenceModel, performedBy, notes, session }) => {
    const numericChange = toFiniteNumber(quantityChange);

    if (numericChange > 0) {
        return addStock({
            variantId: variantId || productId,
            locationId: warehouseId,
            locationType: 'WAREHOUSE',
            qty: numericChange,
            type: type || StockMovementType.ADJUSTMENT,
            referenceId,
            referenceType: referenceModel || 'Adjustment',
            performedBy,
            session
        });
    } else {
        return removeStock({
            variantId: variantId || productId,
            locationId: warehouseId,
            locationType: 'WAREHOUSE',
            qty: Math.abs(numericChange),
            type: type || StockMovementType.ADJUSTMENT,
            referenceId,
            referenceType: referenceModel || 'Adjustment',
            performedBy,
            session
        });
    }
};

const adjustStoreStock = async ({ productId, variantId, storeId, quantityChange, type, referenceId, referenceModel, performedBy, notes, session }) => {
    const numericChange = toFiniteNumber(quantityChange);
    const mType = type || StockMovementType.ADJUSTMENT;
    const resolvedReferenceType = referenceModel || 'Adjustment';

    if (numericChange > 0) {
        return addStock({
            variantId: variantId || productId,
            locationId: storeId,
            locationType: 'STORE',
            qty: numericChange,
            type: mType,
            referenceId,
            referenceType: resolvedReferenceType,
            performedBy,
            session
        });
    } else {
        return removeStock({
            variantId: variantId || productId,
            locationId: storeId,
            locationType: 'STORE',
            qty: Math.abs(numericChange),
            type: mType,
            referenceId,
            referenceType: resolvedReferenceType,
            performedBy,
            session
        });
    }
};

/**
 * Handle damaged stock adjusts (Separated for now as per current schema)
 */
const adjustWarehouseStockDamaged = async ({ productId, variantId, warehouseId, qty, type, referenceId, referenceModel, performedBy, notes, session }) => {
    const damagedQty = toFiniteNumber(qty, 'damaged quantity');
    if (damagedQty <= 0) throw new Error('Quantity to damage must be positive');

    let inventory = await WarehouseInventory.findOne({ warehouseId, productId }).session(session);
    if (!inventory) {
        inventory = new WarehouseInventory({ warehouseId, productId, quantity: 0, damagedQuantity: 0 });
    }
    inventory.damagedQuantity += damagedQty;
    await inventory.save({ session });

    if (referenceId) {
        await StockMovement.create([{
            variantId: variantId || productId,
            qty: -damagedQty,
            type: type || StockMovementType.DAMAGED,
            referenceId,
            referenceType: referenceModel || 'Adjustment',
            fromLocation: warehouseId,
            performedBy
        }], { session });
    }

    return inventory;
};

const adjustStoreStockDamaged = async ({ productId, variantId, storeId, qty, type, referenceId, referenceModel, performedBy, notes, session }) => {
    const damagedQty = toFiniteNumber(qty, 'damaged quantity');
    if (damagedQty <= 0) throw new Error('Quantity to damage must be positive');

    let inventory = await StoreInventory.findOne({ storeId, productId }).session(session);
    if (!inventory) {
        inventory = new StoreInventory({ storeId, productId, quantity: 0, quantityAvailable: 0, damagedQuantity: 0 });
    }
    inventory.damagedQuantity += damagedQty;
    await inventory.save({ session });

    if (referenceId) {
        await StockMovement.create([{
            variantId: variantId || productId,
            qty: -damagedQty,
            type: type || StockMovementType.DAMAGED,
            referenceId,
            referenceType: referenceModel || 'Adjustment',
            fromLocation: storeId,
            performedBy
        }], { session });
    }

    return inventory;
};

/**
 * Reserve stock for an order (increase reservedQuantity, does NOT decrease physical quantity yet)
 */
const reserveStock = async ({ variantId, locationId, locationType, qty, session }) => {
    const delta = toFiniteNumber(qty);
    if (delta <= 0) throw new Error('Reservation quantity must be positive');

    const filter = { variantId: String(variantId) };
    let InventoryModel;

    if (locationType === 'STORE') {
        filter.storeId = locationId;
        InventoryModel = StoreInventory;
    } else {
        filter.warehouseId = locationId;
        InventoryModel = WarehouseInventory;
    }

    let inventory = await InventoryModel.findOne(filter).session(session);
    if (!inventory) {
        if (locationType === 'STORE') {
            inventory = new InventoryModel({ ...filter, quantity: 0, quantityAvailable: 0 });
        } else {
            inventory = new InventoryModel({ ...filter, quantity: 0, reservedQuantity: 0 });
        }
    }

    // Fetch Ledger balance as the true physical source
    const StockLedger = require('../models/stockLedger.model');
    const Item = require('../models/item.model');
    
    let truePhysicalQuantity = inventory.quantity || 0;
    
    const itemDoc = await Item.findOne({ "sizes._id": variantId }).session(session);
    if (itemDoc) {
        const variantEntry = itemDoc.sizes.id(variantId);
        const barcode = (variantEntry ? variantEntry.sku : null) || itemDoc.itemCode;
        
        const lastLog = await StockLedger.findOne({
            barcode,
            locationId,
            locationType
        }).sort({ createdAt: -1 }).session(session);
        
        if (lastLog) {
            truePhysicalQuantity = lastLog.balanceAfter;
        }
    }

    // Business Logic: Check if enough unreserved stock exists using true ledger balance
    const availableToReserve = truePhysicalQuantity - (inventory.reservedQuantity || 0);
    if (availableToReserve < delta) {
        throw new Error(`Insufficient free stock to reserve. Available: ${availableToReserve}, Requested: ${delta}`);
    }

    if (locationType === 'WAREHOUSE') {
        inventory.reservedQuantity = (inventory.reservedQuantity || 0) + delta;
    } else {
        // For Stores, we track it in quantityAvailable (Simplified logic)
        inventory.quantityAvailable = (inventory.quantityAvailable || 0) - delta;
    }

    inventory.lastUpdated = Date.now();
    await inventory.save({ session });
    return inventory;
};

/**
 * Release reserved stock (Cancel or Finalize)
 */
const releaseStock = async ({ variantId, locationId, locationType, qty, session }) => {
    const delta = toFiniteNumber(qty);
    
    const filter = { variantId: String(variantId) };
    let InventoryModel = locationType === 'STORE' ? StoreInventory : WarehouseInventory;
    if (locationType === 'STORE') filter.storeId = locationId;
    else filter.warehouseId = locationId;

    let inventory = await InventoryModel.findOne(filter).session(session);
    if (!inventory) return;

    if (locationType === 'WAREHOUSE') {
        inventory.reservedQuantity = Math.max(0, (inventory.reservedQuantity || 0) - delta);
    } else {
        inventory.quantityAvailable = Math.min(inventory.quantity, (inventory.quantityAvailable || 0) + delta);
    }

    await inventory.save({ session });
    return inventory;
};

/**
 * Bulk Add Stock for high-performance initialization (Opening Balance)
 */
const bulkAddStock = async (items, { referenceId, referenceType, performedBy, locationId, locationType, session, mode = 'ADD' }) => {
    if (!Array.isArray(items) || items.length === 0) return true;

    const StockLedger = require('../models/stockLedger.model');
    const InventoryModel = locationType === 'STORE' ? StoreInventory : WarehouseInventory;

    // 1. Fetch current inventory records for all barcodes in bulk
    const barcodes = [...new Set(items.map(i => i.barcode).filter(Boolean))];
    const currentInventories = await InventoryModel.find({
        barcode: { $in: barcodes },
        [locationType === 'STORE' ? 'storeId' : 'warehouseId']: locationId
    }).session(session);

    const invMap = new Map(currentInventories.map(inv => [inv.barcode, inv]));

    // 2. Map current balances from inventory records (much faster than aggregating ledger)
    const balanceMap = new Map(currentInventories.map(inv => [inv.barcode, inv.quantity || 0]));

    // 2.5 Fetch item metadata for movements in bulk
    const variantIds = [...new Set(items.map(i => i.variantId).filter(Boolean))];
    const itemsMetadata = await Item.find({ "sizes._id": { $in: variantIds } }).session(session).lean();
    const metadataMap = new Map();
    itemsMetadata.forEach(it => {
        (it.sizes || []).forEach(sz => {
            metadataMap.set(String(sz._id), {
                itemName: it.itemName,
                sku: sz.sku || it.itemCode,
                barcode: sz.barcode || sz.sku || it.itemCode,
                color: sz.color || it.color
            });
        });
    });

    // 3. Prepare Bulk Operations
    const invOps = [];
    const itemOps = [];
    const movements = [];
    const ledgerEntries = [];

    // PRE-AGGREGATE ITEMS TO PREVENT DUPLICATE KEY ERRORS IN SAME BATCH
    const aggregatedItemsMap = new Map();
    for (const item of items) {
        const barcode = item.barcode || item.sku;
        const qty = Number(item.qty || item.receivedQty || 0);
        if (qty <= 0) continue;
        
        if (aggregatedItemsMap.has(barcode)) {
            aggregatedItemsMap.get(barcode).qty += qty;
        } else {
            aggregatedItemsMap.set(barcode, { ...item, qty });
        }
    }
    const aggregatedItems = Array.from(aggregatedItemsMap.values());

    for (const item of aggregatedItems) {
        const qty = item.qty;
        const barcode = item.barcode || item.sku;
        const currentInv = invMap.get(barcode);
        const currentBalance = balanceMap.get(barcode) || 0;
        
        let newBalance, adjustmentQty;
        if (mode === 'SET') {
            newBalance = qty;
            adjustmentQty = newBalance - currentBalance;
        } else {
            adjustmentQty = qty;
            newBalance = currentBalance + adjustmentQty;
        }

        if (adjustmentQty === 0) continue; 

        // Inventory Update
        if (!currentInv) {
            const initData = { 
                barcode, 
                itemId: item.itemId, 
                variantId: item.variantId, 
                quantity: qty,
                [locationType === 'STORE' ? 'storeId' : 'warehouseId']: locationId
            };
            if (locationType === 'STORE') initData.quantityAvailable = qty;
            invOps.push({ insertOne: { document: initData } });
        } else {
            invOps.push({
                updateOne: {
                    filter: { _id: currentInv._id },
                    update: { 
                        $set: { 
                            quantity: newBalance, 
                            ...(locationType === 'STORE' ? { quantityAvailable: newBalance } : {}),
                            lastUpdated: Date.now() 
                        }
                    }
                }
            });
        }

        // Master Item Update (Always incremental for total global stock)
        itemOps.push({
            updateOne: {
                filter: { "sizes._id": item.variantId },
                update: { $inc: { "sizes.$.stock": adjustmentQty } }
            }
        });

        // Movement
        movements.push({
            variantId: item.variantId,
            qty: Math.abs(adjustmentQty),
            type: adjustmentQty > 0 ? StockMovementType.OPENING_BALANCE : StockMovementType.ADJUSTMENT,
            referenceId,
            referenceType: referenceType || 'OpeningBalance',
            toLocation: adjustmentQty > 0 ? locationId : null,
            fromLocation: adjustmentQty < 0 ? locationId : null,
            performedBy,
            ...(metadataMap.get(String(item.variantId)) || {})
        });

        // Ledger
        ledgerEntries.push({
            itemId: item.itemId,
            barcode,
            type: adjustmentQty > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(adjustmentQty),
            source: (referenceType || 'OpeningBalance').toUpperCase(),
            referenceId: referenceId.toString(),
            balanceAfter: newBalance,
            userId: performedBy,
            locationId,
            locationType,
            batchNo: 'DEFAULT'
        });
    }

    // 4. Execute Bulk Operations in Parallel for Speed
    await Promise.all([
        invOps.length > 0 ? InventoryModel.bulkWrite(invOps, { session }) : Promise.resolve(),
        itemOps.length > 0 ? Item.bulkWrite(itemOps, { session }) : Promise.resolve(),
        movements.length > 0 ? StockMovement.insertMany(movements, { session, ordered: false }) : Promise.resolve(),
        ledgerEntries.length > 0 ? StockLedger.insertMany(ledgerEntries, { session, ordered: false }) : Promise.resolve()
    ]);

    return true;
};

module.exports = {
    addStock,
    bulkAddStock,
    removeStock,
    transferStock,
    reserveStock,
    releaseStock,
    addInTransit,
    removeInTransit,
    adjustWarehouseStock,
    adjustStoreStock,
    adjustWarehouseStockDamaged,
    adjustStoreStockDamaged
};
