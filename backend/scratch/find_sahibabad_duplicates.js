const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecbe2cf04d7249bd11ae45';
        console.log("=== CHECKING FOR SAHIBABAD DUPLICATES ===");

        const sales = await Sale.find({ storeId, isDeleted: false }).lean();
        console.log(`Total Sales: ${sales.length}`);

        // Check for duplicates by date, customer, quantity and grandTotal
        const seen = {};
        const duplicates = [];

        sales.forEach(s => {
            const dateStr = s.saleDate.toISOString().slice(0, 10);
            const qty = s.items.reduce((sum, i) => sum + i.quantity, 0);
            const key = `${dateStr}_${s.customerName}_${qty}_${s.grandTotal.toFixed(2)}`;

            if (seen[key]) {
                duplicates.push({
                    key,
                    original: seen[key],
                    duplicate: s
                });
            } else {
                seen[key] = s;
            }
        });

        console.log(`Found ${duplicates.length} potential duplicates:`);
        duplicates.forEach(d => {
            console.log(`- Key: ${d.key}`);
            console.log(`  Original: ${d.original.saleNumber} (ID: ${d.original._id})`);
            console.log(`  Duplicate: ${d.duplicate.saleNumber} (ID: ${d.duplicate._id})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
