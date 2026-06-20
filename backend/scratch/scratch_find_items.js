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
                { itemCode: { $regex: '0006947', $options: 'i' } },
                { itemName: { $regex: '0006947', $options: 'i' } },
                { "sizes.sku": { $regex: '0006947', $options: 'i' } },
                { "sizes.barcode": { $regex: '0006947', $options: 'i' } }
            ]
        }).populate('hsCodeId');

        console.log(`Found ${items.length} items:`);
        for (const item of items) {
            console.log(`- Item Name: ${item.itemName}`);
            console.log(`  Item Code: ${item.itemCode}`);
            console.log(`  Type: ${item.type}`);
            console.log(`  Sizes:`, JSON.stringify(item.sizes, null, 2));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
