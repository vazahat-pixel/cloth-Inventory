/** stock.service.js — Stock adjustment business logic stub */

const StockHistory = require('../models/stockHistory.model');
const Product = require('../models/product.model');
const StoreInventory = require('../models/storeInventory.model');
const WarehouseInventory = require('../models/warehouseInventory.model');

/**
 * adjustWarehouseStock
 */
const adjustWarehouseStock = async ({ productId, warehouseId, quantityChange, type, referenceId, referenceModel, performedBy, notes, session }) => {
    let inventory = await WarehouseInventory.findOne({ warehouseId, productId }).session(session);

    if (!inventory) {
        if (quantityChange < 0) throw new Error(`Insufficient warehouse stock for product ${productId}`);
        inventory = new WarehouseInventory({
            warehouseId,
            productId,
            quantity: 0
        });
    }

    const quantityBefore = inventory.quantity || 0;
    const quantityAfter = quantityBefore + quantityChange;
    if (quantityAfter < 0) throw new Error(`Insufficient warehouse stock for product ${productId}`);

    inventory.quantity = quantityAfter;
    inventory.lastUpdated = Date.now();
    await inventory.save({ session });

    await StockHistory.create([{
        productId, type, quantityBefore, quantityChange, quantityAfter,
        referenceId, referenceModel, notes, performedBy,
    }], { session });

    return { quantityBefore, quantityAfter };
};

/**
 * adjustStoreStock — Adjusts stock at a specific store
 */
const adjustStoreStock = async ({ productId, storeId, quantityChange, type, referenceId, referenceModel, performedBy, notes, session }) => {
    let inventory = await StoreInventory.findOne({ storeId, productId }).session(session);

    if (!inventory) {
        if (quantityChange < 0) throw new Error(`Insufficient store stock for product ${productId}`);
        inventory = new StoreInventory({
            storeId,
            productId,
            quantity: 0
        });
    }

    const quantityBefore = inventory.quantity || 0;
    const quantityAfter = quantityBefore + quantityChange;
    if (quantityAfter < 0) throw new Error(`Insufficient store stock for product ${productId}`);

    inventory.quantity = quantityAfter;
    inventory.lastUpdated = Date.now();
    await inventory.save({ session });

    await StockHistory.create([{
        productId, storeId, type, quantityBefore, quantityChange, quantityAfter,
        referenceId, referenceModel, notes, performedBy,
    }], { session });

    return { quantityBefore, quantityAfter };
};

module.exports = { adjustWarehouseStock, adjustStoreStock };
