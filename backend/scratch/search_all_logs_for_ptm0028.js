const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69e86a235df4170210683604'; // Pitampura
        
        // Let's search for ANY POST /api/sales log for Pitampura where grandTotal is between 1099 and 1100
        console.log("Searching for POST /api/sales logs with grandTotal between 1099 and 1100...");
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId),
            'details.body.grandTotal': { $gte: 1099, $lte: 1101 }
        }).lean();

        console.log(`Found ${logs.length} matching logs.`);
        for (const log of logs) {
            console.log(`\n--- Log ID: ${log._id} ---`);
            console.log(`Date: ${log.createdAt.toISOString()}`);
            console.log(`Body:`, JSON.stringify(log.details?.body, null, 2));
        }

        // Let's also check if there is a log with a date around June 9 (log date or body date) where qty is 2
        console.log("\nSearching for logs with Qty = 2 around June 9...");
        const allLogs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId)
        }).lean();

        const matchedLogs = allLogs.filter(l => {
            const b = l.details.body;
            if (!b) return false;
            const date = b.date || l.createdAt.toISOString().split('T')[0];
            const isJune9 = date.startsWith('2026-06-09') || date.startsWith('2026-06-12') || date.startsWith('2026-06-16');
            const qty = (b.products || []).reduce((s, p) => s + p.quantity, 0);
            return isJune9 && qty === 2;
        });

        console.log(`Found ${matchedLogs.length} logs with Qty = 2 around June 9-16.`);
        matchedLogs.forEach(l => {
            const b = l.details.body;
            console.log(`- LogID: ${l._id}, CreatedAt: ${l.createdAt.toISOString()}, SaleNum: ${b.saleNumber}, Qty: 2, Amt: ${b.grandTotal}, Customer: ${b.customerName}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
