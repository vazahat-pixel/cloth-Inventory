require('dotenv').config();
const mongoose = require('mongoose');

// Register models
const Store = require('../src/models/store.model');
const Warehouse = require('../src/models/warehouse.model');
const Sale = require('../src/models/sale.model');
const StoreInventory = require('../src/models/storeInventory.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');
const Item = require('../src/models/item.model');

async function run() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    // 1. Fetch all stores & warehouses for mapping names
    const allStores = await Store.find().lean();
    const allWarehouses = await Warehouse.find().lean();

    const storeMap = {};
    allStores.forEach(s => { storeMap[s._id.toString()] = s.name; });
    const warehouseMap = {};
    allWarehouses.forEach(w => { warehouseMap[w._id.toString()] = w.name; });

    console.log(`Loaded ${allStores.length} stores and ${allWarehouses.length} warehouses.`);

    // 2. Calculate store-wise sales
    console.log('Calculating store-wise sales...');
    const storeWiseSalesRaw = await Sale.aggregate([
        {
            $match: {
                isDeleted: false,
                status: { $nin: ['CANCELLED', 'REFUNDED'] },
                $or: [{ type: { $exists: false } }, { type: { $nin: ['INTERNAL_SALE'] } }]
            }
        },
        {
            $group: {
                _id: '$storeId',
                totalRevenue: { $sum: '$grandTotal' },
                salesCount: { $sum: 1 }
            }
        }
    ]);

    let grandTotalSales = 0;
    const storeWiseSales = storeWiseSalesRaw.map(item => {
        const storeName = storeMap[item._id ? item._id.toString() : ''] || 'Direct/Unknown Store';
        grandTotalSales += item.totalRevenue;
        return {
            storeId: item._id,
            storeName,
            totalRevenue: Math.round(item.totalRevenue * 100) / 100,
            salesCount: item.salesCount
        };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // 3. Calculate warehouse stock totals
    console.log('Calculating warehouse stock totals...');
    const warehouseStockRaw = await WarehouseInventory.aggregate([
        {
            $group: {
                _id: '$warehouseId',
                totalQty: { $sum: '$quantity' },
                totalDamaged: { $sum: '$damagedQuantity' },
                totalInTransit: { $sum: '$quantityInTransit' }
            }
        }
    ]);

    const warehouseStock = warehouseStockRaw.map(item => {
        const warehouseName = warehouseMap[item._id ? item._id.toString() : ''] || 'Unknown Warehouse';
        return {
            warehouseId: item._id,
            warehouseName,
            totalQty: item.totalQty,
            totalDamaged: item.totalDamaged,
            totalInTransit: item.totalInTransit
        };
    }).sort((a, b) => b.totalQty - a.totalQty);

    // 4. Calculate store stock totals (Closing Stock)
    console.log('Calculating store stock totals...');
    const storeStockRaw = await StoreInventory.aggregate([
        {
            $group: {
                _id: '$storeId',
                totalQty: { $sum: '$quantityAvailable' },
                totalDamaged: { $sum: '$damagedQuantity' },
                totalInTransit: { $sum: '$quantityInTransit' }
            }
        }
    ]);

    const storeStock = storeStockRaw.map(item => {
        const storeName = storeMap[item._id ? item._id.toString() : ''] || 'Unknown Store';
        return {
            storeId: item._id,
            storeName,
            totalQty: item.totalQty,
            totalDamaged: item.totalDamaged,
            totalInTransit: item.totalInTransit
        };
    }).sort((a, b) => b.totalQty - a.totalQty);

    // 5. Get top items stock distribution
    console.log('Fetching top item stock details...');
    const topStoreItemsStock = await StoreInventory.aggregate([
        { $group: { _id: '$itemId', totalQty: { $sum: '$quantityAvailable' } } },
        { $sort: { totalQty: -1 } },
        { $limit: 15 },
        {
            $lookup: {
                from: 'items',
                localField: '_id',
                foreignField: '_id',
                as: 'itemInfo'
            }
        },
        { $unwind: '$itemInfo' },
        {
            $project: {
                name: '$itemInfo.itemName',
                itemCode: '$itemInfo.itemCode',
                totalQty: 1
            }
        }
    ]);

    const topWarehouseItemsStock = await WarehouseInventory.aggregate([
        { $group: { _id: '$itemId', totalQty: { $sum: '$quantity' } } },
        { $sort: { totalQty: -1 } },
        { $limit: 15 },
        {
            $lookup: {
                from: 'items',
                localField: '_id',
                foreignField: '_id',
                as: 'itemInfo'
            }
        },
        { $unwind: '$itemInfo' },
        {
            $project: {
                name: '$itemInfo.itemName',
                itemCode: '$itemInfo.itemCode',
                totalQty: 1
            }
        }
    ]);

    // Format output
    const reportData = {
        generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        grandTotalSales: Math.round(grandTotalSales * 100) / 100,
        storeWiseSales,
        warehouseStock,
        storeStock,
        topStoreItemsStock,
        topWarehouseItemsStock
    };

    console.log('\n================ REPORT SUMMARY ================');
    console.log(`Generated At: ${reportData.generatedAt}`);
    console.log(`Grand Total Sales (All Stores): INR ${reportData.grandTotalSales}`);
    console.log('Store Wise Sales:');
    console.table(storeWiseSales);
    console.log('Warehouse Stock:');
    console.table(warehouseStock);
    console.log('Store Stock (Closing Stock):');
    console.table(storeStock);
    console.log('================================================\n');

    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, 'report_output.json');
    fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2));
    console.log(`Saved report output to ${outputPath}`);

    await mongoose.disconnect();
    console.log('Disconnected!');
}

run().catch(err => {
    console.error('Error running report query:', err);
    process.exit(1);
});
