const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

        const gtbStore = reportData.salesByStore.find(s => String(s.storeId) === '69ecb1d9f04d7249bd11adf4');
        const reportMaySales = gtbStore.invoices.filter(inv => inv.date.startsWith('2026-05'));

        const startMay = new Date('2026-05-01T00:00:00Z');
        const endMay = new Date('2026-05-31T23:59:59Z');
        const dbMaySales = await Sale.find({
            saleDate: { $gte: startMay, $lte: endMay },
            storeId: '69ecb1d9f04d7249bd11adf4'
        }).lean();

        console.log(`Report May Invoices count: ${reportMaySales.length}`);
        console.log(`DB May Sales count: ${dbMaySales.length}`);

        // Compare by saleNumber
        const reportInvoicesMap = new Map();
        reportMaySales.forEach(inv => {
            reportInvoicesMap.set(inv.saleNumber, inv);
        });

        const dbSalesMap = new Map();
        dbMaySales.forEach(s => {
            dbSalesMap.set(s.saleNumber, s);
        });

        console.log("\n1. Invoices present in Report but NOT in DB:");
        reportMaySales.forEach(inv => {
            if (!dbSalesMap.has(inv.saleNumber)) {
                console.log(`- ${inv.saleNumber}: Net: ${inv.net}, Qty: ${inv.quantity}, Date: ${inv.date}`);
            }
        });

        console.log("\n2. Sales present in DB but NOT in Report:");
        dbMaySales.forEach(s => {
            if (!reportInvoicesMap.has(s.saleNumber)) {
                console.log(`- ${s.saleNumber}: Total: ${s.grandTotal}, Qty: ${s.items.reduce((sum, i) => sum + i.quantity, 0)}, Date: ${s.saleDate}`);
            }
        });

        console.log("\n3. Invoices present in both but with different totals/quantities:");
        reportMaySales.forEach(inv => {
            const dbSale = dbSalesMap.get(inv.saleNumber);
            if (dbSale) {
                const dbTotal = dbSale.grandTotal;
                const dbQty = dbSale.items.reduce((sum, i) => sum + i.quantity, 0);
                const invTotal = Number(inv.net);
                const invQty = Number(inv.quantity);

                if (Math.abs(dbTotal - invTotal) > 0.1 || dbQty !== invQty) {
                    console.log(`- ${inv.saleNumber}:`);
                    console.log(`  Report -> Net: ${invTotal}, Qty: ${invQty}`);
                    console.log(`  DB     -> Total: ${dbTotal}, Qty: ${dbQty}`);
                }
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
