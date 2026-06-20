const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('../src/models/item.model');
const HSNCode = require('../src/models/hsnCode.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const totalItems = await Item.countDocuments({});
        const itemsWithHsCodeId = await Item.countDocuments({ hsCodeId: { $ne: null } });
        const itemsWithHsnCode = await Item.countDocuments({ hsnCode: { $exists: true, $ne: null, $ne: '' } });

        console.log(`Total Items: ${totalItems}`);
        console.log(`Items with hsCodeId: ${itemsWithHsCodeId}`);
        console.log(`Items with hsnCode (plain string): ${itemsWithHsnCode}`);

        // Let's print a few items that have hsCodeId
        const sampleWithHsCodeId = await Item.find({ hsCodeId: { $ne: null } }).limit(5).populate('hsCodeId');
        console.log('\n--- SAMPLE ITEMS WITH hsCodeId ---');
        sampleWithHsCodeId.forEach(i => {
            console.log(`ID: ${i._id}, Name: ${i.itemName}, HSN Ref: ${i.hsCodeId ? i.hsCodeId.code : 'None'}, HSN Plain: ${i.hsnCode}`);
        });

        // Let's print a few items that do NOT have hsCodeId
        const sampleWithoutHsCodeId = await Item.find({ hsCodeId: null }).limit(5);
        console.log('\n--- SAMPLE ITEMS WITHOUT hsCodeId ---');
        sampleWithoutHsCodeId.forEach(i => {
            console.log(`ID: ${i._id}, Name: ${i.itemName}, HSN Ref: None, HSN Plain: ${i.hsnCode}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
