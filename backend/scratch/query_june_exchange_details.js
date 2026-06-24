const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const storeId = '69ecb1d9f04d7249bd11adf4';

        // Find any sales in June with type: EXCHANGE, or having exchangeDetails or returnItems
        const sales = await Sale.find({
            storeId,
            $or: [
                { type: 'EXCHANGE' },
                { exchangeDetails: { $exists: true, $ne: null } },
                { returnItems: { $exists: true, $ne: [] } },
                { exchangeItems: { $exists: true, $ne: [] } }
            ]
        }).lean();

        console.log(`Exchanges found in Sale collection: ${sales.length}`);
        for (const s of sales) {
            console.log(`\n--- Sale: ${s.saleNumber} ---`);
            console.log(`ID: ${s._id}`);
            console.log(`Date: ${s.saleDate}`);
            console.log(`Type: ${s.type}`);
            console.log(`GrandTotal: ${s.grandTotal}`);
            console.log(`Items Qty: ${s.items.reduce((sum, i) => sum + i.quantity, 0)}`);
            console.log(`Items:`, JSON.stringify(s.items, null, 2));
            console.log(`ExchangeDetails:`, JSON.stringify(s.exchangeDetails, null, 2));
            console.log(`ExchangeItems:`, JSON.stringify(s.exchangeItems, null, 2));
            console.log(`ReturnItems:`, JSON.stringify(s.returnItems, null, 2));
        }

        // Look in SystemLog for any actions with /exchanges or /returns in June 2026
        const logs = await SystemLog.find({
            action: { $regex: /exchange|return/i },
            createdAt: {
                $gte: new Date('2026-06-01T00:00:00Z'),
                $lte: new Date('2026-06-30T23:59:59Z')
            }
        }).lean();

        console.log(`\nSystemLogs with Exchange/Return: ${logs.length}`);
        const actionCounts = {};
        logs.forEach(l => {
            actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
        });
        console.log(`Action Counts:`, actionCounts);

        // Let's print unique POST /api/returns or POST /api/exchanges or similar
        const postLogs = logs.filter(l => l.action.startsWith('POST'));
        console.log(`\nPOST request logs: ${postLogs.length}`);
        for (const pl of postLogs) {
            console.log(`- Action: ${pl.action}, Date: ${pl.createdAt.toISOString()}`);
            console.log(`  Body:`, JSON.stringify(pl.details?.body, null, 2));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
