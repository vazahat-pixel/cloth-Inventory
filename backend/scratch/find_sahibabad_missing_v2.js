const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeIdStr = '69ecbe2cf04d7249bd11ae45';
        const storeId = new mongoose.Types.ObjectId(storeIdStr);
        console.log("=== SAHIBABAD MISSING SALES AUDIT ===");

        // 1. Get DB Sales
        const dbSales = await Sale.find({ storeId, isDeleted: false }).sort({ saleDate: 1 }).lean();
        console.log(`Total Sahibabad sales in DB: ${dbSales.length}`);

        // 2. Load Report Invoices
        const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
        let reportInvs = [];
        if (fs.existsSync(reportPath)) {
            const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            const rStore = reportData.salesByStore.find(s => String(s.storeId) === storeIdStr);
            if (rStore) {
                reportInvs = rStore.invoices;
            }
        }
        console.log(`Total Sahibabad invoices in June 19 Report: ${reportInvs.length}`);

        // 3. Load System Logs for Sahibabad
        const logs = await SystemLog.find({
            $or: [
                { "details.body.storeId": storeIdStr },
                { "details.body.storeId": storeId },
                { "details.storeId": storeIdStr },
                { "details.storeId": storeId }
            ]
        }).sort({ createdAt: 1 }).lean();
        console.log(`Total System Logs for Sahibabad: ${logs.length}`);

        const uniqueActions = [...new Set(logs.map(l => l.action))];
        console.log(`Unique Actions in logs: ${JSON.stringify(uniqueActions)}`);

        const postSalesLogs = logs.filter(l => l.action && (l.action.includes('sales') || l.action.includes('sale') || l.action.includes('Sale')));
        console.log(`Total sale-related logs: ${postSalesLogs.length}`);

        // Let's match May sales
        console.log("\n==================== MAY AUDIT ====================");
        const dbMay = dbSales.filter(s => s.saleDate >= new Date('2026-05-01T00:00:00Z') && s.saleDate <= new Date('2026-05-31T23:59:59Z'));
        const reportMay = reportInvs.filter(inv => inv.date.startsWith('2026-05'));
        const logsMay = postSalesLogs.filter(l => {
            const body = l.details?.body || {};
            const date = body.saleDate || body.date || l.createdAt.toISOString();
            return date.startsWith('2026-05') || date.includes('-05-');
        });

        console.log(`May - DB Count: ${dbMay.length}, Report Count: ${reportMay.length}, Logs Count: ${logsMay.length}`);
        
        // Find if there's any log in May that is not in the DB
        console.log("\nChecking May System Logs against DB Sales:");
        logsMay.forEach(l => {
            const body = l.details?.body || {};
            const total = body.grandTotal || body.total || 0;
            const customer = body.customerName || 'N/A';
            const qty = (body.items || body.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0);
            const date = body.saleDate || body.date || l.createdAt.toISOString();
            
            // Try to find matching sale in dbMay
            const match = dbMay.find(s => Math.abs(s.grandTotal - total) < 0.1 && s.items.reduce((sum, i) => sum + i.quantity, 0) === qty);
            if (match) {
                // console.log(`- Matched: Log ${l._id} (${customer}, Qty: ${qty}, Tot: ${total}) with DB Sale ${match.saleNumber}`);
            } else {
                console.log(`- NOT MATCHED IN DB: Log ${l._id} | Date: ${date} | Customer: ${customer} | Qty: ${qty} | Total: ${total}`);
                console.log(`  Log Details Body: ${JSON.stringify(body)}`);
            }
        });

        // Let's match June sales
        console.log("\n==================== JUNE AUDIT ====================");
        const dbJune = dbSales.filter(s => s.saleDate >= new Date('2026-06-01T00:00:00Z') && s.saleDate <= new Date('2026-06-30T23:59:59Z'));
        const reportJune = reportInvs.filter(inv => inv.date.startsWith('2026-06'));
        const logsJune = postSalesLogs.filter(l => {
            const body = l.details?.body || {};
            const date = body.saleDate || body.date || l.createdAt.toISOString();
            return date.startsWith('2026-06') || date.includes('-06-');
        });

        console.log(`June - DB Count: ${dbJune.length}, Report Count: ${reportJune.length}, Logs Count: ${logsJune.length}`);

        console.log("\nChecking June System Logs against DB Sales:");
        logsJune.forEach(l => {
            const body = l.details?.body || {};
            const total = body.grandTotal || body.total || 0;
            const customer = body.customerName || 'N/A';
            const qty = (body.items || body.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0);
            const date = body.saleDate || body.date || l.createdAt.toISOString();
            
            // Try to find matching sale in dbJune
            const match = dbJune.find(s => Math.abs(s.grandTotal - total) < 0.1 && s.items.reduce((sum, i) => sum + i.quantity, 0) === qty);
            if (match) {
                // console.log(`- Matched: Log ${l._id} (${customer}, Qty: ${qty}, Tot: ${total}) with DB Sale ${match.saleNumber}`);
            } else {
                console.log(`- NOT MATCHED IN DB: Log ${l._id} | Date: ${date} | Customer: ${customer} | Qty: ${qty} | Total: ${total}`);
                console.log(`  Log Details Body: ${JSON.stringify(body)}`);
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
