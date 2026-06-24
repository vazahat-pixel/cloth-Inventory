const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');
const Dispatch = require('../src/models/dispatch.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const receiveLogs = await SystemLog.find({
            action: /receive/i,
            createdAt: { $gt: new Date('2026-06-19T23:59:59Z') }
        }).lean();

        console.log(`Found ${receiveLogs.length} receive logs after June 19.`);

        let totalGtbQty = 0;

        for (const log of receiveLogs) {
            // The action is like 'POST /api/dispatch/6a33c0bb984a0431f24a2650/receive'
            const parts = log.action.split('/');
            const dispatchId = parts[3]; // get ID

            if (mongoose.Types.ObjectId.isValid(dispatchId)) {
                const dispatch = await Dispatch.findById(dispatchId).lean();
                if (dispatch) {
                    const isGtb = String(dispatch.destinationStoreId) === '69ecb1d9f04d7249bd11adf4';
                    const qty = dispatch.items.reduce((sum, i) => sum + i.qty, 0);
                    console.log(`Log ID: ${log._id}, Dispatch #: ${dispatch.dispatchNumber}, Date: ${log.createdAt}, IsGTB: ${isGtb}, Qty: ${qty}, Status in DB: ${dispatch.status}`);
                    if (isGtb) {
                        totalGtbQty += qty;
                    }
                } else {
                    console.log(`Dispatch ID ${dispatchId} not found in DB!`);
                }
            }
        }

        console.log(`\nTotal GTB received Qty from these dispatches: ${totalGtbQty}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
