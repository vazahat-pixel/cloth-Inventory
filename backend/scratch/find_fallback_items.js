const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Item = require('../src/models/item.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        // Find some items with MRP 2499 or 2999 in the database to use as the second item for PTM-0028
        const items = await Item.find({ "sizes.mrp": 2499 }).limit(5).lean();
        console.log("=== Items with MRP 2499 ===");
        items.forEach(item => {
            console.log(`- ItemCode: ${item.itemCode}, Name: ${item.itemName}`);
            item.sizes.forEach(v => {
                if (v.mrp === 2499) {
                    console.log(`  * Barcode: ${v.barcode}, Size: ${v.size}, MRP: ${v.mrp}`);
                }
            });
        });

        const items2 = await Item.find({ "sizes.mrp": 1999 }).limit(5).lean();
        console.log("\n=== Items with MRP 1999 ===");
        items2.forEach(item => {
            console.log(`- ItemCode: ${item.itemCode}, Name: ${item.itemName}`);
            item.sizes.forEach(v => {
                if (v.mrp === 1999) {
                    console.log(`  * Barcode: ${v.barcode}, Size: ${v.size}, MRP: ${v.mrp}`);
                }
            });
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
