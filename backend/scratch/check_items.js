const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Item = require('../src/models/item.model');

async function check() {
    await connectDB();
    try {
        console.log("Checking database for items with DA prefix...");
        const items = await Item.find({ itemCode: { $regex: '^DA', $options: 'i' } }).limit(5).lean();
        console.log(`Found ${items.length} items starting with DA:`);
        console.log(JSON.stringify(items, null, 2));

        const totalItems = await Item.countDocuments({});
        console.log(`Total items in master database: ${totalItems}`);

        // Check if there's any item matching DA2472 specifically
        const specificItem = await Item.findOne({ itemCode: 'DA2472' }).lean();
        console.log(`DA2472 search result:`, specificItem);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

check();
