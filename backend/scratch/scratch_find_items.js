const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('../src/models/item.model');
const HSNCode = require('../src/models/hsnCode.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const items = await Item.find({
            $or: [
                { itemName: { $regex: 'TS25-0010', $options: 'i' } },
                { itemName: { $regex: 'TS25-0048', $options: 'i' } }
            ]
        }).populate('hsCodeId');

        console.log(`Found ${items.length} items:`);
        for (const item of items) {
            console.log(`- Item Name: ${item.itemName}`);
            console.log(`  Item Code: ${item.itemCode}`);
            console.log(`  HSN Plain (hsnCode): "${item.hsnCode}"`);
            console.log(`  HSN Ref (hsCodeId):`, item.hsCodeId);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
