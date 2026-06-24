const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("=== SEARCHING FOR SAH-0026 ===");
        
        // 1. Search in Sales collection globally
        const globalSale = await Sale.findOne({ saleNumber: /SAH-0026/i }).lean();
        if (globalSale) {
            console.log("Found SAH-0026 in Sales collection globally!", globalSale);
        } else {
            console.log("Not found in Sales collection globally.");
        }

        // 2. Search in SystemLog globally for SAH-0026
        const logs = await SystemLog.find({
            $or: [
                { "details.body.saleNumber": /SAH-0026/i },
                { "details.body.invoiceNo": /SAH-0026/i },
                { "details.saleNumber": /SAH-0026/i },
                { "details.invoiceNo": /SAH-0026/i },
                { "details.body.products.barcode": /SAH-0026/i },
                { "action": /SAH-0026/i }
            ]
        }).lean();
        console.log(`Found ${logs.length} logs referencing SAH-0026.`);
        logs.forEach(l => {
            console.log(`Log ID: ${l._id}, Action: ${l.action}, Body: ${JSON.stringify(l.details?.body)}`);
        });

        // 3. Search in SystemLog for any logs around May 31 with total ~1599.10
        const startMay30 = new Date('2026-05-30T00:00:00Z');
        const endJune2 = new Date('2026-06-02T23:59:59Z');
        const totalLogs = await SystemLog.find({
            createdAt: { $gte: startMay30, $lte: endJune2 },
            action: 'POST /api/sales',
            $or: [
                { 'details.body.grandTotal': { $gte: 1598, $lte: 1600 } },
                { 'details.body.total': { $gte: 1598, $lte: 1600 } }
            ]
        }).lean();
        console.log(`Found ${totalLogs.length} sales logs with total ~1599.10 around May 31/June 1:`);
        totalLogs.forEach(l => {
            console.log(`Log ID: ${l._id}, Store: ${l.details?.body?.storeId}, Customer: ${l.details?.body?.customerName}, Total: ${l.details?.body?.grandTotal}, Date: ${l.details?.body?.date}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
