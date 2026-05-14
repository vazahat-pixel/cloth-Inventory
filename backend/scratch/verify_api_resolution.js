const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const storeInventoryService = require('../src/modules/storeInventory/storeInventory.service');

async function testResolution() {
    await connectDB();
    try {
        const adminUser = { role: 'admin' };
        console.log("Calling getStoreInventory...");
        const result = await storeInventoryService.getStoreInventory({ limit: 10 }, adminUser);
        
        console.log(`\nReturned ${result.inventory.length} rows.`);
        result.inventory.forEach((item, index) => {
            console.log(`${index + 1}. ItemCode: ${item.itemCode} | Name: ${item.itemName} | Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}`);
        });
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

testResolution();
