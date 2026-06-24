const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';

        // Fetch logs with any dispatch or receive action after June 19
        const logs = await SystemLog.find({
            action: { $regex: /dispatch|receive|grn/i },
            createdAt: { $gt: new Date('2026-06-19T00:00:00Z') }
        }).sort({ createdAt: 1 }).lean();

        console.log(`Found ${logs.length} dispatch/receive logs after June 19:`);
        logs.forEach(l => {
            const body = l.details.body || {};
            // check if destination matches GTB store or storeId matches GTB
            const isGtb = String(body.destinationStoreId) === storeId || 
                          String(body.storeId) === storeId || 
                          JSON.stringify(l).includes(storeId);
            if (isGtb) {
                console.log(`\n- Log ID: ${l._id} | Action: ${l.action} | Created: ${l.createdAt}`);
                console.log(`  Body Keys:`, Object.keys(body));
                if (body.dispatchNumber) console.log(`  Dispatch Number:`, body.dispatchNumber);
                if (body.status) console.log(`  Status:`, body.status);
                // Print items quantity
                const items = body.items || [];
                const qty = items.reduce((sum, i) => sum + (i.qty || i.quantity || 0), 0);
                console.log(`  Items Qty:`, qty);
                if (items.length > 0) {
                    console.log(`  First item SKU:`, items[0].barcode || items[0].sku);
                }
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
