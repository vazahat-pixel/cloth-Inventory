const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69e86a235df4170210683604';
        const startJune9 = new Date('2026-06-09T00:00:00Z');
        const endJune9 = new Date('2026-06-09T23:59:59Z');

        const sales = await Sale.find({
            storeId,
            saleDate: { $gte: startJune9, $lte: endJune9 },
            isDeleted: false
        }).lean();

        console.log(`Found ${sales.length} sales in DB on June 9:`);
        sales.forEach(s => {
            console.log(`- ${s.saleNumber}: Qty ${s.items.reduce((sum,i)=>sum+i.quantity,0)}, Amt ${s.grandTotal}, Customer: ${s.customerName}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
