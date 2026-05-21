const mongoose = require('mongoose');
require('dotenv').config();
const Sale = require('./src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const sales = await Sale.aggregate([
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: '$items.quantity' } } }
    ]);
    console.log('Total Sold Qty:', sales[0]?.total);
    process.exit(0);
}
run();
