const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

        // 1. Build a pool of report invoices grouped by storeId
        const reportPool = new Map(); // storeId -> Array of invoices
        reportData.salesByStore.forEach(store => {
            const invoices = store.invoices.map(inv => ({
                ...inv,
                matched: false
            }));
            reportPool.set(String(store.storeId), invoices);
        });

        // 2. Fetch all sales logs
        const saleLogs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true }
        }).sort({ createdAt: 1 }).lean();

        console.log(`Matching ${saleLogs.length} sales logs against ${reportData.salesByStore.reduce((s, st) => s + st.invoices.length, 0)} report invoices...`);

        let matchedCount = 0;
        let unmatchedCount = 0;
        const matches = [];

        saleLogs.forEach(log => {
            const body = log.details.body;
            const storeId = String(body.storeId);
            const dateStr = body.date ? new Date(body.date).toISOString().split('T')[0] : '';
            const grandTotal = Math.round(body.grandTotal * 100) / 100;
            const paymentMode = String(body.paymentMode || '').toUpperCase();
            const quantity = body.products ? body.products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0) : 0;

            const storeInvoices = reportPool.get(storeId);
            if (!storeInvoices) {
                unmatchedCount++;
                return;
            }

            // Find matching invoice
            const matchIndex = storeInvoices.findIndex(inv => {
                if (inv.matched) return false;
                const invDateStr = inv.date; // already YYYY-MM-DD
                const invNet = Math.round(inv.net * 100) / 100;
                const invQty = Number(inv.quantity) || 0;
                const invPayMode = String(inv.paymentMode || '').toUpperCase();

                // Relaxed match on date and paymentMode, exact on net and quantity
                const dateMatch = (invDateStr === dateStr);
                const netMatch = (Math.abs(invNet - grandTotal) < 0.1);
                const qtyMatch = (invQty === quantity);
                
                return dateMatch && netMatch && qtyMatch;
            });

            if (matchIndex !== -1) {
                storeInvoices[matchIndex].matched = true;
                matchedCount++;
                matches.push({
                    logId: log._id,
                    saleNumber: storeInvoices[matchIndex].saleNumber,
                    grandTotal
                });
            } else {
                unmatchedCount++;
            }
        });

        console.log(`Match Results:`);
        console.log(`- Matched: ${matchedCount}`);
        console.log(`- Unmatched: ${unmatchedCount}`);

        // Check if there are remaining unmatched invoices in the report
        let remainingInvoices = 0;
        reportPool.forEach((invs, sid) => {
            invs.forEach(inv => {
                if (!inv.matched) remainingInvoices++;
            });
        });
        console.log(`- Unmatched report invoices remaining: ${remainingInvoices}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
