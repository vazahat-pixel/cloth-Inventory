const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';

        // 1. Get all DB sales for June for GTB Nagar
        const dbSales = await Sale.find({
            storeId: storeId,
            saleDate: {
                $gte: new Date('2026-06-01T00:00:00Z'),
                $lte: new Date('2026-06-30T23:59:59Z')
            }
        }).lean();

        console.log(`Total DB sales for GTB in June: ${dbSales.length}`);
        const dbSaleNumbers = new Set(dbSales.map(s => s.saleNumber));

        // 2. Fetch all system logs for POST /api/sales for GTB Nagar created in June
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId),
            createdAt: {
                $gte: new Date('2026-06-01T00:00:00Z'),
                $lte: new Date('2026-06-30T23:59:59Z')
            }
        }).sort({ createdAt: 1 }).lean();

        console.log(`Total System logs for GTB in June: ${logs.length}`);

        // Find logs whose saleNumber is NOT in dbSaleNumbers or which were not processed
        // Wait, some logs might have failed or succeeded but have different saleNumber or no saleNumber in DB
        const missingLogs = [];
        logs.forEach(l => {
            const body = l.details.body;
            if (!body) return;
            const saleNumber = body.saleNumber;
            // Let's see if there is a match in dbSales
            const hasSaleInDb = dbSales.some(s => s.saleNumber === saleNumber);
            if (!hasSaleInDb) {
                missingLogs.push(l);
            }
        });

        console.log(`\nFound ${missingLogs.length} missing logs (not in DB by saleNumber):`);
        let totalMissingQty = 0;
        let totalMissingAmt = 0;
        missingLogs.forEach(l => {
            const body = l.details.body;
            const qty = (body.products || []).reduce((sum, p) => sum + p.quantity, 0);
            const amt = body.grandTotal;
            const date = body.date || new Date(l.createdAt).toISOString().split('T')[0];
            console.log(`- Log ID: ${l._id}, Sale#: ${body.saleNumber}, Date: ${date}, Qty: ${qty}, Amt: ${amt}, CreatedAt: ${l.createdAt}`);
            totalMissingQty += qty;
            totalMissingAmt += amt;
        });

        console.log(`\nTotal Missing Logs sum: Qty = ${totalMissingQty}, Amt = ${totalMissingAmt}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
