const mongoose = require('mongoose');
require('dotenv').config();
const WarehouseInventory = require('./src/models/warehouseInventory.model');
const Store = require('./src/models/store.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const stores = await Store.find();
    const storeIds = stores.map(s => s._id);
    const badWhInv = await WarehouseInventory.find({ warehouseId: { $in: storeIds } });
    console.log(`Found ${badWhInv.length} WarehouseInventory records with a Store ID as warehouseId.`);
    
    let totalNegative = 0;
    for (let inv of badWhInv) {
        totalNegative += inv.quantity;
    }
    console.log('Total stock in these bad records:', totalNegative);
    process.exit(0);
}
run();
