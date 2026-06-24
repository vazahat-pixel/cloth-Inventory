require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        const Item = require('../src/models/item.model.js');
        const Counter = require('../src/models/counter.model.js');
        const itemService = require('../src/modules/items/item.service.js');
        const Brand = require('../src/models/brand.model.js');
        const HSNCode = require('../src/models/hsnCode.model.js');

        // Clear existing database entries for clean verification
        await Item.deleteMany({});
        await Counter.findOneAndUpdate(
            { name: 'itemCode_BM' },
            { $set: { seq: 258 } },
            { upsert: true }
        );
        console.log("Database cleared and counter reset to 258.");

        let brand = await Brand.findOne({});
        if (!brand) {
            brand = await Brand.create({ name: 'Test Brand', shortName: 'TB', brandName: 'Test Brand' });
        }
        let hsn = await HSNCode.findOne({});
        if (!hsn) {
            hsn = await HSNCode.create({ code: '6109', gstPercent: 12, gstRate: 12 });
        }

        // 1. Create first item (Verification Shirt 1) with S, M, L
        console.log("\nCreating First Item...");
        const firstPayload = {
            type: 'GARMENT',
            itemCode: '', // Empty triggers autogeneration
            itemName: 'Verification Shirt 1',
            brand: String(brand._id),
            hsCodeId: String(hsn._id),
            uom: 'PCS',
            sizes: [
                { size: 'S', color: 'Blue', mrp: 1000, stock: 10, sku: '', barcode: '' },
                { size: 'M', color: 'Blue', mrp: 1000, stock: 15, sku: '', barcode: '' },
                { size: 'L', color: 'Blue', mrp: 1000, stock: 20, sku: '', barcode: '' }
            ]
        };

        const item1 = await itemService.createItem(firstPayload);
        console.log(`Saved Item 1 - Parent Code: ${item1.itemCode}`);
        item1.sizes.forEach(v => {
            console.log(`- Size: ${v.size} | Color: ${v.color} | SKU: ${v.sku} | Barcode: ${v.barcode}`);
        });

        // Assert Item 1 values
        if (item1.itemCode !== 'BM0259') throw new Error(`Expected itemCode BM0259, got ${item1.itemCode}`);
        if (item1.sizes[0].sku !== 'BM0259') throw new Error(`Expected size S sku BM0259, got ${item1.sizes[0].sku}`);
        if (item1.sizes[1].sku !== 'BM0260') throw new Error(`Expected size M sku BM0260, got ${item1.sizes[1].sku}`);
        if (item1.sizes[2].sku !== 'BM0261') throw new Error(`Expected size L sku BM0261, got ${item1.sizes[2].sku}`);

        // 2. Create second item (Verification Shirt 2) with S, M
        console.log("\nCreating Second Item...");
        const secondPayload = {
            type: 'GARMENT',
            itemCode: '',
            itemName: 'Verification Shirt 2',
            brand: String(brand._id),
            hsCodeId: String(hsn._id),
            uom: 'PCS',
            sizes: [
                { size: 'S', color: 'Red', mrp: 1500, stock: 5, sku: '', barcode: '' },
                { size: 'M', color: 'Red', mrp: 1500, stock: 8, sku: '', barcode: '' }
            ]
        };

        const item2 = await itemService.createItem(secondPayload);
        console.log(`Saved Item 2 - Parent Code: ${item2.itemCode}`);
        item2.sizes.forEach(v => {
            console.log(`- Size: ${v.size} | Color: ${v.color} | SKU: ${v.sku} | Barcode: ${v.barcode}`);
        });

        // Assert Item 2 values
        if (item2.itemCode !== 'BM0262') throw new Error(`Expected itemCode BM0262, got ${item2.itemCode}`);
        if (item2.sizes[0].sku !== 'BM0262') throw new Error(`Expected size S sku BM0262, got ${item2.sizes[0].sku}`);
        if (item2.sizes[1].sku !== 'BM0263') throw new Error(`Expected size M sku BM0263, got ${item2.sizes[1].sku}`);

        // 3. Test Scans
        console.log("\nTesting Barcode Scanning...");
        
        // Scan Size S of first item
        const scanS1 = await itemService.scanItemByBarcode('BM0259');
        console.log(`Scanned 'BM0259' -> Matched Item: "${scanS1.item.itemName}" | Variant Size: ${scanS1.variant.size} | Color: ${scanS1.variant.color}`);
        if (scanS1.variant.size !== 'S') throw new Error(`Expected size S, got ${scanS1.variant.size}`);

        // Scan Size M of first item
        const scanM1 = await itemService.scanItemByBarcode('BM0260');
        console.log(`Scanned 'BM0260' -> Matched Item: "${scanM1.item.itemName}" | Variant Size: ${scanM1.variant.size} | Color: ${scanM1.variant.color}`);
        if (scanM1.variant.size !== 'M') throw new Error(`Expected size M, got ${scanM1.variant.size}`);

        // Scan Size M of second item
        const scanM2 = await itemService.scanItemByBarcode('BM0263');
        console.log(`Scanned 'BM0263' -> Matched Item: "${scanM2.item.itemName}" | Variant Size: ${scanM2.variant.size} | Color: ${scanM2.variant.color}`);
        if (scanM2.variant.size !== 'M' || scanM2.item.itemName !== 'Verification Shirt 2') {
            throw new Error("Wrong scan match for BM0263");
        }

        console.log("\n✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
        console.log("No duplicates, strict sequential mapping of variant SKUs (S -> M -> L...) is verified.");

    } catch (e) {
        console.error("Verification failed:", e);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

run();
