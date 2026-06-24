const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const logIds = [
            '6a3638a36aa096db0c862824',
            '6a3638cf6aa096db0c86286b',
            '6a3638fc6aa096db0c8628b5',
            '6a3639576aa096db0c86291b',
            '6a363b166aa096db0c862c15',
            '6a363b5b6aa096db0c862ca4',
            '6a363cdb6aa096db0c862e1f'
        ];

        const logs = await SystemLog.find({ _id: { $in: logIds } }).lean();

        let sumGrandTotal = 0;
        let sumProductTotal = 0;
        let sumQty = 0;

        logs.forEach(l => {
            const body = l.details.body;
            console.log(`\n=== Log ID: ${l._id} ===`);
            console.log("Date:", body.date, "Sale Number:", body.saleNumber);
            console.log("Grand Total:", body.grandTotal);
            console.log("Subtotal:", body.subTotal);
            console.log("Tax Amount:", body.taxAmount);
            console.log("Discount Amount:", body.discountAmount);
            
            sumGrandTotal += body.grandTotal;

            if (Array.isArray(body.products)) {
                body.products.forEach((p, idx) => {
                    console.log(`  Product ${idx+1}: SKU: ${p.barcode || p.sku} | Name: ${p.itemName} | Qty: ${p.quantity} | Rate: ${p.rate} | MRP: ${p.mrp} | Total: ${p.total}`);
                    sumProductTotal += p.total;
                    sumQty += p.quantity;
                });
            }
        });

        console.log(`\nSummary:`);
        console.log(`- Total logs count: ${logs.length}`);
        console.log(`- Sum of Grand Totals: ${sumGrandTotal.toFixed(2)}`);
        console.log(`- Sum of Product Totals: ${sumProductTotal.toFixed(2)}`);
        console.log(`- Sum of Quantities: ${sumQty}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
