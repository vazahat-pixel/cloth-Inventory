const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const sales = await Sale.find({
            storeId: '69ecb1d9f04d7249bd11adf4',
            saleNumber: { $in: ['GTB-0126', 'GTB-0136', 'GTB-0137', 'GTB-0138', 'GTB-0139', 'GTB-0140', 'GTB-0141', 'GTB-0142', 'GTB-0143'] }
        }).sort({ saleNumber: 1 }).lean();

        console.log(`Found ${sales.length} sales:`);
        sales.forEach(s => {
            console.log(`\n--- ${s.saleNumber} ---`);
            console.log(`ID: ${s._id}`);
            console.log(`Date: ${s.saleDate}`);
            console.log(`Customer: ${s.customerName} (${s.customerMobile})`);
            console.log(`GrandTotal: ${s.grandTotal}`);
            console.log(`Qty: ${s.items.reduce((sum, i) => sum + i.quantity, 0)}`);
            console.log(`Items:`, s.items.map(i => `${i.barcode} (${i.quantity} pcs, mrp ${i.mrp}, total ${i.total})`));
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
