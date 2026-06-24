const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const startMay = new Date('2026-05-01T00:00:00Z');
        const endMay = new Date('2026-05-31T23:59:59Z');

        // May sales in DB
        const dbSales = await Sale.find({
            saleDate: { $gte: startMay, $lte: endMay },
            storeId: '69ecb1d9f04d7249bd11adf4' // GTB store
        }).lean();

        // May logs in SystemLog
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true },
            'details.body.storeId': '69ecb1d9f04d7249bd11adf4'
        }).lean();

        // Filter in memory for May
        const mayLogs = logs.filter(l => {
            const dateStr = l.details.body.date || '';
            return dateStr.startsWith('2026-05');
        });

        console.log(`GTB store May sales in DB: ${dbSales.length}`);
        console.log(`GTB store May logs in SystemLog: ${mayLogs.length}`);

        const dbTotalAmount = dbSales.reduce((sum, s) => sum + s.grandTotal, 0);
        const dbTotalQty = dbSales.reduce((sum, s) => sum + s.items.reduce((iq, i) => iq + i.quantity, 0), 0);

        const logTotalAmount = mayLogs.reduce((sum, l) => sum + l.details.body.grandTotal, 0);
        const logTotalQty = mayLogs.reduce((sum, l) => sum + (l.details.body.products || []).reduce((iq, p) => iq + p.quantity, 0), 0);

        console.log(`DB May Totals - Amount: ${dbTotalAmount.toFixed(2)}, Qty: ${dbTotalQty}`);
        console.log(`Log May Totals - Amount: ${logTotalAmount.toFixed(2)}, Qty: ${logTotalQty}`);

        // Let's find which logs are missing from the DB
        const dbSaleNumbers = new Set(dbSales.map(s => s.saleNumber));
        console.log(`Checking which May logs are missing in DB...`);
        const missingLogs = [];
        mayLogs.forEach(log => {
            const body = log.details.body;
            // Since saleNumber might have changed in DB, let's match by customer & amount & close date
            const exists = dbSales.some(s => {
                const sTotal = Math.round(s.grandTotal * 100) / 100;
                const lTotal = Math.round(body.grandTotal * 100) / 100;
                const totalMatch = Math.abs(sTotal - lTotal) < 0.1;
                const sMobile = s.customerMobile || '';
                const lMobile = body.customerMobile || '';
                const mobileMatch = sMobile.trim() === lMobile.trim();
                const sDateStr = new Date(s.saleDate).toISOString().split('T')[0];
                const lDateStr = new Date(body.date || log.createdAt).toISOString().split('T')[0];
                const dateMatch = sDateStr === lDateStr;
                return totalMatch && mobileMatch && dateMatch;
            });
            if (!exists) {
                missingLogs.push(log);
            }
        });

        console.log(`Missing logs count: ${missingLogs.length}`);
        missingLogs.forEach(l => {
            console.log(`Log ID: ${l._id}, Original Sale #: ${l.details.body.saleNumber}, Total: ${l.details.body.grandTotal}, Date: ${l.details.body.date || l.createdAt}, Customer: ${l.details.body.customerName}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
