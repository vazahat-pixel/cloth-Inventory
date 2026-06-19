require('dotenv').config();
const mongoose = require('mongoose');

const Store = require('../src/models/store.model');
const StockLedger = require('../src/models/stockLedger.model');
const StoreInventory = require('../src/models/storeInventory.model');

async function run() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // 1. Get closing stocks by store
    const closingStocks = await StoreInventory.aggregate([
        {
            $group: {
                _id: '$storeId',
                totalClosingStock: { $sum: '$quantityAvailable' },
                totalInTransit: { $sum: '$quantityInTransit' }
            }
        }
    ]);

    const closingStockMap = {};
    closingStocks.forEach(item => {
        if (item._id) {
            closingStockMap[item._id.toString()] = {
                closingStock: item.totalClosingStock,
                inTransit: item.totalInTransit
            };
        }
    });

    // 2. Get stock ledger movements by store
    const ledgerMovements = await StockLedger.aggregate([
        {
            $match: {
                locationType: 'STORE'
            }
        },
        {
            $group: {
                _id: { storeId: '$locationId', type: '$type', source: '$source' },
                totalQty: { $sum: '$quantity' }
            }
        }
    ]);

    const storeLedgerMap = {};
    ledgerMovements.forEach(move => {
        const storeId = move._id.storeId.toString();
        const type = move._id.type;
        const source = move._id.source;
        const qty = move.totalQty;

        if (!storeLedgerMap[storeId]) {
            storeLedgerMap[storeId] = {
                totalIn: 0,
                totalOut: 0,
                dispatchInward: 0,
                otherInward: 0,
                salesOutward: 0,
                otherOutward: 0,
                ledgerOpeningStock: 0,
                inwardBreakdown: {},
                outwardBreakdown: {}
            };
        }

        const storeData = storeLedgerMap[storeId];
        if (type === 'IN') {
            storeData.totalIn += qty;
            storeData.inwardBreakdown[source] = qty;
            if (source === 'DISPATCH' || source === 'TRANSFER') {
                storeData.dispatchInward += qty;
            } else if (source === 'OPENING_BALANCE') {
                storeData.ledgerOpeningStock += qty;
            } else {
                storeData.otherInward += qty;
            }
        } else if (type === 'OUT') {
            storeData.totalOut += qty;
            storeData.outwardBreakdown[source] = qty;
            if (source === 'SALE') {
                storeData.salesOutward += qty;
            } else {
                storeData.otherOutward += qty;
            }
        }
    });

    // 3. Reconcile for all stores
    const allStores = await Store.find().lean();
    const finalReport = [];

    allStores.forEach(store => {
        const storeId = store._id.toString();
        const storeName = store.name;
        const closingData = closingStockMap[storeId] || { closingStock: 0, inTransit: 0 };
        const ledgerData = storeLedgerMap[storeId] || {
            totalIn: 0,
            totalOut: 0,
            dispatchInward: 0,
            otherInward: 0,
            salesOutward: 0,
            otherOutward: 0,
            ledgerOpeningStock: 0,
            inwardBreakdown: {},
            outwardBreakdown: {}
        };

        const closingStock = closingData.closingStock;
        
        // Opening Setup = Closing + Outward - Inward
        const openingStock = Math.max(0, closingStock + ledgerData.totalOut - ledgerData.totalIn);

        if (openingStock > 0 || ledgerData.totalIn > 0 || ledgerData.totalOut > 0 || closingStock > 0) {
            finalReport.push({
                storeId,
                storeName,
                openingStock, // Initial setups directly in DB or logged
                ledgerOpeningStock: ledgerData.ledgerOpeningStock,
                totalInward: ledgerData.totalIn,
                dispatchInward: ledgerData.dispatchInward,
                otherInward: ledgerData.otherInward,
                inwardBreakdown: ledgerData.inwardBreakdown,
                totalOutward: ledgerData.totalOut,
                salesOutward: ledgerData.salesOutward,
                otherOutward: ledgerData.otherOutward,
                outwardBreakdown: ledgerData.outwardBreakdown,
                closingStock,
                inTransit: closingData.inTransit,
                reconciled: Math.round((openingStock + ledgerData.totalIn - ledgerData.totalOut) * 100) / 100
            });
        }
    });

    const reportData = {
        generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        report: finalReport
    };

    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, 'ultimate_reconciliation.json');
    fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2));

    console.log('\n================ FAST RECONCILIATION SUMMARY ================');
    finalReport.forEach(store => {
        console.log(`\n🏪 Store: ${store.storeName}`);
        console.log(`   └─ Initial/Opening Stock:   ${store.openingStock} units`);
        console.log(`   └─ Total Stock Inward:      +${store.totalInward} units (Dispatches: ${store.dispatchInward}, Other: ${store.otherInward})`);
        console.log(`   └─ Total Stock Outward:     -${store.totalOutward} units (Sales: ${store.salesOutward}, Other: ${store.otherOutward})`);
        console.log(`   └─ Closing Stock (Current):  ${store.closingStock} units`);
    });
    console.log('=============================================================\n');

    await mongoose.disconnect();
    console.log('Disconnected!');
}

run().catch(console.error);
