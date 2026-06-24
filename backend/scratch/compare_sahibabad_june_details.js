const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeIdStr = '69ecbe2cf04d7249bd11ae45';
        const storeId = new mongoose.Types.ObjectId(storeIdStr);
        console.log("=== SAHIBABAD JUNE LOGS AND DB SALES COMPARISON ===");

        // 1. Get DB sales for June
        const dbSales = await Sale.find({
            storeId,
            saleDate: { $gte: new Date('2026-06-01T00:00:00Z'), $lte: new Date('2026-06-30T23:59:59Z') },
            isDeleted: false
        }).sort({ saleDate: 1 }).lean();

        console.log(`DB Sales Count: ${dbSales.length}`);

        // 2. Get System Logs for June
        const logs = await SystemLog.find({
            $or: [
                { "details.body.storeId": storeIdStr },
                { "details.body.storeId": storeId },
                { "details.storeId": storeIdStr },
                { "details.storeId": storeId }
            ],
            action: 'POST /api/sales'
        }).sort({ createdAt: 1 }).lean();

        const juneLogs = logs.filter(l => {
            const body = l.details?.body || {};
            const date = body.saleDate || body.date || l.createdAt.toISOString();
            return date.startsWith('2026-06') || date.includes('-06-');
        });

        console.log(`System Logs Count: ${juneLogs.length}`);

        // Write both lists to a text file for comparison
        console.log("\n--- DB SALES LIST ---");
        dbSales.forEach(s => {
            const qty = s.items.reduce((sum, i) => sum + i.quantity, 0);
            console.log(`DB_SALE | Num: ${s.saleNumber} | Date: ${s.saleDate.toISOString().slice(0,10)} | Cust: ${s.customerName} | Qty: ${qty} | Total: ${s.grandTotal} | ID: ${s._id}`);
        });

        console.log("\n--- SYSTEM LOGS LIST ---");
        juneLogs.forEach(l => {
            const body = l.details?.body || {};
            const total = body.grandTotal || body.total || 0;
            const customer = body.customerName || 'N/A';
            const qty = (body.items || body.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0);
            const date = body.saleDate || body.date || l.createdAt.toISOString().slice(0,10);
            const saleNum = body.saleNumber || 'N/A';
            console.log(`LOG_SALE | Num: ${saleNum} | Date: ${date.slice(0,10)} | Cust: ${customer} | Qty: ${qty} | Total: ${total} | LogID: ${l._id}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
