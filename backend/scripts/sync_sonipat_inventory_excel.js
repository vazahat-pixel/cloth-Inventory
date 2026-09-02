#!/usr/bin/env node
/**
 * CLI Script to Sync Sonipat Store Inventory with Excel Sheet.
 * - Excel items will be set to their Excel QTY.
 * - Items NOT in the Excel sheet will be set to 0 QTY (zeroed out).
 * 
 * Usage:
 * node scripts/sync_sonipat_inventory_excel.js "<path_to_excel_file>"
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const XLSX = require('xlsx');

const Store = require('../src/models/store.model');
const StoreInventory = require('../src/models/storeInventory.model');
const User = require('../src/models/user.model');
const storeInventoryService = require('../src/modules/storeInventory/storeInventory.service');

const SONIPAT_ID = '69e89f8e5df4170210683876';

const columnMapping = {
    itemCode: ['ITEM CODE', 'Barcode', 'Item Code', 'CODE', 'SKU', 'BARCODE', 'ItemCode', 'Barcode/SKU'],
    itemName: ['ITEM NAME', 'Item Name', 'Name', 'PRODUCT', 'ItemName'],
    closingStock: ['CLOSING STOCK', 'Closing Stock', 'Qty', 'Quantity', 'Stock', 'QTY', 'QUANTITY', 'ClosingStock']
};

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('ERROR: Please provide path to the Excel file.');
        console.log('Usage: node scripts/sync_sonipat_inventory_excel.js "<path_to_excel_file>"');
        process.exit(1);
    }

    const filePath = path.resolve(args[0]);
    console.log(`Reading Excel file: ${filePath}`);

    let workbook;
    try {
        workbook = XLSX.readFile(filePath);
    } catch (err) {
        console.error(`Failed to read Excel file at ${filePath}:`, err.message);
        process.exit(1);
    }

    let allData = [];
    workbook.SheetNames.forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        allData = [...allData, ...data];
    });

    console.log(`Total rows read across sheets: ${allData.length}`);
    if (allData.length === 0) {
        console.error('Excel file is empty!');
        process.exit(1);
    }

    const mappedItems = allData.map((row) => {
        const rowKeys = Object.keys(row);
        const findVal = (keys, regexFallback = null) => {
            for (const kw of keys) {
                const kwClean = String(kw).trim().toUpperCase();
                for (const k of rowKeys) {
                    if (String(k).trim().toUpperCase() === kwClean) {
                        const val = row[k];
                        if (val !== undefined && val !== null && String(val).trim() !== '') return val;
                    }
                }
            }
            for (const kw of keys) {
                const kwNorm = String(kw).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                for (const k of rowKeys) {
                    const kNorm = String(k).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    if (kNorm === kwNorm && kNorm.length > 0) {
                        const val = row[k];
                        if (val !== undefined && val !== null && String(val).trim() !== '') return val;
                    }
                }
            }
            if (regexFallback) {
                for (const k of rowKeys) {
                    if (regexFallback.test(String(k))) {
                        const val = row[k];
                        if (val !== undefined && val !== null && String(val).trim() !== '') return val;
                    }
                }
            }
            return '';
        };

        const itemCode = String(findVal(columnMapping.itemCode, /code|barcode|sku|article/i) || '').trim();
        const itemName = String(findVal(columnMapping.itemName, /name|product|desc/i) || '').trim();
        const rawStockVal = findVal(columnMapping.closingStock, /qty|stock|count|pcs|closing|total|bal/i);
        const closingStock = Number(rawStockVal !== '' ? rawStockVal : 0);

        return { itemCode, itemName, closingStock: isNaN(closingStock) ? 0 : closingStock };
    }).filter(item => item.itemCode);

    console.log(`Valid rows with SKU/Barcode: ${mappedItems.length}`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB database.');

    const sonipatStore = await Store.findById(SONIPAT_ID).lean();
    if (!sonipatStore) {
        console.error(`Sonipat store with ID ${SONIPAT_ID} not found in database!`);
        await mongoose.disconnect();
        process.exit(1);
    }
    console.log(`Target Store: ${sonipatStore.name} (${sonipatStore.storeCode})`);

    const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
    const userId = admin?._id || new mongoose.Types.ObjectId();

    console.log('\n--- STARTING INVENTORY SYNC FOR SONIPAT ---');
    console.log('1. Setting stock for Excel SKUs to specified Excel quantities');
    console.log('2. Zeroing out stock for any Sonipat items NOT present in the Excel file');

    const result = await storeInventoryService.bulkImportOpeningStock(
        {
            storeId: SONIPAT_ID,
            items: mappedItems,
            replaceExisting: true
        },
        userId
    );

    console.log('\n=== SYNC SUMMARY ===');
    console.log(`Total Excel Rows Processed: ${result.totalProcessed}`);
    console.log(`Successfully Updated Excel SKUs: ${result.successCount}`);
    console.log(`Non-Excel Items Zeroed Out: ${result.zeroedOutCount}`);
    console.log(`Failed / Master Missing SKUs: ${result.failedCount}`);

    if (result.errors && result.errors.length > 0) {
        console.log('\n--- Sample Errors / Missing Items (First 10) ---');
        console.log(JSON.stringify(result.errors.slice(0, 10), null, 2));
    }

    const postCount = await StoreInventory.countDocuments({ storeId: SONIPAT_ID, quantityAvailable: { $gt: 0 } });
    const postAgg = await StoreInventory.aggregate([
        { $match: { storeId: new mongoose.Types.ObjectId(SONIPAT_ID) } },
        { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
    ]);
    console.log(`\nNew Sonipat Active Items Count: ${postCount}`);
    console.log(`New Sonipat Total Quantity: ${postAgg[0]?.total || 0}`);

    await mongoose.disconnect();
    console.log('Database disconnected. Sonipat inventory update completed!');
}

main().catch(err => {
    console.error('CRITICAL ERROR in sync_sonipat_inventory_excel:', err);
    mongoose.disconnect();
    process.exit(1);
});
