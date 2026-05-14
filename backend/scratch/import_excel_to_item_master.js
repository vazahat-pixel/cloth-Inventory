const mongoose = require('mongoose');
const path = require('path');
const XLSX = require('xlsx');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Item = require('../src/models/item.model');
const Brand = require('../src/models/brand.model');

async function importToItemMaster() {
    await connectDB();
    try {
        console.log("Reading Sonipat Excel File...");
        const filePath = "C:\\Users\\hp\\Downloads\\SONIPAT CLOSING STOCK1305.xlsx";
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Successfully read ${rows.length} rows from Excel.`);

        console.log("Grouping rows by ITEM CODE to build size matrix...");
        const itemMap = new Map();

        for (const row of rows) {
            const itemCode = String(row['ITEM CODE'] || '').trim().toUpperCase();
            const itemName = String(row['ITEM NAME'] || '').trim();
            const size = String(row['PACK/SIZE'] || '').trim() || 'FREE';
            const fabric = String(row['FEBRIC '] || '').trim();
            const color = String(row['SHADE NAME'] || '').trim();
            const brandName = String(row['VENDOR'] || '').trim();

            if (!itemCode || !itemName) continue;

            if (!itemMap.has(itemCode)) {
                itemMap.set(itemCode, {
                    itemCode,
                    itemName,
                    type: 'GARMENT',
                    brandName: brandName || 'GENERIC',
                    fabric,
                    color,
                    sizesSet: new Set()
                });
            }

            const itemData = itemMap.get(itemCode);
            itemData.sizesSet.add(size);
        }

        console.log(`Extracted ${itemMap.size} unique Items.`);

        // Find or create a default brand ID to link if necessary
        const brand = await Brand.findOne();
        const defaultBrandId = brand ? brand._id : null;

        console.log("Preparing database insertion payloads...");
        const itemsToInsert = [];

        for (const [itemCode, data] of itemMap.entries()) {
            const sizesArray = Array.from(data.sizesSet).map(sizeVal => ({
                size: sizeVal,
                sku: `${itemCode}-${sizeVal.replace(/\s+/g, '')}`,
                barcode: `${itemCode}-${sizeVal.replace(/\s+/g, '')}`,
                mrp: 999, // default dummy mrp
                stock: 0,
                isActive: true
            }));

            itemsToInsert.push({
                itemCode,
                itemName: data.itemName,
                type: 'GARMENT',
                brand: defaultBrandId,
                brandName: data.brandName,
                fabric: data.fabric,
                color: data.color,
                sizes: sizesArray,
                gstPercent: 5,
                isActive: true
            });
        }

        console.log("Cleaning up existing local Item Master...");
        await Item.deleteMany({});
        console.log("Cleared existing items.");

        console.log(`Inserting ${itemsToInsert.length} items into local database...`);
        const inserted = await Item.insertMany(itemsToInsert);
        console.log(`✅ Successfully seeded ${inserted.length} items with their size matrices!`);

    } catch (e) {
        console.error("Migration/Seeding Error:", e);
    } finally {
        await mongoose.connection.close();
    }
}

importToItemMaster();
