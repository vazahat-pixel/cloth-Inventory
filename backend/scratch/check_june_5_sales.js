const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';

        // DB sales on June 5
        const dbSales = await Sale.find({
            storeId,
            saleDate: {
                $gte: new Date('2026-06-05T00:00:00Z'),
                $lte: new Date('2026-06-05T23:59:59Z')
            }
        }).lean();

        console.log(`=== DB Sales on June 5 (${dbSales.length}) ===`);
        dbSales.forEach(s => {
            console.log(`- ${s.saleNumber}: Qty ${s.items.reduce((sum,i)=>sum+i.quantity,0)}, Amt ${s.grandTotal}, Customer: ${s.customerName}`);
        });

        // Logs on June 5
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId),
            createdAt: {
                $gte: new Date('2026-06-05T00:00:00Z'),
                $lte: new Date('2026-06-05T23:59:59Z')
            }
        }).lean();

        console.log(`\n=== Logs on June 5 (${logs.length}) ===`);
        logs.forEach(l => {
            const b = l.details.body;
            const qty = (b.products || []).reduce((sum, p) => sum + p.quantity, 0);
            console.log(`- LogID: ${l._id}, Qty ${qty}, Amt ${b.grandTotal}, Customer: ${b.customerName}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
