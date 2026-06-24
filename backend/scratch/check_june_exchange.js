const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';
        const startJune = new Date('2026-06-01T00:00:00Z');
        const endJune = new Date('2026-06-30T23:59:59Z');

        // 1. Current June sales summary
        const dbJuneSales = await Sale.find({
            storeId,
            saleDate: { $gte: startJune, $lte: endJune }
        }).lean();

        const dbJuneQty = dbJuneSales.reduce((sum, s) => sum + s.items.reduce((iq, i) => iq + i.quantity, 0), 0);
        const dbJuneAmt = dbJuneSales.reduce((sum, s) => sum + s.grandTotal, 0);
        console.log(`=== Current June Sales in DB ===`);
        console.log(`Count: ${dbJuneSales.length}, Qty: ${dbJuneQty}, Amount: ${dbJuneAmt.toFixed(2)}`);

        // 2. Check for exchange sales (type EXCHANGE or has exchangeItems)
        const exchangeSales = dbJuneSales.filter(s => 
            s.type === 'EXCHANGE' || 
            (s.exchangeItems && s.exchangeItems.length > 0) ||
            (s.returnItems && s.returnItems.length > 0)
        );
        console.log(`\n=== Exchange/Return Sales in June ===`);
        console.log(`Found: ${exchangeSales.length}`);
        exchangeSales.forEach(s => {
            console.log(`- ${s.saleNumber}: type=${s.type}, grandTotal=${s.grandTotal}, items=${s.items.length}, qty=${s.items.reduce((q,i)=>q+i.quantity,0)}`);
            if (s.exchangeItems) console.log(`  exchangeItems: ${JSON.stringify(s.exchangeItems)}`);
            if (s.returnItems) console.log(`  returnItems: ${JSON.stringify(s.returnItems)}`);
        });

        // 3. Check SystemLog for exchange-related API calls in June for GTB
        const exchangeLogs = await SystemLog.find({
            action: { $regex: /exchange|return/i },
            createdAt: { $gte: startJune, $lte: endJune }
        }).lean();
        console.log(`\n=== Exchange/Return SystemLogs in June ===`);
        console.log(`Found: ${exchangeLogs.length}`);
        exchangeLogs.slice(0, 10).forEach(l => {
            console.log(`- Action: ${l.action}, Date: ${l.createdAt.toISOString()}`);
            if (l.details && l.details.body) {
                const b = l.details.body;
                console.log(`  storeId: ${b.storeId}, grandTotal: ${b.grandTotal}`);
            }
        });

        // 4. Also check POST /api/sales logs for exchange type
        const saleLogs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body.storeId': new mongoose.Types.ObjectId(storeId),
            createdAt: { $gte: startJune, $lte: endJune }
        }).lean();
        
        const exchangeSaleLogs = saleLogs.filter(l => 
            l.details?.body?.type === 'EXCHANGE' ||
            l.details?.body?.exchangeItems?.length > 0
        );
        console.log(`\n=== Exchange Sale Logs (POST /api/sales) ===`);
        console.log(`Total sale logs: ${saleLogs.length}, Exchange logs: ${exchangeSaleLogs.length}`);
        exchangeSaleLogs.forEach(l => {
            const b = l.details.body;
            console.log(`- LogID: ${l._id}, Date: ${l.createdAt.toISOString()}, type: ${b.type}, grandTotal: ${b.grandTotal}, products: ${b.products?.length}, qty: ${(b.products||[]).reduce((s,p)=>s+p.quantity,0)}`);
        });

        // 5. Check all sale types in June DB
        const typeCount = {};
        dbJuneSales.forEach(s => {
            const t = s.type || 'UNKNOWN';
            typeCount[t] = (typeCount[t] || 0) + 1;
        });
        console.log(`\n=== Sale Types Breakdown ===`);
        Object.entries(typeCount).forEach(([t, c]) => console.log(`  ${t}: ${c}`));

        // 6. What are the expected totals?
        console.log(`\n=== Expected vs Actual ===`);
        console.log(`User expected Qty ~212 (211+1), Amt ~147971 (146471+1500)`);
        console.log(`Actual DB Qty: ${dbJuneQty}, Amt: ${dbJuneAmt.toFixed(2)}`);
        console.log(`Difference: Qty=${212 - dbJuneQty}, Amt=${(147971 - dbJuneAmt).toFixed(2)}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
