const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId)
        }).lean();

        const juneLogs = logs.filter(l => {
            const body = l.details.body;
            if (!body) return false;
            const date = body.date || l.createdAt.toISOString().split('T')[0];
            return date.startsWith('2026-06');
        });

        console.log(`June logs: ${juneLogs.length}`);

        // Group by date, grandTotal, and quantity
        const groups = {};
        juneLogs.forEach(l => {
            const body = l.details.body;
            const date = body.date || l.createdAt.toISOString().split('T')[0];
            const qty = (body.products || []).reduce((sum, p) => sum + p.quantity, 0);
            const amt = body.grandTotal;
            const key = `${date}_${qty}_${amt.toFixed(2)}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(l);
        });

        console.log(`\n=== Duplicate Logs (same date, qty, and amount) ===`);
        Object.entries(groups).forEach(([key, list]) => {
            if (list.length > 1) {
                console.log(`Key: ${key} (${list.length} logs):`);
                list.forEach(l => {
                    console.log(`  - LogID: ${l._id}, CreatedAt: ${l.createdAt.toISOString()}, SaleNum: ${l.details.body.saleNumber}, Customer: ${l.details.body.customerName}`);
                });
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
