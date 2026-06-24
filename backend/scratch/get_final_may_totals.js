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
        }).lean();

        const dbTotalAmount = dbSales.reduce((sum, s) => sum + s.grandTotal, 0);
        const dbTotalQty = dbSales.reduce((sum, s) => sum + s.items.reduce((iq, i) => iq + i.quantity, 0), 0);

        console.log(`Final DB May Totals:`);
        console.log(`- Sales Count: ${dbSales.length}`);
        console.log(`- Amount: ${dbTotalAmount.toFixed(2)}`);
        console.log(`- Quantity: ${dbTotalQty} pcs`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
