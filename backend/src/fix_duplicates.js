const mongoose = require('mongoose');
const StockLedger = require('./models/stockLedger.model');
const StoreInventory = require('./models/storeInventory.model');
const Item = require('./models/item.model');

const MONGO_URI = 'mongodb://wazahatqureshi4_db_user:pKUv0rnI1Fv28A8w@ac-g6dgyg7-shard-00-00.nmyzy1e.mongodb.net:27017,ac-g6dgyg7-shard-00-01.nmyzy1e.mongodb.net:27017,ac-g6dgyg7-shard-00-02.nmyzy1e.mongodb.net:27017/cloth-inventory?ssl=true&authSource=admin&replicaSet=atlas-11u2xh-shard-0&retryWrites=true&w=majority';
const STORE_ID = '69e89f8e5df4170210683876';

async function fix() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected');

    const storeObjectId = new mongoose.Types.ObjectId(STORE_ID);

    // 1. Find the duplicate batch (the one at 10:01)
    // Actually, I'll just find all ADJUSTMENT entries today and see which ones are duplicates.
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const logs = await StockLedger.find({
        locationId: storeObjectId,
        source: 'ADJUSTMENT',
        createdAt: { $gte: startOfDay }
    }).sort({ createdAt: 1 });

    console.log(`Found ${logs.length} adjustment logs today.`);

    const barcodeMap = new Map();
    const toDelete = [];
    const deductions = new Map(); // barcode -> totalQtyToDeduct

    logs.forEach(log => {
        if (barcodeMap.has(log.barcode)) {
            // Duplicate!
            toDelete.push(log._id);
            deductions.set(log.barcode, (deductions.get(log.barcode) || 0) + log.quantity);
        } else {
            barcodeMap.set(log.barcode, log);
        }
    });

    console.log(`Identified ${toDelete.length} duplicate entries to remove.`);

    if (toDelete.length === 0) {
        console.log('No duplicates found.');
        process.exit(0);
    }

    // 2. Perform Deductions
    for (const [barcode, qty] of deductions.entries()) {
        // Update StoreInventory
        await StoreInventory.updateOne(
            { storeId: storeObjectId, barcode },
            { $inc: { quantity: -qty, quantityAvailable: -qty } }
        );

        // Update Item Stock
        await Item.updateOne(
            { "sizes.barcode": barcode },
            { $inc: { "sizes.$.stock": -qty } }
        );
    }

    // 3. Delete Ledger Entries
    await StockLedger.deleteMany({ _id: { $in: toDelete } });

    console.log('✅ Successfully removed duplicates and corrected stock levels.');
    
    process.exit(0);
}

fix();
