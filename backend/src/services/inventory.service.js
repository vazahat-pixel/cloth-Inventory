const mongoose = require('mongoose');
const { adjustStoreStock } = require('./stock.service');
const { StockMovementType } = require('../core/enums');
const { withTransaction } = require('./transaction.service');
const StoreInventory = require('../models/storeInventory.model');

/**
 * reconcileStock - Reconcile system stock with physical count
 * @param {string} storeId
 * @param {Array} items - [{ productId|variantId|barcode, physicalQty }]
 * @param {string} userId
 */
const reconcileStock = async (storeId, items, userId) => {
    return await withTransaction(async (session) => {
        const results = [];
        const auditReferenceId = new mongoose.Types.ObjectId();

        for (const item of items) {
            const { physicalQty } = item;
            const variantId = item.variantId || item.productId;
            const barcode = item.barcode;

            const lookupOr = [];
            if (variantId) {
                lookupOr.push({ variantId: String(variantId) });
                if (mongoose.Types.ObjectId.isValid(variantId)) {
                    lookupOr.push({ itemId: variantId });
                }
            }
            if (barcode) lookupOr.push({ barcode: String(barcode) });

            if (lookupOr.length === 0) {
                throw new Error('Each audit item must include variantId, productId, or barcode');
            }

            const inventory = await StoreInventory.findOne({
                storeId,
                $or: lookupOr,
            }).session(session);

            const currentQty = inventory
                ? (typeof inventory.quantityAvailable === 'number' ? inventory.quantityAvailable : inventory.quantity || 0)
                : 0;
            const difference = Number(physicalQty) - currentQty;

            if (difference !== 0) {
                await adjustStoreStock({
                    productId: inventory?.variantId || variantId,
                    variantId: inventory?.variantId || variantId,
                    storeId,
                    quantityChange: difference,
                    type: StockMovementType.ADJUSTMENT,
                    referenceId: auditReferenceId,
                    referenceModel: 'Audit',
                    performedBy: userId,
                    notes: `Stock Audit Reconciliation (Physical: ${physicalQty}, Previous: ${currentQty})`,
                    session
                });

                results.push({
                    variantId: inventory?.variantId || variantId,
                    barcode: inventory?.barcode || barcode,
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
