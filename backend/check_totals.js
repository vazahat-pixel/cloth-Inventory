require('dotenv').config();
const mongoose = require('mongoose');

const WarehouseInventory = require('./src/models/warehouseInventory.model');
const StoreInventory = require('./src/models/storeInventory.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const warehouseTotal = await WarehouseInventory.aggregate([
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);

        const storeTotal = await StoreInventory.aggregate([
            { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
        ]);

        console.log('Warehouse Total Qty:', warehouseTotal[0]?.total || 0);
        console.log('Store Total Qty:', storeTotal[0]?.total || 0);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
