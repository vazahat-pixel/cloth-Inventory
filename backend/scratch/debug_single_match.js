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
        const inv = gtbStore.invoices.find(i => i.saleNumber === 'GTB-0027');

        console.log('Report Invoice:', inv);

        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true },
            'details.body.storeId': '69ecb1d9f04d7249bd11adf4'
        }).lean();

        console.log(`Found ${logs.length} total GTB logs.`);

        logs.forEach(log => {
            const body = log.details.body;
            const logDate = body.date || new Date(log.createdAt).toISOString().split('T')[0];
            const logTotal = Math.round(body.grandTotal * 100) / 100;
            const logQty = (body.products || []).reduce((sum, p) => sum + p.quantity, 0);

            if (Math.abs(logTotal - 4484.4) < 1) {
                console.log(`Potential log match: ID: ${log._id}, Date: ${logDate}, Total: ${logTotal}, Qty: ${logQty}`);
                console.log(`Date match: ${logDate === inv.date}, Total match: ${Math.abs(logTotal - Number(inv.net)) < 0.1}, Qty match: ${logQty === Number(inv.quantity)}`);
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
