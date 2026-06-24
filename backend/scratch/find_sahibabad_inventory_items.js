const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const StoreInventory = require('../src/models/storeInventory.model');
const Item = require('../src/models/item.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecbe2cf04d7249bd11ae45';
        console.log("=== SAHIBABAD INVENTORY AUDIT ===");

        const inventory = await StoreInventory.find({ storeId, quantity: { $gt: 5 } }).limit(20).lean();
        console.log(`Found ${inventory.length} items with stock > 5 in Sahibabad:`);

        for (const inv of inventory) {
            const parent = await Item.findOne({ "sizes.barcode": inv.barcode }).lean();
            if (parent) {
                const v = parent.sizes.find(sz => sz.barcode === inv.barcode);
                console.log(`- Barcode: ${inv.barcode} | Stock: ${inv.quantity} | MRP: ${v.mrp} | Item Name: ${parent.itemName} | SKU: ${v.sku}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
