const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Item = require('../src/models/item.model');

async function checkAllTypes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const types = await Item.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);
        console.log('Item Types in Master:', types);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkAllTypes();
