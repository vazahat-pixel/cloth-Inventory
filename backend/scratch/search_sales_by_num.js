const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const saleNumbers = ['GTB-0126', 'GTB-0136'];
        for (const num of saleNumbers) {
            const sale = await Sale.findOne({ saleNumber: num }).lean();
            if (sale) {
                console.log(`Sale ${num} found in DB:`, {
                    _id: sale._id,
                    saleNumber: sale.saleNumber,
                    grandTotal: sale.grandTotal,
                    saleDate: sale.saleDate,
                    itemsQty: sale.items.reduce((s, i) => s + i.quantity, 0),
                    customerName: sale.customerName
                });
            } else {
                console.log(`Sale ${num} NOT found in DB`);
            }
        }

        // Let's also print all June sale numbers currently in the DB to see if there are gaps or if they have different formats
        const sales = await Sale.find({
            storeId: '69ecb1d9f04d7249bd11adf4',
            saleDate: {
                $gte: new Date('2026-06-01T00:00:00Z'),
                $lte: new Date('2026-06-30T23:59:59Z')
            }
        }).sort({ saleNumber: 1 }).lean();
        console.log(`\nJune Sale numbers in DB (${sales.length} total):`);
        console.log(sales.map(s => `${s.saleNumber} (${s.items.reduce((sum,i)=>sum+i.quantity,0)} pcs, ${s.grandTotal} INR, ${s.saleDate.toISOString().split('T')[0]})`));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
