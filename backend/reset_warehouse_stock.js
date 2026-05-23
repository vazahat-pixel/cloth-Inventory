require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const GRN = require('./src/models/grn.model');
        const WarehouseInventory = require('./src/models/warehouseInventory.model');
        const StoreInventory = require('./src/models/storeInventory.model');
        const StockLedger = require('./src/models/stockLedger.model');
        
        console.log('1. Wiping WarehouseInventory and StockLedger...');
        await WarehouseInventory.deleteMany({});
        await StockLedger.deleteMany({});
        console.log('Cleared WarehouseInventory and StockLedger.');

        console.log('2. Fetching original GRN-2026-00001...');
        const originalGrn = await GRN.findOne({ grnNumber: 'GRN-2026-00001' }).lean();
        if (!originalGrn) throw new Error('Primary GRN not found!');
        
        console.log(`Found GRN with ${originalGrn.items.length} item lines.`);

        // Aggregate duplicates in GRN to prevent E11000
        const itemsMap = new Map();
        for (const item of originalGrn.items) {
            const barcode = item.sku || item.barcode;
            const qty = Number(item.receivedQty || item.qty || 0);
            if (qty <= 0) continue;
            
            if (itemsMap.has(barcode)) {
                itemsMap.get(barcode).quantity += qty;
            } else {
                itemsMap.set(barcode, {
                    warehouseId: originalGrn.warehouseId,
                    itemId: item.itemId,
                    variantId: item.variantId,
                    barcode: barcode,
                    quantity: qty,
                    lastUpdated: Date.now()
                });
            }
        }
        
        const warehouseItems = Array.from(itemsMap.values());
        console.log(`Aggregated into ${warehouseItems.length} unique barcode entries for Warehouse.`);
        
        console.log('3. Inserting fresh stock into WarehouseInventory...');
        const BATCH_SIZE = 5000;
        let whTotalQty = 0;
        for (let i = 0; i < warehouseItems.length; i += BATCH_SIZE) {
            const batch = warehouseItems.slice(i, i + BATCH_SIZE);
            await WarehouseInventory.insertMany(batch, { ordered: false });
            batch.forEach(b => whTotalQty += b.quantity);
            console.log(`Inserted Warehouse batch ${i/BATCH_SIZE + 1}`);
        }
        console.log(`Successfully restored exactly ${whTotalQty} items to WarehouseInventory!`);

        console.log('4. Rebuilding StockLedger for Warehouse + Store...');
        const ledgerEntries = [];
        
        // Add Warehouse ledger entries
        for (const item of warehouseItems) {
            ledgerEntries.push({
                itemId: item.itemId,
                variantId: item.variantId,
                barcode: item.barcode,
                locationId: item.warehouseId,
                locationType: 'WAREHOUSE',
                type: 'IN',
                quantity: item.quantity,
                source: 'OPENING_BALANCE',
                referenceId: 'RESET-' + Date.now(),
                balanceAfter: item.quantity,
                batchNo: 'DEFAULT'
            });
        }
        
        // Fetch StoreInventory to maintain Ledger accuracy
        const storeItems = await StoreInventory.find({ quantity: { $ne: 0 } }).lean();
        console.log(`Found ${storeItems.length} non-zero items in untouched StoreInventory.`);
        
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
        
        console.log(`5. Inserting ${ledgerEntries.length} total entries into StockLedger...`);
        for (let i = 0; i < ledgerEntries.length; i += BATCH_SIZE) {
            const batch = ledgerEntries.slice(i, i + BATCH_SIZE);
            await StockLedger.insertMany(batch, { ordered: false });
            console.log(`Inserted Ledger batch ${i/BATCH_SIZE + 1}`);
        }
        
        console.log('DONE! Warehouse is perfectly reset to original GRN, and Ledger is completely rebuilt.');

    } catch (e) {
        console.error('Error during reset:', e);
    } finally {
        mongoose.disconnect();
    }
}

run();
