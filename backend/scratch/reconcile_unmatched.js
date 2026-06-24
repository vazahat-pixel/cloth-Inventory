const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

        // Build a pool of unmatched report invoices grouped by storeId
        const reportPool = new Map(); // storeId -> Array of invoices
        reportData.salesByStore.forEach(store => {
            const invoices = store.invoices.map(inv => ({
                ...inv,
                matched: false
            }));
            reportPool.set(String(store.storeId), invoices);
        });

        // Load all sales logs
        const saleLogs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true }
        }).sort({ createdAt: 1 }).lean();

        // Step 1: Strict match (exact date, exact total, exact qty)
        let strictMatched = 0;
        const matchedLogIds = new Set();

        saleLogs.forEach(log => {
            const body = log.details.body;
            const storeId = String(body.storeId);
            const dateStr = body.date || new Date(log.createdAt).toISOString().split('T')[0];
            const grandTotal = Math.round(body.grandTotal * 100) / 100;
            const quantity = body.products ? body.products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0) : 0;

            const storeInvoices = reportPool.get(storeId);
            if (!storeInvoices) return;

            const matchIndex = storeInvoices.findIndex(inv => {
                if (inv.matched) return false;
                const invDateStr = inv.date;
                const invNet = Math.round(inv.net * 100) / 100;
                const invQty = Number(inv.quantity) || 0;
                return (invDateStr === dateStr) && (Math.abs(invNet - grandTotal) < 0.1) && (invQty === quantity);
            });

            if (matchIndex !== -1) {
                storeInvoices[matchIndex].matched = true;
                matchedLogIds.add(log._id.toString());
                strictMatched++;
            }
        });

        console.log(`Strict Matched: ${strictMatched}`);

        // Step 2: Relaxed match for remaining unmatched logs/invoices (date within 3 days, exact total and qty)
        let relaxedMatched = 0;
        const relaxedMatches = [];

        saleLogs.forEach(log => {
            if (matchedLogIds.has(log._id.toString())) return;

            const body = log.details.body;
            const storeId = String(body.storeId);
            const logDate = new Date(body.date || log.createdAt);
            const grandTotal = Math.round(body.grandTotal * 100) / 100;
            const quantity = body.products ? body.products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0) : 0;

            const storeInvoices = reportPool.get(storeId);
            if (!storeInvoices) return;

            const matchIndex = storeInvoices.findIndex(inv => {
                if (inv.matched) return false;
                const invDate = new Date(inv.date);
                const invNet = Math.round(inv.net * 100) / 100;
                const invQty = Number(inv.quantity) || 0;

                const daysDiff = Math.abs(invDate - logDate) / (1000 * 60 * 60 * 24);
                return (daysDiff <= 3.1) && (Math.abs(invNet - grandTotal) < 0.1) && (invQty === quantity);
            });

            if (matchIndex !== -1) {
                storeInvoices[matchIndex].matched = true;
                matchedLogIds.add(log._id.toString());
                relaxedMatched++;
                relaxedMatches.push({
                    logId: log._id,
                    saleNumber: storeInvoices[matchIndex].saleNumber,
                    reportDate: storeInvoices[matchIndex].date,
                    logDate: body.date || log.createdAt,
                    grandTotal
                });
            }
        });

        console.log(`Relaxed Matched (within 3 days): ${relaxedMatched}`);
        relaxedMatches.forEach(m => {
            console.log(`- Matched log ${m.logId} (Date: ${m.logDate.toString().substring(0, 10)}) to Report ${m.saleNumber} (Date: ${m.reportDate}) - Total: ${m.grandTotal}`);
        });

        // Let's count how many unmatched report invoices remain
        let unmatchedReportCount = 0;
        const unmatchedReportInvoices = [];
        reportPool.forEach(invs => {
            invs.forEach(inv => {
                if (!inv.matched) {
                    unmatchedReportCount++;
                    unmatchedReportInvoices.push(inv);
                }
            });
        });

        console.log(`Remaining unmatched report invoices: ${unmatchedReportCount}`);
        unmatchedReportInvoices.slice(0, 10).forEach(inv => {
            console.log(`- Unmatched Report Invoice: ${inv.saleNumber}, Date: ${inv.date}, Net: ${inv.net}, Qty: ${inv.quantity}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
