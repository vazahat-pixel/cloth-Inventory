const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const startMay = new Date('2026-05-01T00:00:00Z');
        const endMay = new Date('2026-05-31T23:59:59Z');

        const sales = await Sale.find({
            saleDate: { $gte: startMay, $lte: endMay },
            storeId: '69ecb1d9f04d7249bd11adf4'
        }).lean();

        console.log(`Total May sales in DB: ${sales.length}`);
        
        const statuses = {};
        sales.forEach(s => {
            statuses[s.status] = (statuses[s.status] || 0) + 1;
        });
        console.log("Statuses:", statuses);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
