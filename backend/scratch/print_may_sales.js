const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const startMay = new Date('2026-05-01T00:00:00Z');
        const endMay = new Date('2026-05-31T23:59:59Z');

        const dbSales = await Sale.find({
            saleDate: { $gte: startMay, $lte: endMay },
            storeId: '69ecb1d9f04d7249bd11adf4'
        }).sort({ saleDate: 1 }).lean();

        console.log(`GTB store May sales count: ${dbSales.length}`);
        dbSales.forEach(s => {
            console.log(`Sale #: ${s.saleNumber}, Total: ${s.grandTotal}, Qty: ${s.items.reduce((sum, i) => sum + i.quantity, 0)}, Date: ${s.saleDate}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
