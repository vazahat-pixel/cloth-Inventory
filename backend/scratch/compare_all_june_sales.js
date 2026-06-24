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

        for (const log of juneLogs) {
            const body = log.details.body;
            const logTotal = body.grandTotal;
            const logProducts = body.products || [];
            const logQty = logProducts.reduce((sum, p) => sum + p.quantity, 0);

            // Let's find a match in unmatchedDbSales.
            // We check:
            // - If the sale number is the same (if not overwritten)
            // - Or if grandTotal is identical (within 0.01) and quantity is identical
            let matchIndex = unmatchedDbSales.findIndex(s => s.saleNumber === body.saleNumber);
            
            if (matchIndex === -1) {
                // Try matching by total and quantity
                matchIndex = unmatchedDbSales.findIndex(s => 
                    Math.abs(s.grandTotal - logTotal) < 0.01 && 
                    s.items.reduce((sum, i) => sum + i.quantity, 0) === logQty
                );
            }

            if (matchIndex !== -1) {
                // Matched! Remove from unmatchedDbSales
                unmatchedDbSales.splice(matchIndex, 1);
            } else {
                unmatchedLogs.push(log);
            }
        }

        console.log(`\n=== Unmatched DB Sales (${unmatchedDbSales.length}) ===`);
        unmatchedDbSales.forEach(s => {
            console.log(`- ${s.saleNumber}: ${s.saleDate.toISOString().split('T')[0]}, Customer: ${s.customerName}, Qty: ${s.items.reduce((sum, i) => sum + i.quantity, 0)}, Amt: ${s.grandTotal}, ID: ${s._id}`);
        });

        console.log(`\n=== Unmatched Logs (${unmatchedLogs.length}) ===`);
        unmatchedLogs.forEach(l => {
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
