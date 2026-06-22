const mongoose = require('mongoose');
require('dotenv').config();

// Register all models to prevent MissingSchemaError during population
const Warehouse = require('../src/models/warehouse.model');
const Store = require('../src/models/store.model');
const StoreInventory = require('../src/models/storeInventory.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');
const Item = require('../src/models/item.model');
const Brand = require('../src/models/brand.model');
const Category = require('../src/models/category.model');
const HSNCode = require('../src/models/hsnCode.model');

const storeInventoryService = require('../src/modules/storeInventory/storeInventory.service');
const salesService = require('../src/modules/sales/sales.service');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const storeId = '69ecb1d9f04d7249bd11adf4'; // GTB Nagar
        const itemId = '6a0477d1cbe1886f6da45e79'; // AW24D0016-0004382 GRY/BLACK
        const barcode = '0004382';

        // Find all store inventory records for GTB Nagar
        const records = await StoreInventory.find({
            storeId,
            $or: [
                { itemId },
                { barcode: /0004382/ }
            ]
        }).lean();

        console.log(`Found ${records.length} records in StoreInventory for GTB Nagar linked to 0004382:`);
        records.forEach((rec, idx) => {
            console.log(`\nRecord #${idx + 1}:`);
            console.log(`  _id: ${rec._id}`);
            console.log(`  storeId: ${rec.storeId}`);
            console.log(`  itemId: ${rec.itemId}`);
            console.log(`  variantId: ${rec.variantId}`);
            console.log(`  barcode: "${rec.barcode}"`);
            console.log(`  quantity: ${rec.quantity}`);
            console.log(`  quantityAvailable: ${rec.quantityAvailable}`);
            console.log(`  quantityInTransit: ${rec.quantityInTransit}`);
        });

        console.log('\n--- SIMULATING POS SCAN VIA salesService.getProductForSale ---');
        // Test scanning base item code barcode "0004382"
        try {
            const product = await salesService.getProductForSale(barcode, storeId);
            console.log('Successfully found product for sale when scanning item code "0004382":');
            console.log(`  Name: ${product.name}`);
            console.log(`  Barcode: ${product.barcode}`);
            console.log(`  Available Stock: ${product.available}`);
        } catch (err) {
            console.error('❌ Failed scanning "0004382":', err.message);
        }

        // Test scanning variant barcode "0004382-81.28CM(32)"
        try {
            const variantBarcode = '0004382-81.28CM(32)';
            const product = await salesService.getProductForSale(variantBarcode, storeId);
            console.log('\nSuccessfully found product for sale when scanning variant barcode "0004382-81.28CM(32)":');
            console.log(`  Name: ${product.name}`);
            console.log(`  Barcode: ${product.barcode}`);
            console.log(`  Available Stock: ${product.available}`);
        } catch (err) {
            console.error('❌ Failed scanning "0004382-81.28CM(32)":', err.message);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
