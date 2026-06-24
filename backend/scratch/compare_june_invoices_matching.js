const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

        const gtbStore = reportData.salesByStore.find(s => String(s.storeId) === '69ecb1d9f04d7249bd11adf4');
        const reportJuneSales = gtbStore.invoices.filter(inv => inv.date.startsWith('2026-06'));

        const startJune = new Date('2026-06-01T00:00:00Z');
        const endJune = new Date('2026-06-19T23:59:59Z');
        const dbJuneSales = await Sale.find({
            saleDate: { $gte: startJune, $lte: endJune },
            storeId: '69ecb1d9f04d7249bd11adf4'
        }).lean();

        console.log(`Report June Invoices: ${reportJuneSales.length}`);
        console.log(`DB June Sales (up to June 19): ${dbJuneSales.length}`);

        const dbSalesMap = new Map();
        dbJuneSales.forEach(s => {
            dbSalesMap.set(s.saleNumber, s);
        });

        let totalQtyDiff = 0;
        let totalAmtDiff = 0;

        reportJuneSales.forEach(inv => {
            const dbSale = dbSalesMap.get(inv.saleNumber);
            if (dbSale) {
                const dbTotal = dbSale.grandTotal;
                const dbQty = dbSale.items.reduce((sum, i) => sum + i.quantity, 0);
                const invTotal = Number(inv.net);
                const invQty = Number(inv.quantity);

                if (Math.abs(dbTotal - invTotal) > 0.1 || dbQty !== invQty) {
                    console.log(`Mismatch on Sale #: ${inv.saleNumber}`);
                    console.log(`  Report: Qty: ${invQty}, Net: ${invTotal.toFixed(2)}`);
                    console.log(`  DB:     Qty: ${dbQty}, Net: ${dbTotal.toFixed(2)}`);
                    totalQtyDiff += (invQty - dbQty);
                    totalAmtDiff += (invTotal - dbTotal);
                }
            } else {
                console.log(`Sale #: ${inv.saleNumber} is missing in DB!`);
            }
        });

        console.log(`\nTotal mismatch in matched invoices: Qty Diff = ${totalQtyDiff}, Amt Diff = ${totalAmtDiff.toFixed(2)}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
