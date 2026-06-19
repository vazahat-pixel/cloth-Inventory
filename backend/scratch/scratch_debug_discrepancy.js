require('dotenv').config();
const mongoose = require('mongoose');

const StoreInventory = require('../src/models/storeInventory.model');
const StockLedger = require('../src/models/stockLedger.model');
const Item = require('../src/models/item.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const pitampuraId = '69e86a235df4170210683604'; // Pitampura store ID

    // Find store inventory records for Pitampura
    const invRecords = await StoreInventory.find({ storeId: pitampuraId, quantityAvailable: { $gt: 0 } }).limit(5).lean();
    
    console.log(`Found ${invRecords.length} positive stock records in Pitampura.`);

    for (const record of invRecords) {
        // Fetch item details
        const item = await Item.findById(record.itemId).lean();
        const itemName = item ? item.itemName : 'Unknown';

        // Check if there are ledger entries for this barcode at this location
        const ledgerEntries = await StockLedger.find({
            locationId: pitampuraId,
            barcode: record.barcode
        }).lean();

        console.log(`\nBarcode: ${record.barcode} | Item: ${itemName}`);
        console.log(`StoreInventory Available Qty: ${record.quantityAvailable}`);
        console.log(`StoreInventory CreatedAt: ${record.createdAt} | UpdatedAt: ${record.updatedAt}`);
        console.log(`StockLedger Entries Count: ${ledgerEntries.length}`);
        
        if (ledgerEntries.length > 0) {
            console.log('Ledger entries:');
            ledgerEntries.forEach((entry, idx) => {
                console.log(`  [${idx+1}] Type: ${entry.type} | Qty: ${entry.quantity} | Source: ${entry.source} | Date: ${entry.createdAt}`);
            });
        } else {
            console.log('  ⚠️ NO LEDGER ENTRIES FOUND FOR THIS BARCODE AT PITAMPURA!');
        }
    }

    await mongoose.disconnect();
}

run().catch(console.error);
