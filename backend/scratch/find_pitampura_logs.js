const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("=== SEARCHING SYSTEMLOG FOR MISSING PITAMPURA SALES ===");

        // Search by sale number or body content
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            $or: [
                { 'details.body.saleNumber': 'PTM-0041' },
                { 'details.body.saleNumber': 'PTM-0028' }
            ]
        }).lean();

        console.log(`Found ${logs.length} matching logs in SystemLog.`);
        for (const log of logs) {
            console.log(`\n--- Log ID: ${log._id} ---`);
            console.log(`Date: ${log.createdAt.toISOString()}`);
            console.log(`Action: ${log.action}`);
            console.log(`Body:`, JSON.stringify(log.details?.body, null, 2));
        }

        // If not found by exact saleNumber, let's search for any POST /api/sales logs for Pitampura store around June 9 and June 12
        if (logs.length === 0) {
            console.log("\nSearching logs by store ID and date range...");
            const pitampuraStoreId = '69e86a235df4170210683604';
            const generalLogs = await SystemLog.find({
                action: 'POST /api/sales',
                'details.body.storeId': new mongoose.Types.ObjectId(pitampuraStoreId),
                createdAt: {
                    $gte: new Date('2026-06-08T00:00:00Z'),
                    $lte: new Date('2026-06-13T23:59:59Z')
                }
            }).lean();

            console.log(`Found ${generalLogs.length} logs for Pitampura in that date range.`);
            generalLogs.forEach(l => {
                const b = l.details.body;
                if (!b) return;
                const qty = (b.products || []).reduce((s, p) => s + p.quantity, 0);
                console.log(`- LogID: ${l._id}, Date: ${l.createdAt.toISOString()}, SaleNum: ${b.saleNumber}, Qty: ${qty}, GrandTotal: ${b.grandTotal}, Customer: ${b.customerName}`);
            });
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
