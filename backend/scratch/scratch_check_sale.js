const mongoose = require('mongoose');
require('dotenv').config();

const Sale = require('../src/models/sale.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const sale = await Sale.findById('6a2d3c90e442d6672d114ec0');
        if (sale) {
            console.log('Found Sale:', sale.saleNumber);
            console.log('Items:');
            sale.items.forEach(it => {
                console.log(`  - Item Name: ${it.itemName}, HSN: ${it.hsnCode}`);
            });
            console.log('hsnSummary:', sale.hsnSummary);
        } else {
            console.log('Sale not found');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
