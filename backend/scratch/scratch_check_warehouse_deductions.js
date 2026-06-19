require('dotenv').config();
const mongoose = require('mongoose');

const Dispatch = require('../src/models/dispatch.model');
const StockLedger = require('../src/models/stockLedger.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const disp21 = await Dispatch.findOne({ dispatchNumber: 'SCH-2026-00021' }).lean();
    const disp22 = await Dispatch.findOne({ dispatchNumber: 'SCH-2026-00022' }).lean();
    const disp09 = await Dispatch.findOne({ dispatchNumber: 'DSP-00009' }).lean();

    const checkWarehouseLedger = async (disp, name) => {
        if (!disp) {
            console.log(`${name}: Dispatch not found`);
            return;
        }
        const count = await StockLedger.countDocuments({
            referenceId: disp._id.toString(),
            locationType: 'WAREHOUSE'
        });
        const sumRes = await StockLedger.aggregate([
            {
                $match: {
                    referenceId: disp._id.toString(),
                    locationType: 'WAREHOUSE'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$quantity' }
                }
            }
        ]);
        console.log(`${name} (${disp.dispatchNumber}) | ID: ${disp._id} | Warehouse Ledger count: ${count} | Total Qty: ${sumRes[0]?.total || 0}`);
    };

    await checkWarehouseLedger(disp21, 'SCH-2026-00021');
    await checkWarehouseLedger(disp22, 'SCH-2026-00022');
    await checkWarehouseLedger(disp09, 'DSP-00009');

    await mongoose.disconnect();
}

run().catch(console.error);
