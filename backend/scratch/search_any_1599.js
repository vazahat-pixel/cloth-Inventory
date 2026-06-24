const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("=== SEARCHING SYSTEM LOGS FOR ~1599.10 SALES GLOBALLY ===");

        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            $or: [
                { 'details.body.grandTotal': { $gte: 1590, $lte: 1610 } },
                { 'details.body.total': { $gte: 1590, $lte: 1610 } }
            ]
        }).sort({ createdAt: 1 }).lean();

        console.log(`Found ${logs.length} logs:`);
        logs.forEach(l => {
            const body = l.details?.body || {};
            console.log(`Log ID: ${l._id} | Time: ${l.createdAt.toISOString()} | Store: ${body.storeId} | Date: ${body.date || body.saleDate} | Customer: ${body.customerName} | Qty: ${(body.products || body.items || []).length} | Total: ${body.grandTotal}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
