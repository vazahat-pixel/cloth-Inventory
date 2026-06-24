const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            createdAt: {
                $gte: new Date('2026-06-01T00:00:00Z'),
                $lte: new Date('2026-06-30T23:59:59Z')
            }
        }).lean();

        console.log(`Total sales logs in June: ${logs.length}`);

        const matchedLogs = [];
        logs.forEach(l => {
            const body = l.details.body;
            if (!body) return;
            const saleNumber = String(body.saleNumber || '');
            if (saleNumber.startsWith('GTB-')) {
                matchedLogs.push(l);
            }
        });

        console.log(`Logs in June with saleNumber starting with GTB-: ${matchedLogs.length}`);
        matchedLogs.forEach(l => {
            const body = l.details.body;
            const qty = (body.products || []).reduce((sum, p) => sum + p.quantity, 0);
            const amt = body.grandTotal;
            const date = body.date || new Date(l.createdAt).toISOString().split('T')[0];
            console.log(`Log ID: ${l._id}, Sale#: ${body.saleNumber}, Date: ${date}, Qty: ${qty}, Amt: ${amt.toFixed(2)}, StoreId: ${body.storeId}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
