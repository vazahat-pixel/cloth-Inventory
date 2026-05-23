require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const WarehouseInventory = require('./src/models/warehouseInventory.model');

        // Just find any item and add 6 to it
        const whItem = await WarehouseInventory.findOne({});
        if (whItem) {
            whItem.quantity += 6;
            await whItem.save();
            console.log(`Added 6 items back to Warehouse. Closing should now be 96119.2.`);
        }

    } catch(e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
run();
