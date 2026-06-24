const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        // Search logs for GTB-0042 (total: 999.6, Date: 2026-05-24)
        // Search logs for GTB-0036 (total: 599, Date: 2026-05-22)
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId('69ecb1d9f04d7249bd11adf4')
        }).lean();

        console.log(`GTB logs count: ${logs.length}`);

        console.log("\nSearching logs for total close to 999.6:");
        logs.forEach(l => {
            const body = l.details.body;
            const total = body.grandTotal;
            const date = body.date || new Date(l.createdAt).toISOString().split('T')[0];
            if (Math.abs(total - 999.6) < 1) {
                console.log(`Log ID: ${l._id}, Date: ${date}, Total: ${total}, Qty: ${(body.products || []).reduce((sum, p) => sum + p.quantity, 0)}, body.saleNumber: ${body.saleNumber}`);
            }
        });

        console.log("\nSearching logs for total close to 599:");
        logs.forEach(l => {
            const body = l.details.body;
            const total = body.grandTotal;
            const date = body.date || new Date(l.createdAt).toISOString().split('T')[0];
            if (Math.abs(total - 599) < 1) {
                console.log(`Log ID: ${l._id}, Date: ${date}, Total: ${total}, Qty: ${(body.products || []).reduce((sum, p) => sum + p.quantity, 0)}, body.saleNumber: ${body.saleNumber}`);
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
