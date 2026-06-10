const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const Sale = mongoose.connection.db.collection('sales');
    const sales = await Sale.find({}).sort({ saleDate: -1 }).limit(10).toArray();

    console.log('Discount calculation check:');
    for (const sale of sales) {
        console.log(`Sale ${sale.saleNumber || sale.invoiceNumber}:`);
        if (sale.items) {
            for (const item of sale.items) {
                const itemGross = (item.rate || item.mrp || 0) * item.quantity;
                let calculatedDiscount = 0;
                if (itemGross > 0) {
                    const discountAmt = item.discountAmount || (item.promoDiscount || 0) + ((itemGross * (item.discount || 0)) / 100);
                    calculatedDiscount = (discountAmt / itemGross) * 100;
                } else if (item.discount) {
                    calculatedDiscount = item.discount;
                }
                const roundedDiscount = Number(calculatedDiscount.toFixed(2));
                console.log(`  Item: ${item.itemName}`);
                console.log(`    mrp: ${item.mrp}, rate: ${item.rate}, qty: ${item.quantity}, gross: ${itemGross}`);
                console.log(`    discountAmount: ${item.discountAmount}, promoDiscount: ${item.promoDiscount}, discount: ${item.discount}`);
                console.log(`    => calculatedDiscount: ${calculatedDiscount}%, rounded: ${roundedDiscount}%`);
            }
        }
    }

    await mongoose.disconnect();
    console.log('Disconnected!');
}

run().catch(console.error);
