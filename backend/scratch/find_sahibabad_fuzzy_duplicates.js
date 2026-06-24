const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecbe2cf04d7249bd11ae45';
        console.log("=== FUZZY DUPLICATE CHECK FOR SAHIBABAD ===");

        const sales = await Sale.find({ storeId, isDeleted: false }).lean();
        
        console.log("Checking duplicates by same customer name and same grand total (regardless of date):");
        const seenCustAmt = {};
        sales.forEach(s => {
            if (!s.customerName || s.customerName.toLowerCase() === 'walk-in customer' || s.customerName.toLowerCase() === 'n/a') return;
            const key = `${s.customerName.toLowerCase()}_${s.grandTotal.toFixed(2)}`;
            if (seenCustAmt[key]) {
                console.log(`- Duplicate Cust+Amt: ${s.customerName} | Total: ${s.grandTotal} | Sales: ${seenCustAmt[key].saleNumber} (${seenCustAmt[key].saleDate.toISOString().slice(0,10)}) and ${s.saleNumber} (${s.saleDate.toISOString().slice(0,10)})`);
            } else {
                seenCustAmt[key] = s;
            }
        });

        console.log("\nChecking duplicates by same item barcode and same date (regardless of sale number):");
        const seenBarcodeDate = {};
        sales.forEach(s => {
            const dateStr = s.saleDate.toISOString().slice(0, 10);
            s.items.forEach(item => {
                const key = `${dateStr}_${item.barcode}`;
                if (seenBarcodeDate[key]) {
                    console.log(`- Duplicate Barcode+Date: ${item.barcode} on ${dateStr} | Sales: ${seenBarcodeDate[key].saleNumber} and ${s.saleNumber}`);
                } else {
                    seenBarcodeDate[key] = s;
                }
            });
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
