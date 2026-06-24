const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69e86a235df4170210683604'; // Pitampura

        // 1. Find PTM-0055 in DB
        const sale = await Sale.findOne({ saleNumber: 'PTM-0055' }).lean();
        if (sale) {
            console.log(`PTM-0055 in DB:`, {
                _id: sale._id,
                saleNumber: sale.saleNumber,
                grandTotal: sale.grandTotal,
                saleDate: sale.saleDate,
                customerName: sale.customerName,
                qty: sale.items.reduce((sum,i)=>sum+i.quantity,0)
            });
        } else {
            console.log("PTM-0055 NOT found in DB");
        }

        // 2. Find PTM-0055 in SystemLogs
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.saleNumber': 'PTM-0055'
        }).lean();
        console.log(`PTM-0055 logs count: ${logs.length}`);
        logs.forEach(l => {
            console.log(`- LogID: ${l._id}, Date: ${l.createdAt}, Customer: ${l.details.body.customerName}, Qty: ${(l.details.body.products||[]).length}, Amt: ${l.details.body.grandTotal}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
