const mongoose = require('mongoose');
require('dotenv').config();

const Sale = require('../src/models/sale.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const totalSales = await Sale.countDocuments({});
        console.log(`Total Sales: ${totalSales}`);

        const sampleSales = await Sale.find({}).limit(5);
        sampleSales.forEach(s => {
            console.log(`ID: ${s._id}, Sale Number: ${s.saleNumber}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
