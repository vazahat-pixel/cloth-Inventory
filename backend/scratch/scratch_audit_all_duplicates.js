const mongoose = require('mongoose');
require('dotenv').config();

const StoreInventory = require('../src/models/storeInventory.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const duplicates = await StoreInventory.aggregate([
            {
                $group: {
                    _id: { storeId: '$storeId', variantId: '$variantId' },
                    count: { $sum: 1 },
                    records: {
                        $push: {
                            _id: '$_id',
                            barcode: '$barcode',
                            quantity: '$quantity',
                            quantityAvailable: '$quantityAvailable',
                            quantityInTransit: '$quantityInTransit'
                        }
                    }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        console.log(`Found ${duplicates.length} duplicate store+variant groups:`);
        duplicates.slice(0, 10).forEach((group, idx) => {
            console.log(`\nGroup #${idx + 1}: Store: ${group._id.storeId}, Variant: ${group._id.variantId}`);
            group.records.forEach(rec => {
                console.log(`  - _id: ${rec._id}, barcode: "${rec.barcode}", qtyAvailable: ${rec.quantityAvailable}, qty: ${rec.quantity}`);
            });
        });

        // Let's print the total count of duplicate groups
        console.log(`\nTotal duplicate groups: ${duplicates.length}`);

        // Let's count how many have negative stock in one of the records
        let negativeGroupCount = 0;
        duplicates.forEach(group => {
            if (group.records.some(r => r.quantityAvailable < 0)) {
                negativeGroupCount++;
            }
        });
        console.log(`Duplicate groups with at least one negative record: ${negativeGroupCount}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
