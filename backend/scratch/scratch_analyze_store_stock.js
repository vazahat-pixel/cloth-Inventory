require('dotenv').config();
const mongoose = require('mongoose');

// Register models
const Store = require('../src/models/store.model');
const Warehouse = require('../src/models/warehouse.model');
const StockLedger = require('../src/models/stockLedger.model');
const StoreInventory = require('../src/models/storeInventory.model');

async function run() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    // 1. Fetch all stores
    const allStores = await Store.find().lean();
    console.log(`Loaded ${allStores.length} stores.`);

    const storeAnalysis = [];

    // 2. Loop through each store to perform ledger aggregation
    for (const store of allStores) {
        const storeId = store._id;
        const storeName = store.name;

        // Aggregate StockLedger for this store
        const ledgerStats = await StockLedger.aggregate([
            {
                $match: {
                    locationId: storeId,
                    locationType: 'STORE'
                }
            },
            {
                $group: {
                    _id: { source: '$source', type: '$type' },
                    totalQuantity: { $sum: '$quantity' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Also fetch the current closing stock from StoreInventory
        const currentInvSum = await StoreInventory.aggregate([
            {
                $match: { storeId: storeId }
            },
            {
                $group: {
                    _id: null,
                    totalAvailable: { $sum: '$quantityAvailable' },
                    totalDamaged: { $sum: '$damagedQuantity' },
                    totalInTransit: { $sum: '$quantityInTransit' }
                }
            }
        ]);

        const closingStockData = currentInvSum[0] || { totalAvailable: 0, totalDamaged: 0, totalInTransit: 0 };

        // Parse ledger stats
        let openingStock = 0;
        let totalInward = 0;
        let totalInwardBreakdown = {};
        let totalOutward = 0;
        let totalOutwardBreakdown = {};

        ledgerStats.forEach(stat => {
            const source = stat._id.source;
            const type = stat._id.type;
            const qty = stat.totalQuantity;

            if (type === 'IN') {
                if (source === 'OPENING_BALANCE') {
                    openingStock += qty;
                } else {
                    totalInward += qty;
                    totalInwardBreakdown[source] = (totalInwardBreakdown[source] || 0) + qty;
                }
            } else if (type === 'OUT') {
                totalOutward += qty;
                totalOutwardBreakdown[source] = (totalOutwardBreakdown[source] || 0) + qty;
            }
        });

        // Calculate reconciled closing stock: Opening + Inward - Outward
        const reconciledClosingStock = openingStock + totalInward - totalOutward;

        storeAnalysis.push({
            storeId: storeId.toString(),
            storeName,
            openingStock,
            totalInward,
            totalInwardBreakdown,
            totalOutward,
            totalOutwardBreakdown,
            reconciledClosingStock,
            dbClosingStock: closingStockData.totalAvailable,
            dbInTransit: closingStockData.totalInTransit,
            dbDamaged: closingStockData.totalDamaged
        });
    }

    // Output formatting
    const reportData = {
        generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        stores: storeAnalysis
    };

    console.log('\n================ STORE-WISE AUDIT REPORT ================');
    storeAnalysis.forEach(store => {
        if (store.openingStock > 0 || store.totalInward > 0 || store.totalOutward > 0 || store.dbClosingStock > 0) {
            console.log(`\n🏪 Store: ${store.storeName} (${store.storeId})`);
            console.log(`   └─ Start/Opening Stock:   ${store.openingStock} units`);
            console.log(`   └─ Total Stock Inward:    +${store.totalInward} units`);
            if (Object.keys(store.totalInwardBreakdown).length > 0) {
                console.log(`      └─ Breakdown: ${JSON.stringify(store.totalInwardBreakdown)}`);
            }
            console.log(`   └─ Total Stock Outward:   -${store.totalOutward} units`);
            if (Object.keys(store.totalOutwardBreakdown).length > 0) {
                console.log(`      └─ Breakdown: ${JSON.stringify(store.totalOutwardBreakdown)}`);
            }
            console.log(`   └─ Reconciled Closing:    ${store.reconciledClosingStock} units (Opening + Inward - Outward)`);
            console.log(`   └─ Actual DB Available:   ${store.dbClosingStock} units`);
            console.log(`   └─ In-Transit Stock:      ${store.dbInTransit} units`);
            console.log(`   └─ Damaged Stock:         ${store.dbDamaged} units`);
            if (store.reconciledClosingStock !== store.dbClosingStock) {
                console.log(`   ⚠️ WARNING: Discrepancy of ${store.reconciledClosingStock - store.dbClosingStock} units!`);
            }
        }
    });
    console.log('=========================================================\n');

    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, 'store_audit_output.json');
    fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2));
    console.log(`Saved audit report to ${outputPath}`);

    await mongoose.disconnect();
    console.log('Disconnected!');
}

run().catch(err => {
    console.error('Error running audit script:', err);
    process.exit(1);
});
