const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true }
        }).lean();

        console.log(`Total sales logs: ${logs.length}`);
        
        const gtbLogs = logs.filter(l => String(l.details.body.storeId) === '69ecb1d9f04d7249bd11adf4');
        console.log(`GTB logs: ${gtbLogs.length}`);

        const mayGtbLogs = gtbLogs.filter(l => {
            const dateStr = l.details.body.date || '';
            return dateStr.startsWith('2026-05') || (l.createdAt && new Date(l.createdAt).toISOString().startsWith('2026-05'));
        });
        console.log(`May GTB logs: ${mayGtbLogs.length}`);

        mayGtbLogs.forEach(l => {
            console.log(`Log ID: ${l._id}, body.date: ${l.details.body.date}, createdAt: ${l.createdAt}, grandTotal: ${l.details.body.grandTotal}, body.saleNumber: ${l.details.body.saleNumber}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
