const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';

        // Get DB sales from June 17 to June 22
        const dbSales = await Sale.find({
            storeId,
            saleDate: {
                $gte: new Date('2026-06-17T00:00:00Z'),
                $lte: new Date('2026-06-22T23:59:59Z')
            }
        }).sort({ saleDate: 1, saleNumber: 1 }).lean();

        console.log(`=== DB Sales (June 17 to 22) - Total: ${dbSales.length} ===`);
        dbSales.forEach(s => {
            console.log(`- ${s.saleNumber}: ${s.saleDate.toISOString().split('T')[0]}, Customer: ${s.customerName}, Qty: ${s.items.reduce((sum, i) => sum + i.quantity, 0)}, GrandTotal: ${s.grandTotal}, ID: ${s._id}`);
        });

        // Get POST /api/sales logs from June 17 to June 22
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId),
            createdAt: {
                $gte: new Date('2026-06-17T00:00:00Z'),
                $lte: new Date('2026-06-22T23:59:59Z')
            }
        }).sort({ createdAt: 1 }).lean();

        console.log(`\n=== POST /api/sales logs (June 17 to 22) - Total: ${logs.length} ===`);
        logs.forEach(l => {
            const b = l.details.body;
            const date = b.date || l.createdAt.toISOString().split('T')[0];
            const qty = (b.products || []).reduce((sum, p) => sum + p.quantity, 0);
            console.log(`- Log ID: ${l._id}, LogDate: ${l.createdAt.toISOString().split('T')[0]}, BodyDate: ${date}, SaleNum: ${b.saleNumber || 'N/A'}, Customer: ${b.customerName}, Qty: ${qty}, GrandTotal: ${b.grandTotal}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
