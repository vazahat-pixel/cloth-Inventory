const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const startJune = new Date('2026-06-01T00:00:00Z');
        const endJune = new Date('2026-06-30T23:59:59Z');

        // DB Sales after June 19
        const dbSales = await Sale.find({
            saleDate: { $gt: new Date('2026-06-19T23:59:59Z'), $lte: endJune },
            storeId: '69ecb1d9f04d7249bd11adf4'
        }).sort({ saleDate: 1 }).lean();

        // Logs after June 19
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true },
            'details.body.storeId': new mongoose.Types.ObjectId('69ecb1d9f04d7249bd11adf4'),
            createdAt: { $gt: new Date('2026-06-19T23:59:59Z') }
        }).sort({ createdAt: 1 }).lean();

        console.log(`DB Sales after June 19: ${dbSales.length}`);
        dbSales.forEach(s => {
            console.log(`- DB Sale - #: ${s.saleNumber}, Total: ${s.grandTotal}, Qty: ${s.items.reduce((sum, i) => sum + i.quantity, 0)}, Date: ${s.saleDate}`);
        });

        console.log(`\nSystemLogs after June 19: ${logs.length}`);
        logs.forEach(l => {
            const body = l.details.body;
            console.log(`- Log - ID: ${l._id}, Total: ${body.grandTotal}, Qty: ${(body.products || []).reduce((sum, p) => sum + p.quantity, 0)}, Date: ${body.date || l.createdAt}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
