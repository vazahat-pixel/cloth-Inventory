const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId)
        }).lean();

        console.log(`Total GTB logs: ${logs.length}`);

        console.log(`\n=== Exchange Sales in Logs ===`);
        logs.forEach(l => {
            const b = l.details.body;
            if (!b) return;
            if (b.type === 'EXCHANGE' || b.exchangeDetails || (b.exchangeItems && b.exchangeItems.length > 0)) {
                const date = b.date || l.createdAt.toISOString().split('T')[0];
                const qty = (b.products || []).reduce((s,p)=>s+p.quantity,0);
                const retQty = b.exchangeDetails?.items?.reduce((s,p)=>s+p.quantity,0) || 0;
                console.log(`- LogID: ${l._id}, Date: ${date}, SaleNum: ${b.saleNumber}, Type: ${b.type}, GrandTotal: ${b.grandTotal}, ProductsQty: ${qty}, ReturnQty: ${retQty}, Customer: ${b.customerName}`);
                if (b.exchangeDetails) {
                    console.log(`  exchangeDetails:`, JSON.stringify(b.exchangeDetails));
                }
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
