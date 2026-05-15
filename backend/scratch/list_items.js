const mongoose = require('mongoose');
const Item = require('../src/models/item.model');
require('dotenv').config();

async function listItems() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloth-inventory');
    const items = await Item.find().select('itemCode itemName shadeNo color').limit(20);
    console.log(JSON.stringify(items, null, 2));
    await mongoose.disconnect();
}

listItems();
