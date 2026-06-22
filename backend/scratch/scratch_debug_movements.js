const mongoose = require('mongoose');
require('dotenv').config();

const StockMovement = require('../src/models/stockMovement.model');
const StockLedger = require('../src/models/stockLedger.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const refId = '6a2eb308e442d6672d10d246';

        console.log('--- StockMovement Records ---');
        const movements = await StockMovement.find({
            $or: [
                { referenceId: refId },
                { referenceId: new mongoose.Types.ObjectId(refId) }
            ]
        }).sort({ createdAt: 1 }).lean();

        movements.forEach((m, idx) => {
            console.log(`\nMovement #${idx + 1}:`);
            console.log(`  _id: ${m._id}`);
            console.log(`  createdAt: ${m.createdAt}`);
            console.log(`  variantId: ${m.variantId}`);
            console.log(`  barcode: "${m.barcode}"`);
            console.log(`  qty: ${m.qty}`);
            console.log(`  type: ${m.type}`);
            console.log(`  referenceId: ${m.referenceId}`);
            console.log(`  referenceType: ${m.referenceType}`);
            console.log(`  fromLocation: ${m.fromLocation}`);
            console.log(`  toLocation: ${m.toLocation}`);
        });

        console.log('\n--- StockLedger Records ---');
        const ledger = await StockLedger.find({
            $or: [
                { referenceId: refId },
                { referenceId: refId.toString() }
            ]
        }).sort({ createdAt: 1 }).lean();

        ledger.forEach((l, idx) => {
            console.log(`\nLedger #${idx + 1}:`);
            console.log(`  _id: ${l._id}`);
            console.log(`  createdAt: ${l.createdAt}`);
            console.log(`  barcode: "${l.barcode}"`);
            console.log(`  type: ${l.type}`);
            console.log(`  quantity: ${l.quantity}`);
            console.log(`  source: ${l.source}`);
            console.log(`  balanceAfter: ${l.balanceAfter}`);
            console.log(`  locationId: ${l.locationId}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
