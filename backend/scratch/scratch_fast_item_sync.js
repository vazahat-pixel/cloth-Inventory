const mongoose = require('mongoose');
require('dotenv').config();

// Register models
const Item = require('../src/models/item.model');
const StoreInventory = require('../src/models/storeInventory.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');

async function run() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    console.log('Aggregating store inventories...');
    const storeStockGroups = await StoreInventory.aggregate([
        { $group: { _id: '$variantId', total: { $sum: '$quantityAvailable' } } }
    ]);
    
    console.log('Aggregating warehouse inventories...');
    const warehouseStockGroups = await WarehouseInventory.aggregate([
        { $group: { _id: '$variantId', total: { $sum: '$quantity' } } }
    ]);

    const variantStockMap = new Map();

    for (const sg of storeStockGroups) {
        if (sg._id) {
            const variantId = String(sg._id);
            variantStockMap.set(variantId, (variantStockMap.get(variantId) || 0) + sg.total);
        }
    }

    for (const wg of warehouseStockGroups) {
        if (wg._id) {
            const variantId = String(wg._id);
            variantStockMap.set(variantId, (variantStockMap.get(variantId) || 0) + wg.total);
        }
    }

    console.log('Fetching all items...');
    const items = await Item.find().lean();
    console.log(`Found ${items.length} items. Preparing bulk updates...`);

    const bulkOps = [];
    let totalMismatches = 0;

    for (const item of items) {
        let needsUpdate = false;
        const updatedSizes = (item.sizes || []).map(sz => {
            const variantId = String(sz._id);
            const expectedStock = variantStockMap.get(variantId) || 0;
            if (sz.stock !== expectedStock) {
                needsUpdate = true;
                totalMismatches++;
                return { ...sz, stock: expectedStock };
            }
            return sz;
        });

        if (needsUpdate) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: item._id },
                    update: { $set: { sizes: updatedSizes } }
                }
            });
        }
    }

    console.log(`Found ${totalMismatches} sizes with stock mismatch across ${bulkOps.length} items.`);

    if (bulkOps.length > 0) {
        console.log('Running bulk update on items...');
        const result = await Item.bulkWrite(bulkOps);
        console.log(`Successfully updated ${result.modifiedCount} items!`);
    } else {
        console.log('No item stock total mismatches found. All items are in sync!');
    }

    await mongoose.disconnect();
    console.log('Disconnected!');
}

run().catch(console.error);
