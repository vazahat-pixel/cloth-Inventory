const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const StoreInventory = require('../src/models/storeInventory.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

        const gtbStore = reportData.salesByStore.find(s => String(s.storeId) === '69ecb1d9f04d7249bd11adf4');
        
        // June report sales (up to June 19)
        const reportJuneSales = gtbStore.invoices.filter(inv => inv.date.startsWith('2026-06'));
        const reportJuneAmount = reportJuneSales.reduce((sum, inv) => sum + Number(inv.net), 0);
        const reportJuneQty = reportJuneSales.reduce((sum, inv) => sum + Number(inv.quantity), 0);

        console.log(`Report June Invoices (up to June 19) - Count: ${reportJuneSales.length}, Amount: ${reportJuneAmount.toFixed(2)}, Qty: ${reportJuneQty}`);

        // DB June sales (all of June)
        const startJune = new Date('2026-06-01T00:00:00Z');
        const endJune = new Date('2026-06-30T23:59:59Z');
        const dbJuneSales = await Sale.find({
            saleDate: { $gte: startJune, $lte: endJune },
            storeId: '69ecb1d9f04d7249bd11adf4'
        }).lean();

        const dbJuneAmount = dbJuneSales.reduce((sum, s) => sum + s.grandTotal, 0);
        const dbJuneQty = dbJuneSales.reduce((sum, s) => sum + s.items.reduce((iq, i) => iq + i.quantity, 0), 0);

        console.log(`DB June Sales (all) - Count: ${dbJuneSales.length}, Amount: ${dbJuneAmount.toFixed(2)}, Qty: ${dbJuneQty}`);

        // Let's also check GTB Nagar store closing stock in DB
        const inventory = await StoreInventory.find({ storeId: '69ecb1d9f04d7249bd11adf4' }).lean();
        const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
        const totalAvailable = inventory.reduce((sum, item) => sum + item.quantityAvailable, 0);
        console.log(`\nGTB Store closing stock in DB - Total: ${totalStock}, Available: ${totalAvailable}`);

        // Post-June 19 logs for GTB Store
        const postJune19Logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true },
            'details.body.storeId': new mongoose.Types.ObjectId('69ecb1d9f04d7249bd11adf4'),
            createdAt: { $gt: new Date('2026-06-19T23:59:59Z') }
        }).lean();
        console.log(`\nPost-June 19 logs count: ${postJune19Logs.length}`);
        const logPostJune19Amount = postJune19Logs.reduce((sum, l) => sum + l.details.body.grandTotal, 0);
        const logPostJune19Qty = postJune19Logs.reduce((sum, l) => sum + (l.details.body.products || []).reduce((iq, p) => iq + p.quantity, 0), 0);
        console.log(`Post-June 19 Logs - Amount: ${logPostJune19Amount.toFixed(2)}, Qty: ${logPostJune19Qty}`);

        // Find missing report invoices in DB for June
        console.log("\nChecking missing June invoices in DB...");
        const dbSaleNumbers = new Set(dbJuneSales.map(s => s.saleNumber));
        reportJuneSales.forEach(inv => {
            if (!dbSaleNumbers.has(inv.saleNumber)) {
                console.log(`Missing Report Invoice - Sale #: ${inv.saleNumber}, Date: ${inv.date}, Net: ${inv.net}, Qty: ${inv.quantity}`);
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
