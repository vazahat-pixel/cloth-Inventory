const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69e86a235df4170210683604';

        // 1. Search for grandTotal = 1099.6 in Pitampura logs
        console.log("Searching for grandTotal = 1099.6 in Pitampura logs...");
        const logsByTotal = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId),
            'details.body.grandTotal': 1099.6
        }).lean();
        console.log(`Found ${logsByTotal.length} logs by grandTotal.`);
        logsByTotal.forEach(l => {
            console.log(`- LogID: ${l._id}, CreatedAt: ${l.createdAt.toISOString()}, SaleNum: ${l.details.body.saleNumber}, Customer: ${l.details.body.customerName}`);
        });

        // 2. Search for any logs on June 9 (body date or log date)
        console.log("\nSearching for any logs on June 9...");
        const logsByDate = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId)
        }).lean();

        const june9Logs = logsByDate.filter(l => {
            const b = l.details.body;
            if (!b) return false;
            const date = b.date || l.createdAt.toISOString().split('T')[0];
            return date === '2026-06-09';
        });

        console.log(`Found ${june9Logs.length} logs for June 9.`);
        june9Logs.forEach(l => {
            const b = l.details.body;
            console.log(`- LogID: ${l._id}, CreatedAt: ${l.createdAt.toISOString()}, SaleNum: ${b.saleNumber}, Qty: ${(b.products||[]).reduce((s,p)=>s+p.quantity,0)}, Amt: ${b.grandTotal}, Customer: ${b.customerName}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
