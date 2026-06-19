require('dotenv').config();
const mongoose = require('mongoose');

const Store = require('../src/models/store.model');
const StoreInventory = require('../src/models/storeInventory.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const allStores = await Store.find().lean();
    
    for (const store of allStores) {
        const storeId = store._id;
        const storeName = store.name;

        // Group by creation date (just YYYY-MM-DD)
        const dateGrouping = await StoreInventory.aggregate([
            {
                $match: {
                    storeId: storeId,
                    quantityAvailable: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalQty: { $sum: '$quantityAvailable' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        if (dateGrouping.length > 0) {
            console.log(`\n🏪 Store: ${storeName}`);
            dateGrouping.forEach(group => {
                console.log(`   └─ Date: ${group._id || 'Null'} | Qty: ${group.totalQty} | Records: ${group.count}`);
            });
        }
    }

    await mongoose.disconnect();
}

run().catch(console.error);
