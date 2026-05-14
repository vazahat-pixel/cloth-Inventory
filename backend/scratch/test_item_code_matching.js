const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Item = require('../src/models/item.model');
const Brand = require('../src/models/brand.model');
const itemService = require('../src/modules/items/item.service');

async function runTest() {
    await connectDB();
    try {
        console.log("Creating a temporary item in master...");
        const tempItemCode = "TEMP-TEST-ITEM-123";
        
        // Clean up first in case it exists
        await Item.deleteOne({ itemCode: tempItemCode });

        // Find a brand from DB
        const brand = await Brand.findOne();
        const brandId = brand ? brand._id : new mongoose.Types.ObjectId();

        const testItem = await Item.create({
            itemCode: tempItemCode,
            itemName: "Temp Test Item",
            brand: brandId,
            sizes: [
                { size: "M", basicRate: 100, saleRate: 150, mrp: 200, sku: "TEMP-SKU-1", barcode: "TEMP-BC-1" }
            ],
            gst: 5
        });

        console.log(`Created item with itemCode: ${testItem.itemCode}`);

        console.log("\nTesting validateBarcodes by top-level itemCode...");
        const resultsByCode = await itemService.validateBarcodes([tempItemCode]);
        console.log("Result:", resultsByCode);
        if (resultsByCode[tempItemCode] && resultsByCode[tempItemCode].item.itemCode === tempItemCode) {
            console.log("✅ Success! Matched by top-level itemCode.");
        } else {
            console.error("❌ Failed to match by top-level itemCode.");
        }

        console.log("\nTesting validateBarcodes by variant SKU...");
        const resultsBySku = await itemService.validateBarcodes(["TEMP-SKU-1"]);
        console.log("Result:", resultsBySku);
        if (resultsBySku["TEMP-SKU-1"] && resultsBySku["TEMP-SKU-1"].variant.sku === "TEMP-SKU-1") {
            console.log("✅ Success! Matched by variant SKU.");
        } else {
            console.error("❌ Failed to match by variant SKU.");
        }

        console.log("\nTesting validateBarcodes by variant barcode...");
        const resultsByBc = await itemService.validateBarcodes(["TEMP-BC-1"]);
        console.log("Result:", resultsByBc);
        if (resultsByBc["TEMP-BC-1"] && resultsByBc["TEMP-BC-1"].variant.barcode === "TEMP-BC-1") {
            console.log("✅ Success! Matched by variant barcode.");
        } else {
            console.error("❌ Failed to match by variant barcode.");
        }

        // Clean up
        await Item.deleteOne({ _id: testItem._id });
        console.log("\nTemporary test item cleaned up.");

    } catch (e) {
        console.error("Test error:", e);
    } finally {
        await mongoose.connection.close();
    }
}

runTest();
