const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69e86a235df4170210683604'; // Pitampura

        // 1. Fetch Pitampura sales in DB
        const dbSales = await Sale.find({ storeId, isDeleted: false }).lean();
        console.log(`DB Sales: ${dbSales.length}`);

        // 2. Fetch all POST /api/sales logs for Pitampura
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId)
        }).lean();
        console.log(`SystemLogs: ${logs.length}`);

        // Try to match them up
        const unmatchedLogs = [];
        const unmatchedDbSales = [...dbSales];

        for (const log of logs) {
            const body = log.details.body;
            if (!body) continue;
            const logTotal = body.grandTotal;
            const logProducts = body.products || [];
            const logQty = logProducts.reduce((sum, p) => sum + p.quantity, 0);

            // Try strictly by saleNumber first
            let matchIndex = unmatchedDbSales.findIndex(s => s.saleNumber === body.saleNumber);

            if (matchIndex === -1) {
                // Fallback: match by grandTotal (within 0.01) and quantity
                matchIndex = unmatchedDbSales.findIndex(s => 
                    Math.abs(s.grandTotal - logTotal) < 0.01 && 
                    s.items.reduce((sum, i) => sum + i.quantity, 0) === logQty
                );
            }

            if (matchIndex !== -1) {
                unmatchedDbSales.splice(matchIndex, 1);
            } else {
                unmatchedLogs.push(log);
            }
        }

        console.log(`\n=== Unmatched DB Sales (${unmatchedDbSales.length}) ===`);
        unmatchedDbSales.forEach(s => {
            console.log(`- ${s.saleNumber}: Qty ${s.items.reduce((sum, i) => sum + i.quantity, 0)}, Amt ${s.grandTotal}, Customer: ${s.customerName}`);
        });

        console.log(`\n=== Unmatched SystemLogs (${unmatchedLogs.length}) ===`);
        unmatchedLogs.forEach(l => {
            const b = l.details.body;
            const date = b.date || l.createdAt.toISOString().split('T')[0];
            const qty = (b.products || []).reduce((sum, p) => sum + p.quantity, 0);
            console.log(`- LogID: ${l._id}, Date: ${date}, SaleNum: ${b.saleNumber || 'N/A'}, Qty: ${qty}, Amt: ${b.grandTotal}, Customer: ${b.customerName}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
