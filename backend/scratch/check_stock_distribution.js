const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const StoreInventory = require('../src/models/storeInventory.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');
const Store = require('../src/models/store.model');
const Warehouse = require('../src/models/warehouse.model');

async function checkDistribution() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const storeStats = await StoreInventory.aggregate([
            { $group: { _id: "$storeId", total: { $sum: "$quantity" }, rows: { $sum: 1 } } }
        ]);
        
        const warehouseStats = await WarehouseInventory.aggregate([
            { $group: { _id: "$warehouseId", total: { $sum: "$quantity" }, rows: { $sum: 1 } } }
        ]);

        console.log('--- Store Stats ---');
        for (const s of storeStats) {
            const store = await Store.findById(s._id);
            console.log(`Store: ${store ? store.name : s._id}, Total: ${s.total}, Rows: ${s.rows}`);
        }

        console.log('--- Warehouse Stats ---');
        for (const w of warehouseStats) {
            const warehouse = await Warehouse.findById(w._id);
            console.log(`Warehouse: ${warehouse ? warehouse.name : w._id}, Total: ${w.total}, Rows: ${w.rows}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkDistribution();
