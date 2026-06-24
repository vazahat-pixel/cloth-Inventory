const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("=== SAHIBABAD DB SALES DETAILED INSPECTION ===");
        const storeId = '69ecbe2cf04d7249bd11ae45';

        const dbSales = await Sale.find({ storeId, isDeleted: false }).sort({ saleDate: 1 }).lean();
        console.log(`Total Sales in DB for Sahibabad: ${dbSales.length}`);

        console.log("\n--- MAY SALES IN DB ---");
        const maySales = dbSales.filter(s => s.saleDate >= new Date('2026-05-01T00:00:00Z') && s.saleDate <= new Date('2026-05-31T23:59:59Z'));
        console.log(`Count: ${maySales.length}`);
        maySales.forEach(s => {
            const qty = s.items.reduce((sum, i) => sum + i.quantity, 0);
            console.log(`- ${s.saleNumber} | Date: ${s.saleDate.toISOString().slice(0,10)} | Customer: ${s.customerName} | Qty: ${qty} | Total: ${s.grandTotal} | Items: ${s.items.map(i => `${i.barcode}(qty:${i.quantity},tot:${i.total})`).join(', ')}`);
        });

        console.log("\n--- JUNE SALES IN DB ---");
        const juneSales = dbSales.filter(s => s.saleDate >= new Date('2026-06-01T00:00:00Z') && s.saleDate <= new Date('2026-06-30T23:59:59Z'));
        console.log(`Count: ${juneSales.length}`);
        juneSales.forEach(s => {
            const qty = s.items.reduce((sum, i) => sum + i.quantity, 0);
            console.log(`- ${s.saleNumber} | Date: ${s.saleDate.toISOString().slice(0,10)} | Customer: ${s.customerName} | Qty: ${qty} | Total: ${s.grandTotal} | Items: ${s.items.map(i => `${i.barcode}(qty:${i.quantity},tot:${i.total})`).join(', ')}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
