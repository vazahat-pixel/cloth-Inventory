/** stock.service.js — Stock adjustment business logic stub */

const StockHistory = require('../models/stockHistory.model');
const Product = require('../models/product.model');
const StoreInventory = require('../models/storeInventory.model');
const { StockHistoryType } = require('../core/enums');

/**
 * adjustStock — Adjusts stock for a product (warehouse or store level)
 * @param {Object} opts - { productId, storeId?, quantityChange, type, referenceId, referenceModel, performedBy, notes, session }
 */
const adjustStock = async ({ productId, storeId, quantityChange, type, referenceId, referenceModel, performedBy, notes, session }) => {
    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error(`Product ${productId} not found`);

    const quantityBefore = product.factoryStock;
    const quantityAfter = quantityBefore + quantityChange;
    if (quantityAfter < 0) throw new Error(`Insufficient stock for product ${product.sku}`);

    product.factoryStock = quantityAfter;
    await product.save({ session });

    await StockHistory.create([{
        productId, storeId, type, quantityBefore, quantityChange, quantityAfter,
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
        inventory = new StoreInventory({
            storeId,
            productId,
            quantityAvailable: 0
        });
    }

    const quantityBefore = inventory.quantityAvailable;
    const quantityAfter = quantityBefore + quantityChange;
    if (quantityAfter < 0) throw new Error(`Insufficient store stock for product ${productId}`);

    inventory.quantityAvailable = quantityAfter;
    inventory.lastUpdated = Date.now();
    await inventory.save({ session });

    await StockHistory.create([{
        productId, storeId, type, quantityBefore, quantityChange, quantityAfter,
        referenceId, referenceModel, notes, performedBy,
    }], { session });

    return { quantityBefore, quantityAfter };
};

module.exports = { adjustStock, adjustStoreStock };
