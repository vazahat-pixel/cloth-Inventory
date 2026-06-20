const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('../src/models/item.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const uniqueHsns = await Item.aggregate([
            {
                $group: {
                    _id: "$hsnCode",
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('--- HSN CODE BREAKDOWN ON ITEMS ---');
        console.log(uniqueHsns);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
