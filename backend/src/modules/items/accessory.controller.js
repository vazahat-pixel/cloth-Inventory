const Item = require('../../models/item.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const stockLedgerService = require('../inventory/stockLedger.service');
const { withTransaction } = require('../../services/transaction.service');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * DIRECT ACCESSORY ENTRY
 * Purpose: Directly add stock for items like Ties, Belts to Warehouse without Supplier/Production flows.
 */
const directAccessoryEntry = async (req, res, next) => {
    try {
        const result = await withTransaction(async (session) => {
            const { 
                itemCode, 
                itemName, 
                brandId, 
                categoryId, 
                variants, // Array of { size, color, costPrice, salePrice, mrp, initialQty }
                warehouseId 
            } = req.body;

            // 1. Create or Find the Item
            let item = await Item.findOne({ itemCode }).session(session);
            
            if (!item) {
                item = new Item({
                    itemCode,
                    itemName,
                    brand: brandId,
                    groupIds: [categoryId],
                    type: 'ACCESSORY',
                    sizes: variants.map(v => ({
                        size: v.size,
                        sku: `${itemCode}-${v.size}-${v.color || ''}`.toUpperCase(),
                        costPrice: v.costPrice,
                        salePrice: v.salePrice,
                        mrp: v.mrp,
                        stock: 0
                    }))
                });
                await item.save({ session });
            }

            const inwardResults = [];

            // 2. Add Stock for each variant
            for (const v of variants) {
                const variant = item.sizes.find(sz => sz.size === v.size);
                if (!variant) continue;

                const barcode = variant.sku;

                // A. Update Physical Table
                let inv = await WarehouseInventory.findOne({ warehouseId, variantId: String(variant._id) }).session(session);
                if (inv) {
                    inv.quantity += v.initialQty;
                } else {
                    inv = new WarehouseInventory({
                        warehouseId,
                        itemId: item._id,
                        variantId: String(variant._id),
                        barcode: barcode,
                        quantity: v.initialQty
                    });
                }
                await inv.save({ session });

                // B. Log to Stock Ledger
                await stockLedgerService.logMovement({
                    itemId: item._id,
                    variantId: variant._id,
                    barcode: barcode,
                    locationId: warehouseId,
                    locationType: 'WAREHOUSE',
                    type: 'INWARD',
                    qty: v.initialQty,
                    referenceType: 'DirectAccessoryEntry',
                    referenceId: item._id,
                    performedBy: req.user._id,
                    notes: 'Manual accessory stock injection'
                }, session);

                inwardResults.push({ barcode, qty: v.initialQty });
            }

            return { item, inwardResults };
        });

        return sendSuccess(res, result, 'Accessory stock added successfully');
    } catch (e) {
        next(e);
    }
};

module.exports = { directAccessoryEntry };
