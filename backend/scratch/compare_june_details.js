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

        console.log(`Comparing ${reportJuneSales.length} June report invoices against DB...`);

        let diffCount = 0;
        let diffAmt = 0;
        let diffQty = 0;

        for (const inv of reportJuneSales) {
            const dbSale = await Sale.findOne({ saleNumber: inv.saleNumber }).lean();
            if (!dbSale) {
                console.log(`- ${inv.saleNumber}: NOT FOUND IN DB! (Report Net: ${inv.net}, Qty: ${inv.quantity})`);
                diffCount++;
                diffAmt += Number(inv.net);
                diffQty += Number(inv.quantity);
                continue;
            }

            const dbTotal = dbSale.grandTotal;
            const dbQty = dbSale.items.reduce((sum, i) => sum + i.quantity, 0);
            const invTotal = Number(inv.net);
            const invQty = Number(inv.quantity);

            if (Math.abs(dbTotal - invTotal) > 0.1 || dbQty !== invQty) {
                console.log(`- ${inv.saleNumber} discrepancy:`);
                console.log(`  Report -> Net: ${invTotal}, Qty: ${invQty}, Date: ${inv.date}`);
                console.log(`  DB     -> Total: ${dbTotal}, Qty: ${dbQty}, Date: ${dbSale.saleDate}`);
                diffCount++;
                diffAmt += (invTotal - dbTotal);
                diffQty += (invQty - dbQty);
            }
        }

        console.log(`\nDiscrepancies summary:`);
        console.log(`- Count of mismatched/missing: ${diffCount}`);
        console.log(`- Amount difference: ${diffAmt.toFixed(2)}`);
        console.log(`- Qty difference: ${diffQty}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
