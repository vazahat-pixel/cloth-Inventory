const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Item = require('../src/models/item.model');
const StoreInventory = require('../src/models/storeInventory.model');
const Store = require('../src/models/store.model');

async function check() {
    await connectDB();
    try {
        const itemCount = await Item.countDocuments({});
        const invCount = await StoreInventory.countDocuments({});
        console.log(`Current items in DB: ${itemCount}`);
        console.log(`Current storeinventories in DB: ${invCount}`);
        
        if (invCount > 0) {
            console.log("\nFound store inventory! Sample:");
            const samples = await StoreInventory.find({}).limit(5).populate('itemId').lean();
            for (const sample of samples) {
                console.log(`- Item: ${sample.itemId?.itemName || 'N/A'} (Code: ${sample.barcode || 'N/A'}), Qty: ${sample.quantity}, StoreID: ${sample.storeId}`);
            }
        } else {
            console.log("No store inventory records found in MongoDB!");
        }

        console.log("\nListing active stores in DB:");
        const stores = await Store.find({}).lean();
        for (const store of stores) {
            const count = await StoreInventory.countDocuments({ storeId: store._id });
            console.log(`- Store: "${store.name}" (_id: ${store._id}, code: ${store.storeCode}), inventory records: ${count}, isActive: ${store.isActive}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

check();
