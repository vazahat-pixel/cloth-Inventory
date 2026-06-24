const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("=== INSPECTING SAHIBABAD SYSTEM LOGS ===");
        const storeIdStr = '69ecbe2cf04d7249bd11ae45';
        const storeId = new mongoose.Types.ObjectId(storeIdStr);

        // Find all logs where body contains storeId or action is POST /api/sales and details contain storeId
        const logs = await SystemLog.find({
            $or: [
                { "details.body.storeId": storeIdStr },
                { "details.body.storeId": storeId },
                { "details.storeId": storeIdStr },
                { "details.storeId": storeId }
            ]
        }).sort({ createdAt: 1 }).lean();

        console.log(`Found ${logs.length} system logs for Sahibabad.`);

        // Group or inspect logs
        const salesLogs = logs.filter(l => l.action && (l.action.includes('sale') || l.action.includes('Sale') || l.action.includes('POST /api/sales')));
        console.log(`Of those, ${salesLogs.length} are sale-related logs.`);

        salesLogs.forEach(l => {
            const body = l.details?.body || {};
            const date = body.saleDate || body.date || l.createdAt;
            const saleNumber = body.saleNumber || body.invoiceNo || 'N/A';
            const customer = body.customerName || body.customer?.name || body.customer || 'N/A';
            const total = body.grandTotal || body.total || 0;
            const qty = (body.items || body.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0);
            console.log(`- Log ID: ${l._id} | Time: ${l.createdAt.toISOString()} | Action: ${l.action} | SaleNum: ${saleNumber} | Date: ${date} | Customer: ${customer} | Qty: ${qty} | Total: ${total}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
