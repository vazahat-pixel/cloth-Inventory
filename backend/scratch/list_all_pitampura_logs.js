const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69e86a235df4170210683604';

        // Get all POST /api/sales logs for Pitampura in the entire DB
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId)
        }).lean();

        console.log(`Found ${logs.length} total sales logs for Pitampura.`);

        console.log(`\n=== Listing all Pitampura sales logs ===`);
        logs.forEach(l => {
            const b = l.details.body;
            if (!b) return;
            const date = b.date || l.createdAt.toISOString().split('T')[0];
            const qty = (b.products || []).reduce((sum, p) => sum + p.quantity, 0);
            console.log(`- LogID: ${l._id}, CreatedAt: ${l.createdAt.toISOString()}, BodyDate: ${date}, SaleNum: ${b.saleNumber || 'N/A'}, Qty: ${qty}, Amt: ${b.grandTotal}, Customer: ${b.customerName}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
