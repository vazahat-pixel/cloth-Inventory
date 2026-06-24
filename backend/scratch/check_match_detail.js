const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const sale = await Sale.findOne({ saleNumber: 'GTB-0042' }).lean();
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true },
            'details.body.storeId': new mongoose.Types.ObjectId('69ecb1d9f04d7249bd11adf4')
        }).lean();

        console.log("DB Sale GTB-0042:", {
            _id: sale._id,
            saleNumber: sale.saleNumber,
            grandTotal: sale.grandTotal,
            saleDate: sale.saleDate,
            createdAt: sale.createdAt
        });

        // Find the log that matches GTB-0042
        const matchedLogs = logs.filter(log => {
            const body = log.details.body;
            const logTotal = Math.round(body.grandTotal * 100) / 100;
            const saleTotal = Math.round(sale.grandTotal * 100) / 100;
            return Math.abs(logTotal - saleTotal) < 0.1;
        });

        console.log(`Matched logs for total ${sale.grandTotal}: ${matchedLogs.length}`);
        matchedLogs.forEach(l => {
            console.log(`Log ID: ${l._id}, Date: ${l.details.body.date}, createdAt: ${l.createdAt}, body.saleNumber: ${l.details.body.saleNumber}, customer: ${l.details.body.customerName}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
