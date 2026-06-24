const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Sale = require('../src/models/sale.model');
const Store = require('../src/models/store.model');
const StoreInventory = require('../src/models/storeInventory.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("=== SAHIBABAD STORE AUDIT ===");

        // 1. Get Sahibabad store info
        const store = await Store.findOne({ name: /SAHIBABAD/i }).lean();
        if (!store) {
            console.error("Sahibabad store not found!");
            return;
        }
        const storeId = store._id.toString();
        console.log(`Sahibabad Store ID: ${storeId}`);

        // 2. Query May sales in DB
        const startMay = new Date('2026-05-01T00:00:00Z');
        const endMay = new Date('2026-05-31T23:59:59Z');
        const dbMaySales = await Sale.find({
            storeId,
            saleDate: { $gte: startMay, $lte: endMay },
            isDeleted: false
        }).lean();
        const mayQty = dbMaySales.reduce((sum, s) => sum + s.items.reduce((iq, i) => iq + i.quantity, 0), 0);
        const mayAmt = dbMaySales.reduce((sum, s) => sum + s.grandTotal, 0);
        console.log(`May Sales in DB -> Count: ${dbMaySales.length}, Qty: ${mayQty}, Amount: ${mayAmt.toFixed(2)} INR`);

        // 3. Query June sales in DB
        const startJune = new Date('2026-06-01T00:00:00Z');
        const endJune = new Date('2026-06-30T23:59:59Z');
        const dbJuneSales = await Sale.find({
            storeId,
            saleDate: { $gte: startJune, $lte: endJune },
            isDeleted: false
        }).lean();
        const juneQty = dbJuneSales.reduce((sum, s) => sum + s.items.reduce((iq, i) => iq + i.quantity, 0), 0);
        const juneAmt = dbJuneSales.reduce((sum, s) => sum + s.grandTotal, 0);
        console.log(`June Sales in DB -> Count: ${dbJuneSales.length}, Qty: ${juneQty}, Amount: ${juneAmt.toFixed(2)} INR`);

        // 4. Closing stock in DB
        const inventory = await StoreInventory.find({ storeId }).lean();
        const closingStock = inventory.reduce((sum, i) => sum + i.quantity, 0);
        console.log(`Closing Stock in DB: ${closingStock} pcs`);

        // 5. Compare with report
        const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
        if (!fs.existsSync(reportPath)) {
            console.error(`Report file not found at: ${reportPath}`);
            return;
        }
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const rStore = reportData.salesByStore.find(s => String(s.storeId) === storeId);
        if (!rStore) {
            console.error("Sahibabad store not found in report!");
            return;
        }

        const reportJuneInvs = rStore.invoices.filter(inv => inv.date.startsWith('2026-06'));
        const reportJuneQty = reportJuneInvs.reduce((sum, inv) => sum + Number(inv.quantity), 0);
        const reportJuneAmt = reportJuneInvs.reduce((sum, inv) => sum + Number(inv.net), 0);
        console.log(`\nJune Invoices in Report -> Count: ${reportJuneInvs.length}, Qty: ${reportJuneQty}, Amount: ${reportJuneAmt.toFixed(2)} INR`);

        const reportMayInvs = rStore.invoices.filter(inv => inv.date.startsWith('2026-05'));
        const reportMayQty = reportMayInvs.reduce((sum, inv) => sum + Number(inv.quantity), 0);
        const reportMayAmt = reportMayInvs.reduce((sum, inv) => sum + Number(inv.net), 0);
        console.log(`May Invoices in Report -> Count: ${reportMayInvs.length}, Qty: ${reportMayQty}, Amount: ${reportMayAmt.toFixed(2)} INR`);

        // Check missing June invoices in DB
        const dbJuneSaleNumbers = new Set(dbJuneSales.map(s => s.saleNumber));
        console.log("\n=== Missing June Invoices in DB ===");
        reportJuneInvs.forEach(inv => {
            if (!dbJuneSaleNumbers.has(inv.saleNumber)) {
                console.log(`- Missing June Invoice: ${inv.saleNumber}, Date: ${inv.date}, Customer: ${inv.customer}, Qty: ${inv.quantity}, Net: ${inv.net}, Payment: ${inv.paymentMode}`);
            }
        });

        // Check missing May invoices in DB
        const dbMaySaleNumbers = new Set(dbMaySales.map(s => s.saleNumber));
        console.log("\n=== Missing May Invoices in DB ===");
        reportMayInvs.forEach(inv => {
            if (!dbMaySaleNumbers.has(inv.saleNumber)) {
                console.log(`- Missing May Invoice: ${inv.saleNumber}, Date: ${inv.date}, Customer: ${inv.customer}, Qty: ${inv.quantity}, Net: ${inv.net}, Payment: ${inv.paymentMode}`);
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
