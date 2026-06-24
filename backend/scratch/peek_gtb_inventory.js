const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const StoreInventory = require('../src/models/storeInventory.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';
        const inventory = await StoreInventory.find({ storeId }).lean();
        
        console.log(`GTB Showroom Inventory Records Count: ${inventory.length}`);
        let totalQty = 0;
        let totalAvail = 0;
        inventory.forEach(inv => {
            totalQty += inv.quantity;
            totalAvail += inv.quantityAvailable;
        });

        console.log(`Total Quantity: ${totalQty}`);
        console.log(`Total Available: ${totalAvail}`);

        // Print top items with positive quantity
        const sorted = inventory.filter(i => i.quantity > 0).sort((a,b) => b.quantity - a.quantity);
        console.log("\nTop items in stock:");
        sorted.slice(0, 10).forEach(i => {
            console.log(`- SKU: ${i.cleanSku} | Name: ${i.itemName} | Qty: ${i.quantity}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
