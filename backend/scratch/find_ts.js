const mongoose = require('mongoose');
const Item = require('../src/models/item.model');
require('dotenv').config();

async function findTS() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloth-inventory');
    const items = await Item.find({ 
        $or: [
            { itemCode: /TS25/i },
            { itemName: /TS25/i }
        ]
    }).select('itemCode itemName shadeNo color').limit(10);
    console.log(JSON.stringify(items, null, 2));
    await mongoose.disconnect();
}

findTS();
