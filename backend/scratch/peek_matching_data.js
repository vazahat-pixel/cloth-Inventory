const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const SystemLog = require('../src/models/systemLog.model');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const log = await SystemLog.findOne({ action: 'POST /api/sales', 'details.body': { $exists: true } }).sort({ createdAt: -1 }).lean();
        if (log) {
            console.log("Log Details Body Sample:");
            console.log("- Date:", log.details.body.date);
            console.log("- StoreId:", log.details.body.storeId);
            console.log("- GrandTotal:", log.details.body.grandTotal);
            console.log("- Quantity:", log.details.body.products?.reduce((s, p) => s + p.quantity, 0));

            const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
            const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            const store = reportData.salesByStore.find(s => s.storeId === log.details.body.storeId);
            if (store) {
                console.log(`\nReport Invoices for Store ${store.storeName}:`);
                console.log(store.invoices.slice(0, 5));
            } else {
                console.log(`\nNo matching store in report for ID ${log.details.body.storeId}`);
            }
        } else {
            console.log("No sales log found.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
