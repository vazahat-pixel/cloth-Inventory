const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const Sale = mongoose.connection.db.collection('sales');
    const sales = await Sale.find({}).sort({ saleDate: -1 }).limit(5).toArray();

    console.log('Last 5 sales items:');
    for (const sale of sales) {
        console.log(`Sale ${sale.saleNumber || sale.invoiceNumber}:`);
        console.log(`  grandTotal: ${sale.grandTotal}, subTotal: ${sale.subTotal}`);
        if (sale.items) {
            for (const item of sale.items) {
                console.log(`    Item: ${item.itemName} (${item.sku})`);
                console.log(`      mrp: ${item.mrp}, rate: ${item.rate}, total: ${item.total}`);
                console.log(`      discountPercent: ${item.discountPercent}, discount: ${item.discount}, promoDiscount: ${item.promoDiscount}, discountAmount: ${item.discountAmount}, extraDiscount: ${item.extraDiscount}`);
            }
        }
    }

    await mongoose.disconnect();
    console.log('Disconnected!');
}

run().catch(console.error);
