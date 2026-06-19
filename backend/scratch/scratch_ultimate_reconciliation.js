require('dotenv').config();
const mongoose = require('mongoose');

const Store = require('../src/models/store.model');
const StockLedger = require('../src/models/stockLedger.model');
const StoreInventory = require('../src/models/storeInventory.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const allStores = await Store.find().lean();
    const finalReport = [];

    for (const store of allStores) {
        const storeId = store._id;
        const storeName = store.name;

        // 1. Get all StoreInventory records for this store
        const inventoryRecords = await StoreInventory.find({ storeId }).lean();
        if (inventoryRecords.length === 0) continue;

        let totalOpeningSetup = 0;
        let totalLedgerInward = 0;
        let totalLedgerOutward = 0;
        let totalActualClosing = 0;
        
        let dispatchInward = 0;
        let otherInward = 0;
        let salesOutward = 0;
        let otherOutward = 0;

        for (const record of inventoryRecords) {
            totalActualClosing += record.quantityAvailable;

            // Fetch all ledger entries for this specific barcode at this store
            const ledgerEntries = await StockLedger.find({
                locationId: storeId,
                barcode: record.barcode
            }).lean();

            // The actual stock was created on record.createdAt.
            // If there's no ledger entry of type 'IN' with source 'OPENING_BALANCE' or 'DISPATCH' that covers this initial amount,
            // then the creation of this StoreInventory record acts as the initial "Opening Stock Setup".
            
            // Let's sum subsequent ledger transactions
            let itemIn = 0;
            let itemOut = 0;

            ledgerEntries.forEach(entry => {
                if (entry.type === 'IN') {
                    itemIn += entry.quantity;
                    if (entry.source === 'DISPATCH' || entry.source === 'TRANSFER') {
                        dispatchInward += entry.quantity;
                    } else {
                        otherInward += entry.quantity;
                    }
                } else if (entry.type === 'OUT') {
                    itemOut += entry.quantity;
                    if (entry.source === 'SALE') {
                        salesOutward += entry.quantity;
                    } else {
                        otherOutward += entry.quantity;
                    }
                }
            });

            // The initial opening setup is whatever was there that wasn't added by the ledger (or if ledger exceeds, opening is 0)
            const calculatedOpening = Math.max(0, record.quantityAvailable + itemOut - itemIn);
            totalOpeningSetup += calculatedOpening;
            totalLedgerInward += itemIn;
            totalLedgerOutward += itemOut;
        }

        finalReport.push({
            storeName,
            openingStock: totalOpeningSetup,
            inwardStock: totalLedgerInward,
            dispatchInward,
            otherInward,
            outwardStock: totalLedgerOutward,
            salesOutward,
            otherOutward,
            closingStock: totalActualClosing,
            reconciled: totalOpeningSetup + totalLedgerInward - totalLedgerOutward
        });
    }

    const reportData = {
        generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        report: finalReport
    };

    const fs = require('fs');
    const path = require('path');
    fs.writeFileSync(path.join(__dirname, 'ultimate_reconciliation.json'), JSON.stringify(reportData, null, 2));

    console.log('Ultimate reconciliation complete!');
    await mongoose.disconnect();
}

run().catch(console.error);
