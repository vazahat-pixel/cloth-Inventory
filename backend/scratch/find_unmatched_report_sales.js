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

        const gtbStore = reportData.salesByStore.find(s => String(s.storeId) === '69ecb1d9f04d7249bd11adf4');
        const mayInvoices = gtbStore.invoices.filter(inv => inv.date.startsWith('2026-05'));

        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true },
            'details.body.storeId': new mongoose.Types.ObjectId('69ecb1d9f04d7249bd11adf4')
        }).lean();

        console.log(`Checking ${mayInvoices.length} May report invoices against GTB logs...`);

        const unmatched = [];
        mayInvoices.forEach(inv => {
            const invTotal = Math.round(Number(inv.net) * 100) / 100;
            const invQty = Number(inv.quantity);
            const invDate = inv.date;

            const match = logs.find(log => {
                const body = log.details.body;
                const logDate = body.date || new Date(log.createdAt).toISOString().split('T')[0];
                const logTotal = Math.round(body.grandTotal * 100) / 100;
                const logQty = (body.products || []).reduce((sum, p) => sum + p.quantity, 0);

                return logDate === invDate && Math.abs(logTotal - invTotal) < 0.1 && logQty === invQty;
            });

            if (!match) {
                unmatched.push(inv);
            }
        });

        console.log(`Unmatched invoices count: ${unmatched.length}`);
        unmatched.forEach(inv => {
            console.log(`Unmatched Report Invoice - Sale #: ${inv.saleNumber}, Total: ${inv.net}, Qty: ${inv.quantity}, Date: ${inv.date}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
