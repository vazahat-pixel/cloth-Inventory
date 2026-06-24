const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';

        // Find logs for GTB store with grandTotal around 1500 or containing amount Paid 1500
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId)
        }).lean();

        console.log(`Total logs found for GTB store: ${logs.length}`);

        console.log(`\n=== Logs with grandTotal or payments containing ~1500 ===`);
        logs.forEach(l => {
            const b = l.details.body;
            if (!b) return;
            const grandTotal = b.grandTotal;
            const payments = b.payments || [];
            const upiAmount = payments.find(p => p.mode === 'UPI')?.amount || 0;
            const cardAmount = payments.find(p => p.mode === 'CARD')?.amount || 0;

            const isGt1500 = Math.abs(grandTotal - 1500) < 50;
            const hasUpi1500 = Math.abs(upiAmount - 1500) < 5;
            
            if (isGt1500 || hasUpi1500) {
                const date = b.date || l.createdAt.toISOString().split('T')[0];
                const qty = (b.products || []).reduce((s,p)=>s+p.quantity,0);
                console.log(`- LogID: ${l._id}, Date: ${date}, SaleNum: ${b.saleNumber}, Qty: ${qty}, GrandTotal: ${grandTotal}, Payments: ${JSON.stringify(b.payments)}, Type: ${b.type}`);
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
