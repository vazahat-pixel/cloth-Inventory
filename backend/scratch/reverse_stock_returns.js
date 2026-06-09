const mongoose = require('mongoose');
require('dotenv').config();

const StockReturn = require('../src/models/stockReturn.model');
const StoreInventory = require('../src/models/storeInventory.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');
const StockMovement = require('../src/models/stockMovement.model');
const StockLedger = require('../src/models/stockLedger.model');
const Item = require('../src/models/item.model');
const Counter = require('../src/models/counter.model');

async function runReversion() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // Find all stock returns
        const returns = await StockReturn.find();
        console.log(`Found ${returns.length} stock returns to reverse.`);

        for (const stockReturn of returns) {
            console.log(`\nReversing Return: ${stockReturn.returnNumber} (ID: ${stockReturn._id}, Status: ${stockReturn.status})`);
            const storeId = stockReturn.sourceStoreId;
            const warehouseId = stockReturn.destinationWarehouseId;

            for (const line of stockReturn.items) {
                const variantId = line.variantId;
                const qty = line.qty;

                // 1. Resolve barcode and itemId for this variant
                const itemDoc = await Item.findOne({ "sizes._id": variantId });
                if (!itemDoc) {
                    console.error(`ERROR: Item doc not found for variantId ${variantId}. Skipping item update.`);
                    continue;
                }
                const variant = itemDoc.sizes.id(variantId);
                const barcode = (variant ? (variant.sku || variant.barcode) : null) || itemDoc.itemCode;

                console.log(`Item: ${itemDoc.itemName}, Variant: ${variantId}, Barcode: ${barcode}, Qty: ${qty}`);

                // 2. Add back to Store physical stock & available stock
                const storeInv = await StoreInventory.findOne({ storeId, barcode });
                if (storeInv) {
                    const beforeQty = storeInv.quantity || 0;
                    storeInv.quantity = (storeInv.quantity || 0) + qty;
                    storeInv.quantityAvailable = (storeInv.quantityAvailable || 0) + qty;
                    await storeInv.save();
                    console.log(`  - Store Stock Updated. Location: ${storeId}. Qty: ${beforeQty} -> ${storeInv.quantity}`);
                } else {
                    console.log(`  - Warning: Store inventory record not found at store: ${storeId} for barcode: ${barcode}. Creating one.`);
                    const newStoreInv = new StoreInventory({
                        storeId,
                        itemId: itemDoc._id,
                        variantId: String(variantId),
                        barcode,
                        quantity: qty,
                        quantityAvailable: qty
                    });
                    await newStoreInv.save();
                }

                // 3. Deduct from Warehouse physical stock or in-transit stock
                const whInv = await WarehouseInventory.findOne({ warehouseId, barcode });
                if (whInv) {
                    if (stockReturn.status === 'DISPATCHED') {
                        const beforeTransit = whInv.quantityInTransit || 0;
                        whInv.quantityInTransit = Math.max(0, (whInv.quantityInTransit || 0) - qty);
                        await whInv.save();
                        console.log(`  - Warehouse In-Transit Updated. Location: ${warehouseId}. InTransit: ${beforeTransit} -> ${whInv.quantityInTransit}`);
                    } else if (stockReturn.status === 'RECEIVED') {
                        const beforeQty = whInv.quantity || 0;
                        whInv.quantity = Math.max(0, (whInv.quantity || 0) - qty);
                        await whInv.save();
                        console.log(`  - Warehouse Stock Updated. Location: ${warehouseId}. Qty: ${beforeQty} -> ${whInv.quantity}`);
                    }
                } else {
                    console.log(`  - Warning: Warehouse inventory record not found at warehouse: ${warehouseId} for barcode: ${barcode}. No warehouse deduction needed.`);
                }
            }

            // 4. Delete the StockReturn document
            await StockReturn.deleteOne({ _id: stockReturn._id });
            console.log(`  - Deleted StockReturn document.`);

            // 5. Delete associated StockMovements
            const movementDel = await StockMovement.deleteMany({ referenceId: stockReturn._id, referenceType: 'StockReturn' });
            console.log(`  - Deleted ${movementDel.deletedCount} StockMovement records.`);

            // 6. Delete associated StockLedgers
            const ledgerDel = await StockLedger.deleteMany({ referenceId: String(stockReturn._id) });
            console.log(`  - Deleted ${ledgerDel.deletedCount} StockLedger records.`);
        }

        // 7. Reset the sequence counters
        const counterDel1 = await Counter.deleteOne({ name: 'STOCK_RETURN_2026' });
        const counterDel2 = await Counter.deleteOne({ name: 'PURCHASE_RETURN_2026' });
        console.log(`\nDeleted counter sequences: STOCK_RETURN_2026: ${counterDel1.deletedCount}, PURCHASE_RETURN_2026: ${counterDel2.deletedCount}`);

        console.log('\nREVERSION COMPLETED SUCCESSFULLY.');

    } catch (err) {
        console.error('REVERSION FAILED:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

runReversion();
