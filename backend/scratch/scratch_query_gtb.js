const mongoose = require('mongoose');
require('dotenv').config();

const Sale = require('../src/models/sale.model');
const Item = require('../src/models/item.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const sale = await Sale.findOne({
        $or: [{ saleNumber: 'GTB-0095' }, { invoiceNumber: 'GTB-0095' }]
    }).populate({
        path: 'items.itemId',
        populate: { path: 'hsCodeId' }
    });

    if (sale) {
        console.log(`Found Sale ${sale.saleNumber}:`);
        for (const item of sale.items) {
            console.log(`  Item: ${item.itemName}`);
            console.log(`    Category: ${item.category}`);
            console.log(`    Sale hsnCode: "${item.hsnCode}"`);
            console.log(`    Item Master hsCodeId ref: ${item.itemId?.hsCodeId}`);
            console.log(`    Item Master hsnCode: ${item.itemId?.hsnCode}`);
        }
    } else {
        console.log('Sale not found.');
    }
    await mongoose.disconnect();
}

run().catch(console.error);
