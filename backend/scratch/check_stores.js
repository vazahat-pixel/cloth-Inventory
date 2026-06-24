require('dotenv').config();
const mongoose = require('mongoose');
const Store = require('../src/models/store.model');
const Warehouse = require('../src/models/warehouse.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const stores = await Store.find({}).lean();
        const warehouses = await Warehouse.find({}).lean();
        console.log(`Stores in DB (${stores.length}):`);
        stores.forEach(s => console.log(`- ${s.name} | ID: ${s._id} | Code: ${s.storeCode || s.code}`));
        console.log(`\nWarehouses in DB (${warehouses.length}):`);
        warehouses.forEach(w => console.log(`- ${w.name} | ID: ${w._id} | Code: ${w.code}`));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
