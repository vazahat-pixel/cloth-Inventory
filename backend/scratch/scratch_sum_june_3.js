require('dotenv').config();
const mongoose = require('mongoose');

const StoreInventory = require('../src/models/storeInventory.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const pitampuraId = '69e86a235df4170210683604';
    const start = new Date('2026-06-03T00:00:00.000Z');
    const end = new Date('2026-06-03T23:59:59.999Z');

    const res = await StoreInventory.aggregate([
        {
            $match: {
                storeId: new mongoose.Types.ObjectId(pitampuraId),
                createdAt: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$quantityAvailable' },
                count: { $sum: 1 }
            }
        }
    ]);

    console.log('Aggregation result for June 3 in Pitampura:', res);

    await mongoose.disconnect();
}

run().catch(console.error);
