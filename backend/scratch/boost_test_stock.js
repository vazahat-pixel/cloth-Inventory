const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Dispatch = require('../src/models/dispatch.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');

async function test() {
    await connectDB();
    
    const ids = ['6a0c3bd0a95872c0bfc2e6e2', '6a0c3e71a95872c0bfc2e806'];
    const dispatches = await Dispatch.find({ _id: { $in: ids } });
    
    let count = 0;
    for (const d of dispatches) {
        for (const item of d.items) {
            // Find or create WarehouseInventory for this variant at source warehouse
            let inv = await WarehouseInventory.findOne({
                warehouseId: d.sourceWarehouseId,
                variantId: item.variantId
            });
            
            if (!inv) {
                inv = new WarehouseInventory({
                    warehouseId: d.sourceWarehouseId,
                    variantId: item.variantId,
                    barcode: item.barcode,
                    itemId: item.itemId,
                    quantity: 100,
                    reservedQuantity: 0
                });
            } else {
                inv.quantity = 100;
            }
            await inv.save();
            count++;
        }
    }
    
    console.log(`Successfully boosted stock for ${count} variants to 100 units!`);
    await mongoose.disconnect();
}

test().catch(console.error);
