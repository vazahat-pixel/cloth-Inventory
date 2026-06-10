const mongoose = require('mongoose');
require('dotenv').config();

// Register models
const HSNCode = require('../src/models/hsnCode.model');
const Item = require('../src/models/item.model');

async function run() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // 1. Let's find all HSN Codes
    console.log('--- ALL HSN CODES ---');
    const hsnCodes = await HSNCode.find({});
    hsnCodes.forEach(h => {
        console.log(`Code: ${h.code}, GST%: ${h.gstPercent}, Desc: ${h.description}`);
    });

    // 2. Let's count items with/without HSN code
    const totalItems = await Item.countDocuments({});
    const itemsWithHsCodeId = await Item.countDocuments({ hsCodeId: { $exists: true, $ne: null } });
    const itemsWithHsnCode = await Item.countDocuments({ hsnCode: { $exists: true, $ne: '', $ne: null } });
    console.log(`\nTotal items: ${totalItems}`);
    console.log(`Items with hsCodeId: ${itemsWithHsCodeId}`);
    console.log(`Items with hsnCode (plain): ${itemsWithHsnCode}`);

    // 3. Let's see some items with their categories and HSN codes
    const sampleItems = await Item.find({}).limit(50).populate('hsCodeId');
    console.log('\n--- SAMPLE ITEMS (first 50) ---');
    sampleItems.forEach(i => {
        console.log(`Name: ${i.itemName}`);
        console.log(`  Code: ${i.itemCode}, Category: ${i.categoryName || i.categoryId}`);
        console.log(`  HSN Ref: ${i.hsCodeId ? i.hsCodeId.code : 'None'}, HSN Plain: ${i.hsnCode}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected!');
}

run().catch(console.error);
