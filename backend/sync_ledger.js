require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const StockLedger = require('./src/models/stockLedger.model');
        const WarehouseInventory = require('./src/models/warehouseInventory.model');
        const StoreInventory = require('./src/models/storeInventory.model');
        
        console.log('1. Wiping current StockLedger...');
        await StockLedger.deleteMany({});
        console.log('StockLedger wiped.');

        console.log('2. Syncing from WarehouseInventory...');
        const warehouseItems = await WarehouseInventory.find({ quantity: { $ne: 0 } }).lean();
        console.log(`Found ${warehouseItems.length} non-zero items in WarehouseInventory.`);
        
        const ledgerEntries = [];
        const BATCH_SIZE = 5000;
        
        let whTotalQty = 0;
        for (const item of warehouseItems) {
            whTotalQty += item.quantity;
            ledgerEntries.push({
                itemId: item.itemId,
                variantId: item.variantId,
                barcode: item.barcode,
                locationId: item.warehouseId,
                locationType: 'WAREHOUSE',
                type: item.quantity > 0 ? 'IN' : 'OUT',
                quantity: Math.abs(item.quantity),
                source: 'OPENING_BALANCE',
                referenceId: 'SYNC-' + Date.now(),
                balanceAfter: item.quantity,
                batchNo: 'DEFAULT'
            });
        }
        
        console.log(`3. Syncing from StoreInventory...`);
        const storeItems = await StoreInventory.find({ quantity: { $ne: 0 } }).lean();
        console.log(`Found ${storeItems.length} non-zero items in StoreInventory.`);
        
        let storeTotalQty = 0;
        for (const item of storeItems) {
            storeTotalQty += item.quantity;
            ledgerEntries.push({
                itemId: item.itemId,
                variantId: item.variantId,
                barcode: item.barcode,
                locationId: item.storeId,
                locationType: 'STORE',
                type: item.quantity > 0 ? 'IN' : 'OUT',
                quantity: Math.abs(item.quantity),
                source: 'OPENING_BALANCE',
                referenceId: 'SYNC-' + Date.now(),
                balanceAfter: item.quantity,
                batchNo: 'DEFAULT'
            });
        }
        
        console.log(`Warehouse Total Quantity: ${whTotalQty}`);
        console.log(`Store Total Quantity: ${storeTotalQty}`);
        
        console.log(`4. Inserting ${ledgerEntries.length} entries into StockLedger...`);
        for (let i = 0; i < ledgerEntries.length; i += BATCH_SIZE) {
            const batch = ledgerEntries.slice(i, i + BATCH_SIZE);
            await StockLedger.insertMany(batch, { ordered: false });
            console.log(`Inserted batch ${i/BATCH_SIZE + 1} / ${Math.ceil(ledgerEntries.length/BATCH_SIZE)}`);
        }
        
        console.log('Sync Complete! StockLedger now exactly mirrors physical inventory.');

    } catch (e) {
        console.error('Error during sync:', e);
    } finally {
        mongoose.disconnect();
    }
}

run();
