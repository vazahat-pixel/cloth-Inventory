const mongoose = require('mongoose');
require('dotenv').config();

const Sale = require('../src/models/sale.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const sale = await Sale.findOne({ saleNumber: 'GTB-0112' }).lean();
        if (sale) {
            console.log(`Invoice Number: ${sale.saleNumber}`);
            console.log(`Type: ${sale.type}`);
            console.log(`exchangeAdjustment: ${sale.exchangeAdjustment}`);
            console.log(`parentSaleId: ${sale.parentSaleId}`);
            console.log(`returnedItems count: ${sale.returnedItems?.length || 0}`);
            if (sale.returnedItems && sale.returnedItems.length > 0) {
                console.log('Returned Items:');
                sale.returnedItems.forEach((item, idx) => {
                    console.log(`  - Barcode: ${item.barcode}, Qty: ${item.quantity}, Rate: ${item.rate}, Total: ${item.total}`);
                });
            } else {
                console.log('No returnedItems found in this invoice.');
            }
        } else {
            console.log('Invoice GTB-0112 not found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
