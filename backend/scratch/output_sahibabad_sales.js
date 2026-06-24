const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecbe2cf04d7249bd11ae45';
        const dbSales = await Sale.find({ storeId, isDeleted: false }).sort({ saleDate: 1 }).lean();

        const may = dbSales.filter(s => s.saleDate >= new Date('2026-05-01T00:00:00Z') && s.saleDate <= new Date('2026-05-31T23:59:59Z'));
        const june = dbSales.filter(s => s.saleDate >= new Date('2026-06-01T00:00:00Z') && s.saleDate <= new Date('2026-06-30T23:59:59Z'));

        const data = {
            maySales: may.map(s => ({
                saleNumber: s.saleNumber,
                saleDate: s.saleDate,
                customerName: s.customerName,
                grandTotal: s.grandTotal,
                qty: s.items.reduce((sum, i) => sum + i.quantity, 0)
            })),
            juneSales: june.map(s => ({
                saleNumber: s.saleNumber,
                saleDate: s.saleDate,
                customerName: s.customerName,
                grandTotal: s.grandTotal,
                qty: s.items.reduce((sum, i) => sum + i.quantity, 0)
            }))
        };

        fs.writeFileSync(path.join(__dirname, 'sahibabad_db_sales.json'), JSON.stringify(data, null, 2));
        console.log(`Saved ${data.maySales.length} May sales and ${data.juneSales.length} June sales to JSON.`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
