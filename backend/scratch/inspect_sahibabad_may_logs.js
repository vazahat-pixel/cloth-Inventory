const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeIdStr = '69ecbe2cf04d7249bd11ae45';
        const storeId = new mongoose.Types.ObjectId(storeIdStr);
        console.log("=== SAHIBABAD MAY LOGS DETAIL ===");

        const logs = await SystemLog.find({
            $or: [
                { "details.body.storeId": storeIdStr },
                { "details.body.storeId": storeId },
                { "details.storeId": storeIdStr },
                { "details.storeId": storeId }
            ],
            action: 'POST /api/sales'
        }).sort({ createdAt: 1 }).lean();

        const mayLogs = logs.filter(l => {
            const date = l.details?.body?.saleDate || l.details?.body?.date || l.createdAt.toISOString();
            return date.startsWith('2026-05');
        });

        console.log(`Found ${mayLogs.length} May logs:`);
        mayLogs.forEach(l => {
            const body = l.details?.body || {};
            const total = body.grandTotal || body.total || 0;
            const customer = body.customerName || 'N/A';
            const qty = (body.items || body.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0);
            const saleNum = body.saleNumber || 'N/A';
            console.log(`- Log: ${l._id} | SaleNum: ${saleNum} | Customer: ${customer} | Qty: ${qty} | Total: ${total} | Time: ${l.createdAt.toISOString()}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
