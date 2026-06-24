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
            storeId,
            saleDate: {
                $gte: new Date('2026-06-01T00:00:00Z'),
                $lte: new Date('2026-06-30T23:59:59Z')
            }
        }).lean();

        // 2. Get all POST /api/sales logs in June (body date or log date)
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId)
        }).lean();

        const juneLogs = logs.filter(l => {
            const body = l.details.body;
            if (!body) return false;
            const date = body.date || l.createdAt.toISOString().split('T')[0];
            return date.startsWith('2026-06');
        });

        console.log(`DB June Sales Count: ${dbSales.length}`);
        console.log(`June Logs Count: ${juneLogs.length}`);

        // Try to pair them up
        const unmatchedLogs = [];
        const unmatchedDbSales = [...dbSales];

        // We will perform matching in two passes.
        // Pass 1: Strict match by saleNumber, grandTotal, and quantity
        for (let i = juneLogs.length - 1; i >= 0; i--) {
            const log = juneLogs[i];
            const body = log.details.body;
            const logTotal = body.grandTotal;
            const logQty = (body.products || []).reduce((sum, p) => sum + p.quantity, 0);

            const matchIndex = unmatchedDbSales.findIndex(s => 
                s.saleNumber === body.saleNumber &&
                Math.abs(s.grandTotal - logTotal) < 0.01 &&
                s.items.reduce((sum, item) => sum + item.quantity, 0) === logQty
            );

            if (matchIndex !== -1) {
                unmatchedDbSales.splice(matchIndex, 1);
                juneLogs.splice(i, 1);
            }
        }

        // Pass 2: Content-based match (by grandTotal and quantity) for remaining
        for (let i = juneLogs.length - 1; i >= 0; i--) {
            const log = juneLogs[i];
            const body = log.details.body;
            const logTotal = body.grandTotal;
            const logQty = (body.products || []).reduce((sum, p) => sum + p.quantity, 0);

            // Also support matching the scaled sales from the reconciliation patch
            // The 7 imported sales are GTB-0137 to GTB-0143 in the DB
            // Let's see if we can match by comparing customer names or barcodes
            const matchIndex = unmatchedDbSales.findIndex(s => {
                const sQty = s.items.reduce((sum, item) => sum + item.quantity, 0);
                if (sQty !== logQty) return false;

                // If it's one of our scaled sales:
                if (s.saleNumber >= 'GTB-0137' && s.saleNumber <= 'GTB-0143') {
                    // Check if customer matches
                    const sCust = s.customerName.toLowerCase().trim();
                    const lCust = (body.customerName || '').toLowerCase().trim();
                    if (sCust === lCust || (sCust.includes(lCust) && lCust.length > 2) || (lCust.includes(sCust) && sCust.length > 2)) {
                        return true;
                    }
                }

                // Normal fallback matching
                return Math.abs(s.grandTotal - logTotal) < 0.01;
            });

            if (matchIndex !== -1) {
                unmatchedDbSales.splice(matchIndex, 1);
                juneLogs.splice(i, 1);
            }
        }

        console.log(`\n=== Unmatched DB Sales (${unmatchedDbSales.length}) ===`);
        unmatchedDbSales.forEach(s => {
            console.log(`- ${s.saleNumber}: ${s.saleDate.toISOString().split('T')[0]}, Customer: ${s.customerName}, Qty: ${s.items.reduce((sum, i) => sum + i.quantity, 0)}, Amt: ${s.grandTotal}, ID: ${s._id}`);
        });

        console.log(`\n=== Unmatched Logs (${juneLogs.length}) ===`);
        juneLogs.forEach(l => {
            const b = l.details.body;
            const date = b.date || l.createdAt.toISOString().split('T')[0];
            const qty = (b.products || []).reduce((sum, p) => sum + p.quantity, 0);
            console.log(`- LogID: ${l._id}, Date: ${date}, SaleNum: ${b.saleNumber || 'N/A'}, Customer: ${b.customerName}, Qty: ${qty}, Amt: ${b.grandTotal}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
