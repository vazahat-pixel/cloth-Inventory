const { adjustStoreStock } = require('./stock.service');
const { StockHistoryType } = require('../core/enums');
const { withTransaction } = require('./transaction.service');
const StoreInventory = require('../models/storeInventory.model');

/**
 * reconcileStock - Reconcile system stock with physical count
 * @param {string} storeId
 * @param {Array} items - [{ productId, physicalQty }]
 * @param {string} userId
 */
const reconcileStock = async (storeId, items, userId) => {
    return await withTransaction(async (session) => {
        const results = [];

        for (const item of items) {
            const { productId, physicalQty } = item;

            // 1. Get current system stock
            const inventory = await StoreInventory.findOne({ storeId, productId }).session(session);
            const currentQty = inventory ? inventory.quantity : 0;

            // 2. Calculate difference
            const difference = Number(physicalQty) - currentQty;

            if (difference !== 0) {
                // 3. Adjust stock accordingly
                await adjustStoreStock({
                    productId,
                    storeId,
                    quantityChange: difference,
                    type: StockHistoryType.AUDIT,
                    performedBy: userId,
                    notes: `Stock Audit Reconciliation (Physical: ${physicalQty}, Previous: ${currentQty})`,
                    session
                });

                results.push({
                    productId,
                    previousQty: currentQty,
                    newQty: physicalQty,
                    adjustment: difference
                });
            }
        }

        return results;
    });
};

module.exports = {
    reconcileStock
};
