const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecbe2cf04d7249bd11ae45';
        console.log("=== COMPARING JUNE REPORT VS DB SALES ===");

        // 1. Get DB sales for June
        const dbSales = await Sale.find({ storeId, isDeleted: false }).lean();

        // 2. Get Report invoices
        const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
        if (!fs.existsSync(reportPath)) {
            console.error("Report not found!");
            return;
        }
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const rStoreId = reportData.salesByStore.find(s => String(s.storeId) === storeId);
        if (!rStoreId) {
            console.error("Store not found in report!");
            return;
        }
        const reportInvs = rStoreId.invoices.filter(inv => inv.date.startsWith('2026-06'));

        console.log(`Report Invoices (up to June 19): ${reportInvs.length}`);
        console.log(`DB Sales in June: ${dbSales.filter(s => s.saleDate >= new Date('2026-06-01T00:00:00Z') && s.saleDate <= new Date('2026-06-30T23:59:59Z')).length}`);

        // Compare each report invoice with DB
        console.log("\n--- Checking Report Invoices in DB ---");
        reportInvs.forEach(inv => {
            const match = dbSales.find(s => s.saleNumber === inv.saleNumber);
            if (match) {
                const dbQty = match.items.reduce((sum, i) => sum + i.quantity, 0);
                const amtDiff = Math.abs(match.grandTotal - Number(inv.net));
                if (dbQty !== Number(inv.quantity) || amtDiff > 0.1) {
                    console.log(`- MISMATCH: ${inv.saleNumber} | Date: ${inv.date} | Report Qty: ${inv.quantity}, DB Qty: ${dbQty} | Report Net: ${inv.net}, DB Total: ${match.grandTotal}`);
                }
            } else {
                console.log(`- MISSING IN DB: ${inv.saleNumber} | Date: ${inv.date} | Customer: ${inv.customer} | Qty: ${inv.quantity} | Net: ${inv.net}`);
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
