const mongoose = require('mongoose');
require('dotenv').config();
const WarehouseInventory = require('./src/models/warehouseInventory.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const docs = await WarehouseInventory.find({ damagedQuantity: { $gt: 0 } });
    console.log('Docs with damagedQuantity > 0:', docs.length);
    process.exit(0);
}
run();
