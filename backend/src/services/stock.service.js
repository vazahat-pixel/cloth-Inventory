const StoreInventory = require('../models/storeInventory.model');
const WarehouseInventory = require('../models/warehouseInventory.model');
const StockMovement = require('../models/stockMovement.model');
const Product = require('../models/product.model');
const Store = require('../models/store.model');
const Warehouse = require('../models/warehouse.model');
const systemConfigService = require('../modules/systemConfig/systemConfig.service');
const { createAuditLog } = require('../middlewares/audit.middleware');

/**
 * Core internal function to update inventory collection based on location type
 */
const _updateInventory = async ({ variantId, locationId, locationType, qty, session }) => {
    // 1. Strict ID Validation
    if (locationType === 'STORE') {
        const storeExists = await Store.exists({ _id: locationId });
        if (!storeExists) throw new Error(`Invalid Store ID: ${locationId}`);
    } else if (locationType === 'WAREHOUSE') {
        const warehouseExists = await Warehouse.exists({ _id: locationId });
        if (!warehouseExists) throw new Error(`Invalid Warehouse ID: ${locationId}`);
    } else {
        throw new Error('Invalid location type: ' + locationType);
    }

    const filter = { productId: variantId };
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
        if (qty < 0) throw new Error(`Insufficient stock for product ${variantId} at ${locationType}`);
        
        const initData = { ...filter, quantity: 0 };
        if (locationType === 'STORE') initData.quantityAvailable = 0;
        
        inventory = new InventoryModel(initData);
    }

    // 2. Negative Stock Control
    const allowNegative = await systemConfigService.getConfigByKey('allowNegativeStock', false);
    const newQty = (inventory.quantity || 0) + qty;
    
    if (!allowNegative && newQty < 0) {
        throw new Error(`Negative stock not allowed. Requested: ${qty}, Available: ${inventory.quantity}`);
    }

    inventory.quantity = newQty;
    if (locationType === 'STORE') {
        inventory.quantityAvailable = newQty;
    }
    inventory.lastUpdated = Date.now();
    
    await inventory.save({ session });
    return inventory;
};

/**
 * Add stock to a location (Creation/Purchase/Return)
 */
const addStock = async ({ variantId, locationId, locationType, qty, type, referenceId, referenceType, performedBy, session }) => {
    if (qty <= 0) throw new Error('Quantity to add must be positive');

    const filter = { productId: variantId };
    if (locationType === 'STORE') filter.storeId = locationId;
    if (locationType === 'WAREHOUSE') filter.warehouseId = locationId;
    
    const beforeInv = await (locationType === 'STORE' ? StoreInventory : WarehouseInventory).findOne(filter).session(session);
    const before = beforeInv ? beforeInv.toObject() : null;

    const inventory = await _updateInventory({ variantId, locationId, locationType, qty, session });

    await StockMovement.create([{
        variantId,
        qty,
        type,
        referenceId,
        referenceType,
        toLocation: locationId,
        performedBy
    }], { session });

    // Audit Logging
    await createAuditLog({
        action: 'ADD_STOCK',
        module: 'STOCK',
        performedBy,
        targetId: inventory._id,
        targetModel: locationType === 'STORE' ? 'StoreInventory' : 'WarehouseInventory',
        before,
        after: inventory.toObject(),
        session
    });

    return inventory;
};

/**
 * Remove stock from a location (Sale/Loss)
 */
const removeStock = async ({ variantId, locationId, locationType, qty, type, referenceId, referenceType, performedBy, session }) => {
    if (qty <= 0) throw new Error('Quantity to remove must be positive');

    const filter = { productId: variantId };
    if (locationType === 'STORE') filter.storeId = locationId;
    if (locationType === 'WAREHOUSE') filter.warehouseId = locationId;
    
    const beforeInv = await (locationType === 'STORE' ? StoreInventory : WarehouseInventory).findOne(filter).session(session);
    const before = beforeInv ? beforeInv.toObject() : null;

    const inventory = await _updateInventory({ variantId, locationId, locationType, qty: -qty, session });

    await StockMovement.create([{
        variantId,
        qty: -qty,
        type,
        referenceId,
        referenceType,
        fromLocation: locationId,
        performedBy
    }], { session });

    // Audit Logging
    await createAuditLog({
        action: 'REMOVE_STOCK',
        module: 'STOCK',
        performedBy,
        targetId: inventory._id,
        targetModel: locationType === 'STORE' ? 'StoreInventory' : 'WarehouseInventory',
        before,
        after: inventory.toObject(),
        session
    });

    return inventory;
};

