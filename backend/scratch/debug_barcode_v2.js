const mongoose = require('mongoose');
const Item = require('../src/models/item.model');
require('dotenv').config();

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const search = 'TS25-0033';
    const items = await Item.find({
        $or: [
            { itemCode: search },
            { itemName: new RegExp(search, 'i') }
        ]
    }).lean();

    console.log(`Found ${items.length} items for "${search}":`);
    items.forEach(it => {
        console.log(`- ID: ${it._id}, Code: ${it.itemCode}, Name: ${it.itemName}, ShadeNo: ${it.shadeNo}, Color: ${it.color}`);
    });

    process.exit(0);
}

debug();
