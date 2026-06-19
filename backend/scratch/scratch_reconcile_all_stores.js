require('dotenv').config();
const mongoose = require('mongoose');

const Store = require('../src/models/store.model');
const StockLedger = require('../src/models/stockLedger.model');
const StoreInventory = require('../src/models/storeInventory.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const allStores = await Store.find().lean();
    const reconciliationReport = [];

    const june3Start = new Date('2026-06-03T00:00:00.000Z');
    const june3End = new Date('2026-06-03T23:59:59.999Z');

    for (const store of allStores) {
        const storeId = store._id;
        const storeName = store.name;

        // 1. Calculate June 3 Initial Stock Setup (Direct DB creations)
        const initialStockRes = await StoreInventory.aggregate([
            {
                $match: {
                    storeId: storeId,
                    createdAt: { $gte: june3Start, $lte: june3End }
                }
            },
            {
                $group: {
                    _id: null,
                    totalQty: { $sum: '$quantityAvailable' },
                    count: { $sum: 1 }
                }
            }
        ]);
        const directInitialStock = initialStockRes[0]?.totalQty || 0;
        const directInitialItemsCount = initialStockRes[0]?.count || 0;

        // 2. Fetch Ledger Opening Balance (explicitly logged as OPENING_BALANCE source)
        const ledgerOpeningRes = await StockLedger.aggregate([
            {
                $match: {
                    locationId: storeId,
                    locationType: 'STORE',
                    type: 'IN',
                    source: 'OPENING_BALANCE'
                }
            },
            {
                $group: {
                    _id: null,
                    totalQty: { $sum: '$quantity' }
                }
            }
        ]);
        const ledgerOpeningStock = ledgerOpeningRes[0]?.totalQty || 0;

        const totalOpeningStock = directInitialStock + ledgerOpeningStock;

        // 3. Calculate Subsequent Inward movements from Ledger (Dispatches & Transfers)
        const ledgerInwardRes = await StockLedger.aggregate([
            {
                $match: {
                    locationId: storeId,
                    locationType: 'STORE',
                    type: 'IN',
                    source: { $ne: 'OPENING_BALANCE' }
                }
            },
            {
                $group: {
                    _id: '$source',
                    totalQty: { $sum: '$quantity' }
                }
            }
        ]);
        let totalInward = 0;
        const inwardBreakdown = {};
        ledgerInwardRes.forEach(item => {
            totalInward += item.totalQty;
            inwardBreakdown[item._id] = item.totalQty;
        });

        // 4. Calculate Outward movements from Ledger (Sales, Returns, Adjustments)
        const ledgerOutwardRes = await StockLedger.aggregate([
            {
                $match: {
                    locationId: storeId,
                    locationType: 'STORE',
                    type: 'OUT'
                }
            },
            {
                $group: {
                    _id: '$source',
                    totalQty: { $sum: '$quantity' }
                }
            }
        ]);
        let totalOutward = 0;
        const outwardBreakdown = {};
        ledgerOutwardRes.forEach(item => {
            totalOutward += item.totalQty;
            outwardBreakdown[item._id] = item.totalQty;
        });

        // 5. Fetch actual current closing stock in the DB
        const currentInvRes = await StoreInventory.aggregate([
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
        const closingStockData = currentInvRes[0] || { totalAvailable: 0, totalDamaged: 0, totalInTransit: 0 };

        const mathReconciled = totalOpeningStock + totalInward - totalOutward;
        const discrepancy = closingStockData.totalAvailable - mathReconciled;

        reconciliationReport.push({
            storeId: storeId.toString(),
            storeName,
            directInitialStock,
            directInitialItemsCount,
            ledgerOpeningStock,
            totalOpeningStock,
            totalInward,
            inwardBreakdown,
            totalOutward,
            outwardBreakdown,
            mathReconciled,
            dbClosingStock: closingStockData.totalAvailable,
            dbInTransit: closingStockData.totalInTransit,
            discrepancy: Math.round(discrepancy * 100) / 100
        });
    }

    const reportData = {
        generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        report: reconciliationReport
    };

    const fs = require('fs');
    const path = require('path');
    fs.writeFileSync(path.join(__dirname, 'reconciliation_output.json'), JSON.stringify(reportData, null, 2));

    console.log('Reconciliation run complete and saved to reconciliation_output.json');
    await mongoose.disconnect();
}

run().catch(console.error);
