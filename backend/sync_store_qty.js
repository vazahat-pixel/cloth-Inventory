require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const StoreInventory = require('./src/models/storeInventory.model');

        // Find all records where quantityAvailable != quantity
        // The most robust way is to just sync all:
        const items = await StoreInventory.find({});
        let count = 0;
        for (const item of items) {
            if (item.quantity !== item.quantityAvailable) {
                item.quantityAvailable = item.quantity;
                await item.save();
                count++;
            }
        }
        console.log(`Synced quantityAvailable to quantity for ${count} items.`);

    } catch(e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
run();
