const mongoose = require('mongoose');
const path = require('path');
const XLSX = require('xlsx');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Item = require('../src/models/item.model');
const Brand = require('../src/models/brand.model');

async function importFullItemDirectory() {
    await connectDB();
    try {
        console.log("Reading Full Item Directory Excel File...");
        const filePath = "C:\\Users\\hp\\Downloads\\7baa46a6c5e3445f9e2c9ef6f51e1bd6 (1).xlsx";
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Successfully read ${rows.length} rows from Master Excel.`);

        console.log("Grouping rows by ITEM CODE to build size and variant matrices...");
        const itemMap = new Map();

        for (const row of rows) {
            // Get the item code and skip headers or invalid entries
            const itemCode = String(row['ITEM DIRECTORY_12'] || '').trim().toUpperCase();
            if (!itemCode || itemCode === 'ITEM CODE' || itemCode === 'SNO.') continue;

            const itemName = String(row['ITEM DIRECTORY_13'] || '').trim();
            const categoryName = String(row['ITEM DIRECTORY_1'] || '').trim();
            const type = String(row['ITEM DIRECTORY_2'] || '').trim();
            const fabric = String(row['ITEM DIRECTORY_4'] || '').trim();
            const color = String(row['ITEM DIRECTORY_15'] || '').trim();
            const size = String(row['ITEM DIRECTORY_16'] || '').trim() || 'FREE';
            const mrp = Number(row['ITEM DIRECTORY_18'] || 0);

            if (!itemName) continue;

            if (!itemMap.has(itemCode)) {
                itemMap.set(itemCode, {
                    itemCode,
                    itemName,
                    type: 'GARMENT',
                    brandName: 'GENERIC',
                    categoryName,
                    fabric: fabric !== '(NIL)' ? fabric : undefined,
                    color: color !== '(NIL)' ? color : undefined,
                    sizesMap: new Map() // Size -> MRP
                });
            }

            const itemData = itemMap.get(itemCode);
            // Deduplicate sizes and keep the highest MRP or first valid MRP
            if (!itemData.sizesMap.has(size) || mrp > itemData.sizesMap.get(size)) {
                itemData.sizesMap.set(size, mrp || 999);
            }
        }

        console.log(`Extracted ${itemMap.size} unique master styles/itemCodes.`);

        // Find a default Brand if it exists to preserve model structure
        const brand = await Brand.findOne();
        const defaultBrandId = brand ? brand._id : null;

        console.log("Preparing database insertion payloads...");
        const itemsToInsert = [];

        for (const [itemCode, data] of itemMap.entries()) {
            const sizesArray = [];
            for (const [sizeVal, mrpVal] of data.sizesMap.entries()) {
                sizesArray.push({
                    size: sizeVal,
                    sku: `${itemCode}-${sizeVal.replace(/\s+/g, '')}`,
                    barcode: `${itemCode}-${sizeVal.replace(/\s+/g, '')}`,
                    mrp: mrpVal,
                    stock: 0,
                    isActive: true
                });
            }

            itemsToInsert.push({
                itemCode,
                itemName: data.itemName,
                type: 'GARMENT',
                brand: defaultBrandId,
                brandName: data.brandName,
                categoryName: data.categoryName,
                fabric: data.fabric,
                color: data.color,
                sizes: sizesArray,
                gstPercent: 5,
                isActive: true
            });
        }

        console.log("Cleaning up existing local Item Master database...");
        await Item.deleteMany({});
        console.log("Cleared existing items.");

        console.log(`Inserting ${itemsToInsert.length} unified master items into MongoDB...`);
        
        // Use batching of 1000 items to avoid payload size limit in Mongoose
        const batchSize = 1000;
        let insertedCount = 0;
        for (let i = 0; i < itemsToInsert.length; i += batchSize) {
            const batch = itemsToInsert.slice(i, i + batchSize);
            const res = await Item.insertMany(batch);
            insertedCount += res.length;
            console.log(`... inserted ${insertedCount} / ${itemsToInsert.length} items`);
        }

        console.log(`\n✅ SUCCESS: Successfully registered ${insertedCount} master items with full size/variant matrix!`);

    } catch (e) {
        console.error("Migration/Seeding Error:", e);
    } finally {
        await mongoose.connection.close();
    }
}

importFullItemDirectory();
