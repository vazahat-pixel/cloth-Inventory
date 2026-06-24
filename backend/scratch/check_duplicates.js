const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("Checking GTB-0050 and GTB-0131:");
        const s50 = await Sale.findOne({ saleNumber: 'GTB-0050' }).lean();
        const s131 = await Sale.findOne({ saleNumber: 'GTB-0131' }).lean();
        console.log("GTB-0050:", s50 ? { id: s50._id, total: s50.grandTotal, items: s50.items, saleDate: s50.saleDate, createdAt: s50.createdAt } : "Not found");
        console.log("GTB-0131:", s131 ? { id: s131._id, total: s131.grandTotal, items: s131.items, saleDate: s131.saleDate, createdAt: s131.createdAt } : "Not found");

        console.log("\nChecking GTB-0034 and GTB-0118:");
        const s34 = await Sale.findOne({ saleNumber: 'GTB-0034' }).lean();
        const s118 = await Sale.findOne({ saleNumber: 'GTB-0118' }).lean();
        console.log("GTB-0034:", s34 ? { id: s34._id, total: s34.grandTotal, items: s34.items, saleDate: s34.saleDate, createdAt: s34.createdAt } : "Not found");
        console.log("GTB-0118:", s118 ? { id: s118._id, total: s118.grandTotal, items: s118.items, saleDate: s118.saleDate, createdAt: s118.createdAt } : "Not found");

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
