const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';

        // Get DB sales in June on or before June 19
        const sales = await Sale.find({
            storeId,
            saleDate: {
                $gte: new Date('2026-06-01T00:00:00Z'),
                $lte: new Date('2026-06-19T23:59:59Z')
            }
        }).sort({ saleDate: 1, saleNumber: 1 }).lean();

        const qty = sales.reduce((sum, s) => sum + s.items.reduce((iq, i) => iq + i.quantity, 0), 0);
        const amt = sales.reduce((sum, s) => sum + s.grandTotal, 0);

        console.log(`=== DB June Sales up to June 19 ===`);
        console.log(`Count: ${sales.length}, Qty: ${qty}, Amount: ${amt.toFixed(2)}`);

        // Group by sale number to see if there are duplicates or gaps
        sales.forEach(s => {
            console.log(`- ${s.saleNumber}: ${s.saleDate.toISOString().split('T')[0]}, Customer: ${s.customerName}, Qty: ${s.items.reduce((sum,i)=>sum+i.quantity,0)}, Amt: ${s.grandTotal}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
