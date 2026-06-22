const mongoose = require('mongoose');
require('dotenv').config();

const StoreInventory = require('../src/models/storeInventory.model');
const Item = require('../src/models/item.model');

const DRY_RUN = false; // Set to false to perform the actual reconciliation

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        console.log('Finding duplicate store+variant groups in StoreInventory...');
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
                            quantityInTransit: '$quantityInTransit',
                            damagedQuantity: '$damagedQuantity',
                            quantitySold: '$quantitySold',
                            quantityReturned: '$quantityReturned',
                            lastPurchaseRate: '$lastPurchaseRate'
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

        console.log(`Found ${duplicates.length} duplicate groups.`);

        let processedGroupsCount = 0;
        let deletedRecordsCount = 0;

        for (const group of duplicates) {
            const { storeId, variantId } = group._id;
            
            // 1. Find correct barcode from Item master
            const item = await Item.findOne({ "sizes._id": variantId }).lean();
            if (!item) {
                console.log(`⚠️ Warning: Item master not found for variantId ${variantId}. Skipping group.`);
                continue;
            }
            const variant = item.sizes.find(s => String(s._id) === String(variantId));
            const correctBarcode = variant?.barcode || variant?.sku || item.itemCode;
            if (!correctBarcode) {
                console.log(`⚠️ Warning: No barcode/sku/itemCode found for variantId ${variantId}. Skipping group.`);
                continue;
            }

            // 2. Sum up quantities
            let totalQuantity = 0;
            let totalQuantityAvailable = 0;
            let totalQuantityInTransit = 0;
            let totalDamagedQuantity = 0;
            let totalQuantitySold = 0;
            let totalQuantityReturned = 0;
            let maxPurchaseRate = 0;

            group.records.forEach(rec => {
                totalQuantity += rec.quantity || 0;
                totalQuantityAvailable += rec.quantityAvailable || 0;
                totalQuantityInTransit += rec.quantityInTransit || 0;
                totalDamagedQuantity += rec.damagedQuantity || 0;
                totalQuantitySold += rec.quantitySold || 0;
                totalQuantityReturned += rec.quantityReturned || 0;
                if (rec.lastPurchaseRate > maxPurchaseRate) {
                    maxPurchaseRate = rec.lastPurchaseRate;
                }
            });

            console.log(`\nReconciling Store: ${storeId}, Variant: ${variantId} (${item.itemName})`);
            console.log(`  Correct barcode should be: "${correctBarcode}"`);
            console.log(`  Current records:`);
            group.records.forEach(rec => {
                console.log(`    - ID: ${rec._id}, barcode: "${rec.barcode}", qtyAvailable: ${rec.quantityAvailable}, qty: ${rec.quantity}`);
            });
            console.log(`  Merged fields:`);
            console.log(`    - quantity: ${totalQuantity}`);
            console.log(`    - quantityAvailable: ${totalQuantityAvailable}`);
            console.log(`    - quantityInTransit: ${totalQuantityInTransit}`);
            console.log(`    - damagedQuantity: ${totalDamagedQuantity}`);
            console.log(`    - quantitySold: ${totalQuantitySold}`);
            console.log(`    - quantityReturned: ${totalQuantityReturned}`);

            // Find if there is an existing record with the correct barcode
            const correctRecord = group.records.find(r => r.barcode === correctBarcode);
            const primaryRecordId = correctRecord ? correctRecord._id : group.records[0]._id;
            const duplicateIdsToDelete = group.records
                .map(r => r._id)
                .filter(id => String(id) !== String(primaryRecordId));

            if (!DRY_RUN) {
                // Update primary record
                await StoreInventory.updateOne(
                    { _id: primaryRecordId },
                    {
                        $set: {
                            barcode: correctBarcode,
                            quantity: totalQuantity,
                            quantityAvailable: totalQuantityAvailable,
                            quantityInTransit: totalQuantityInTransit,
                            damagedQuantity: totalDamagedQuantity,
                            quantitySold: totalQuantitySold,
                            quantityReturned: totalQuantityReturned,
                            lastPurchaseRate: maxPurchaseRate,
                            lastUpdated: new Date()
                        }
                    }
                );

                // Delete duplicate records
                await StoreInventory.deleteMany({
                    _id: { $in: duplicateIdsToDelete }
                });

                console.log(`  ✅ Successfully updated primary record ${primaryRecordId} and deleted ${duplicateIdsToDelete.length} duplicates.`);
            } else {
                console.log(`  [DRY RUN] Would update primary record ${primaryRecordId} and delete duplicates: ${duplicateIdsToDelete.join(', ')}`);
            }

            processedGroupsCount++;
            deletedRecordsCount += duplicateIdsToDelete.length;
        }

        console.log('\n================ SUMMARY ================');
        console.log(`Dry run: ${DRY_RUN}`);
        console.log(`Total duplicate groups processed: ${processedGroupsCount}`);
        console.log(`Total records to delete: ${deletedRecordsCount}`);
        console.log('=========================================');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
