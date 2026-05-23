require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Store = require('./src/models/store.model');
        const StoreInventory = require('./src/models/storeInventory.model');
        const WarehouseInventory = require('./src/models/warehouseInventory.model');

        // Fetch stores
        const stores = await Store.find({}).lean();
        const gtb = stores.find(s => s.name.includes('GTB NAGAR'));
        const sonipat = stores.find(s => s.name.includes('SONIPAT'));

        // Check StoreInventory
        const gtbStock = await StoreInventory.aggregate([
            { $match: { storeId: gtb._id } },
            { $group: { _id: null, total: { $sum: "$quantity" } } }
        ]);

        const sonipatStock = await StoreInventory.aggregate([
            { $match: { storeId: sonipat._id } },
            { $group: { _id: null, total: { $sum: "$quantity" } } }
        ]);

        const whStock = await WarehouseInventory.aggregate([
            { $group: { _id: null, total: { $sum: "$quantity" } } }
        ]);

        console.log(`GTB Nagar Store Current Physical Stock: ${gtbStock[0]?.total || 0}`);
        console.log(`Sonipat Store Current Physical Stock: ${sonipatStock[0]?.total || 0}`);
        console.log(`Warehouse Current Physical Stock: ${whStock[0]?.total || 0}`);

    } catch(e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
run();
