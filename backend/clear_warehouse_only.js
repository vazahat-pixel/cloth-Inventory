require('dotenv').config();
const mongoose = require('mongoose');

// We use dynamic require for models to ensure they are registered correctly
const WarehouseInventory = require('./src/models/warehouseInventory.model');
const Item = require('./src/models/item.model');
const StockMovement = require('./src/models/stockMovement.model');
const StockLedger = require('./src/models/stockLedger.model');

async function run() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all warehouse inventory items
        const inventoryItems = await WarehouseInventory.find({});
        console.log(`Found ${inventoryItems.length} inventory items in warehouse.`);

        if (inventoryItems.length === 0) {
            console.log('No inventory found to clear.');
            process.exit(0);
        }

        const itemOps = [];
        const movements = [];
        const ledgerEntries = [];
        const referenceId = new mongoose.Types.ObjectId();

        for (const item of inventoryItems) {
            const qty = item.quantity || 0;
            if (qty <= 0) continue;

            // 1. Prepare master stock decrement
            itemOps.push({
                updateOne: {
                    filter: { "sizes._id": item.variantId },
                    update: { $inc: { "sizes.$.stock": -qty } }
                }
            });

            // 2. Prepare Stock Movement record
            movements.push({
                variantId: item.variantId,
                qty: -qty,
                type: 'ADJUSTMENT',
                referenceId,
                referenceType: 'Adjustment',
                fromLocation: item.warehouseId,
                performedBy: new mongoose.Types.ObjectId() // Dummy system user ID
            });

            // 3. Prepare Stock Ledger entry
            ledgerEntries.push({
                itemId: item.itemId,
                barcode: item.barcode,
                type: 'OUT',
                quantity: qty,
                source: 'ADJUSTMENT',
                referenceId: referenceId.toString(),
                balanceAfter: 0,
                locationId: item.warehouseId,
                locationType: 'WAREHOUSE',
                batchNo: 'DEFAULT'
            });
        }

        // Execute operations in bulk
        if (itemOps.length > 0) {
            const res = await Item.bulkWrite(itemOps);
            console.log(`Updated ${res.modifiedCount} items master stock.`);
        }
        if (movements.length > 0) {
            await StockMovement.insertMany(movements, { ordered: false });
            console.log(`Inserted ${movements.length} stock movements.`);
        }
        if (ledgerEntries.length > 0) {
            await StockLedger.insertMany(ledgerEntries, { ordered: false });
            console.log(`Inserted ${ledgerEntries.length} ledger entries.`);
        }

        // Delete all Warehouse Inventory records
        const deleteResult = await WarehouseInventory.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} warehouse inventory records.`);

        console.log('Warehouse inventory cleared successfully without touching store inventory.');
        process.exit(0);
    } catch (err) {
        console.error('Error during execution:', err);
        process.exit(1);
    }
}

run();
