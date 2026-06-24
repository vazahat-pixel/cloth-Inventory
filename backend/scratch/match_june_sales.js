const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';

        // 1. Get all DB sales for June
        const dbSales = await Sale.find({
            storeId: storeId,
            saleDate: {
                $gte: new Date('2026-06-01T00:00:00Z'),
                $lte: new Date('2026-06-30T23:59:59Z')
            }
        }).sort({ saleDate: 1 }).lean();

        console.log(`DB Sales Count: ${dbSales.length}`);
        
        // 2. Get all POST /api/sales SystemLogs for GTB store created in June
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId),
            createdAt: {
                $gte: new Date('2026-06-01T00:00:00Z'),
                $lte: new Date('2026-06-30T23:59:59Z')
            }
        }).sort({ createdAt: 1 }).lean();

        console.log(`SystemLogs Count: ${logs.length}`);

        // We want to match logs to DB sales.
        // Let's match by comparing grandTotal and product barcodes/quantities.
        const unmatchedLogs = [];
        const matchedLogIds = new Set();
        const matchedSaleIds = new Set();

        for (const log of logs) {
            const body = log.details.body;
            if (!body) continue;
            const logTotal = body.grandTotal;
            const logProducts = body.products || [];
            const logQty = logProducts.reduce((sum, p) => sum + p.quantity, 0);

            // Find a DB sale that matches this log
            let match = null;
            for (const sale of dbSales) {
                if (matchedSaleIds.has(sale._id.toString())) continue;
                
                const saleTotal = sale.grandTotal;
                const saleQty = sale.items.reduce((sum, i) => sum + i.quantity, 0);

                // Match by total and quantity first
                if (Math.abs(saleTotal - logTotal) < 0.01 && saleQty === logQty) {
                    // Check barcode match if possible
                    const logBarcodes = new Set(logProducts.map(p => p.barcode));
                    const saleBarcodes = new Set(sale.items.map(i => i.barcode));
                    let barcodesMatch = true;
                    for (const bc of logBarcodes) {
                        if (!saleBarcodes.has(bc)) {
                            barcodesMatch = false;
                            break;
                        }
                    }
                    if (barcodesMatch) {
                        match = sale;
                        break;
                    }
                }
            }

            if (match) {
                matchedLogIds.add(log._id.toString());
                matchedSaleIds.add(match._id.toString());
            } else {
                unmatchedLogs.push(log);
            }
        }

        console.log(`\nMatched Logs: ${matchedLogIds.size}`);
        console.log(`Unmatched Logs: ${unmatchedLogs.length}`);

        console.log(`\nUnmatched Logs details:`);
        let totalUnmatchedQty = 0;
        let totalUnmatchedAmt = 0;
        unmatchedLogs.forEach(l => {
            const body = l.details.body;
            const qty = (body.products || []).reduce((sum, p) => sum + p.quantity, 0);
            const amt = body.grandTotal;
            const date = body.date || new Date(l.createdAt).toISOString().split('T')[0];
            console.log(`- Log ID: ${l._id}, Date: ${date}, Qty: ${qty}, Amt: ${amt.toFixed(2)}, CreatedAt: ${l.createdAt}`);
            totalUnmatchedQty += qty;
            totalUnmatchedAmt += amt;
        });

        console.log(`\nTotal Unmatched Logs: Qty = ${totalUnmatchedQty}, Amt = ${totalUnmatchedAmt.toFixed(2)}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
