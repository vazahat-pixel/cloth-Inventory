const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const Store = require('../src/models/store.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        // 1. Get Pitampura store info
        const pitampuraStore = await Store.findOne({ name: /PITAMPURA/i }).lean();
        if (!pitampuraStore) {
            console.error("Pitampura store not found!");
            return;
        }
        const storeId = pitampuraStore._id.toString();
        console.log(`Pitampura Store ID: ${storeId}`);

        // 2. Fetch Pitampura sales in DB
        const dbSales = await Sale.find({ storeId, isDeleted: false }).lean();
        console.log(`Pitampura Sales in DB: Count: ${dbSales.length}, Qty: ${dbSales.reduce((sum, s) => sum + s.items.reduce((iq, i) => iq + i.quantity, 0), 0)}, Amt: ${dbSales.reduce((sum, s) => sum + s.grandTotal, 0).toFixed(2)}`);

        // 3. Read June 19 report
        const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
        if (!fs.existsSync(reportPath)) {
            console.error(`Report not found at: ${reportPath}`);
            return;
        }
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const reportStore = reportData.salesByStore.find(s => String(s.storeId) === storeId);
        if (!reportStore) {
            console.error("Pitampura store not found in report!");
            return;
        }

        console.log(`Pitampura Invoices in Report: Count: ${reportStore.invoices.length}, Qty: ${reportStore.invoices.reduce((sum, inv) => sum + Number(inv.quantity), 0)}, Amt: ${reportStore.invoices.reduce((sum, inv) => sum + Number(inv.net), 0).toFixed(2)}`);

        // 4. Compare invoice numbers
        const dbSaleNumbers = new Set(dbSales.map(s => s.saleNumber));
        const reportInvoices = reportStore.invoices;

        console.log("\n=== Checking for invoices in Report that are missing in DB ===");
        let missingInDbCount = 0;
        let missingInDbQty = 0;
        let missingInDbAmt = 0;

        reportInvoices.forEach(inv => {
            if (!dbSaleNumbers.has(inv.saleNumber)) {
                console.log(`Missing in DB -> Sale #: ${inv.saleNumber}, Date: ${inv.date}, Customer: ${inv.customer}, Qty: ${inv.quantity}, Net: ${inv.net}, Payment: ${inv.paymentMode}`);
                missingInDbCount++;
                missingInDbQty += Number(inv.quantity);
                missingInDbAmt += Number(inv.net);
            }
        });
        console.log(`Summary of missing in DB: Count: ${missingInDbCount}, Qty: ${missingInDbQty}, Amt: ${missingInDbAmt.toFixed(2)}`);

        // 5. Check if there are any sales in DB that are NOT in the report
        const reportSaleNumbers = new Set(reportInvoices.map(i => i.saleNumber));
        console.log("\n=== Checking for sales in DB that are NOT in the Report ===");
        let extraInDbCount = 0;
        dbSales.forEach(s => {
            if (!reportSaleNumbers.has(s.saleNumber)) {
                console.log(`Extra in DB -> Sale #: ${s.saleNumber}, Date: ${s.saleDate}, Customer: ${s.customerName}, Qty: ${s.items.reduce((sum,i)=>sum+i.quantity,0)}, GrandTotal: ${s.grandTotal}`);
                extraInDbCount++;
            }
        });
        console.log(`Summary of extra in DB: Count: ${extraInDbCount}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