/**
 * Transfer stock between locations
 */
const transferStock = async ({ variantId, fromLocationId, fromLocationType, toLocationId, toLocationType, qty, type = 'TRANSFER', referenceId, referenceType = 'Dispatch', performedBy, session }) => {
    if (qty <= 0) throw new Error('Quantity to transfer must be positive');

    // 1. Remove from source
    await _updateInventory({ variantId, locationId: fromLocationId, locationType: fromLocationType, qty: -qty, session });

    // 2. Add to destination
    await _updateInventory({ variantId, locationId: toLocationId, locationType: toLocationType, qty, session });

    // 3. Log single movement record for transfer
    await StockMovement.create([{
        variantId,
        qty,
        type,
        referenceId,
        referenceType,
        fromLocation: fromLocationId,
        toLocation: toLocationId,
        performedBy
    }], { session });

    return true;
};

/**
 * Backward compatibility helpers
 */
const adjustWarehouseStock = async ({ productId, variantId, warehouseId, quantityChange, type, referenceId, referenceModel, performedBy, notes, session }) => {
    if (quantityChange > 0) {
        return addStock({
            variantId: variantId || productId,
            locationId: warehouseId,
            locationType: 'WAREHOUSE',
            qty: quantityChange,
            type: 'PURCHASE', // Mapping legacy type to movement type
            referenceId,
            referenceType: referenceModel === 'Purchase' ? 'Purchase' : 'Dispatch',
            performedBy,
            session
        });
    } else {
        return removeStock({
            variantId: variantId || productId,
            locationId: warehouseId,
            locationType: 'WAREHOUSE',
            qty: Math.abs(quantityChange),
            type: 'SALE', // Mapping legacy
            referenceId,
            referenceType: referenceModel === 'Sale' ? 'Sale' : 'Dispatch',
            performedBy,
            session
        });
    }
};

const adjustStoreStock = async ({ productId, variantId, storeId, quantityChange, type, referenceId, referenceModel, performedBy, notes, session }) => {
    // Map existing StockHistoryType to StockMovement Type
    let mType = 'SALE';
    if (type === 'QC_APPROVED') mType = 'QC_APPROVED';
    if (type === 'RETURN') mType = 'RETURN';

    if (quantityChange > 0) {
        return addStock({
            variantId: variantId || productId,
            locationId: storeId,
            locationType: 'STORE',
            qty: quantityChange,
            type: mType,
            referenceId,
            referenceType: referenceModel === 'Sale' ? 'Sale' : (referenceModel === 'QC' ? 'QC' : 'Return'),
            performedBy,
            session
        });
    } else {
        return removeStock({
            variantId: variantId || productId,
            locationId: storeId,
            locationType: 'STORE',
            qty: Math.abs(quantityChange),
            type: mType,
            referenceId,
            referenceType: referenceModel === 'Sale' ? 'Sale' : 'Return',
            performedBy,
            session
        });
    }
};

/**
 * Handle damaged stock adjusts (Separated for now as per current schema)
 */
const adjustWarehouseStockDamaged = async ({ productId, variantId, warehouseId, qty, type, referenceId, referenceModel, performedBy, notes, session }) => {
    let inventory = await WarehouseInventory.findOne({ warehouseId, productId }).session(session);
    if (!inventory) {
        inventory = new WarehouseInventory({ warehouseId, productId, quantity: 0, damagedQuantity: 0 });
    }
    inventory.damagedQuantity += qty;
    await inventory.save({ session });
    return inventory;
};

const adjustStoreStockDamaged = async ({ productId, variantId, storeId, qty, type, referenceId, referenceModel, performedBy, notes, session }) => {
    let inventory = await StoreInventory.findOne({ storeId, productId }).session(session);
    if (!inventory) {
        inventory = new StoreInventory({ storeId, productId, quantity: 0, quantityAvailable: 0, damagedQuantity: 0 });
    }
    inventory.damagedQuantity += qty;
    await inventory.save({ session });
    return inventory;
};

module.exports = {
    addStock,
    removeStock,
    transferStock,
    adjustWarehouseStock,
    adjustStoreStock,
    adjustWarehouseStockDamaged,
    adjustStoreStockDamaged
};
