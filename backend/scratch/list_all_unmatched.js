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

        const reportPool = new Map();
        reportData.salesByStore.forEach(store => {
            const invoices = store.invoices.map(inv => ({ ...inv, matched: false }));
            reportPool.set(String(store.storeId), invoices);
        });

        const saleLogs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true }
        }).sort({ createdAt: 1 }).lean();

        // Reconcile
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
            }
        });

        // Relaxed
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
            }
        });

        console.log("Printing ALL unmatched invoices in report:");
        reportPool.forEach((invs, sid) => {
            invs.forEach(inv => {
                if (!inv.matched) {
                    console.log(`Store ID: ${sid}, Invoice #: ${inv.saleNumber}, Date: ${inv.date}, Net: ${inv.net}, Qty: ${inv.quantity}`);
                }
            });
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
