const mongoose = require('mongoose');
require('dotenv').config();

const WarehouseInventory = require('../src/models/warehouseInventory.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const duplicates = await WarehouseInventory.aggregate([
            {
                $group: {
                    _id: { warehouseId: '$warehouseId', variantId: '$variantId' },
                    count: { $sum: 1 },
                    records: {
                        $push: {
                            _id: '$_id',
                            barcode: '$barcode',
                            quantity: '$quantity',
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

        console.log(`Found ${duplicates.length} duplicate warehouse+variant groups:`);
        duplicates.slice(0, 10).forEach((group, idx) => {
            console.log(`\nGroup #${idx + 1}: Warehouse: ${group._id.warehouseId}, Variant: ${group._id.variantId}`);
            group.records.forEach(rec => {
                console.log(`  - _id: ${rec._id}, barcode: "${rec.barcode}", qty: ${rec.quantity}`);
            });
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
