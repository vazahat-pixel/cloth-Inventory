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

        for (const log of receiveLogs) {
            const parts = log.action.split('/');
            const targetId = parts[3]; // get ID

            // Try to find a dispatch log that created this ID
            const creationLog = await SystemLog.findOne({
                action: 'POST /api/dispatch',
                $or: [
                    { _id: new mongoose.Types.ObjectId(targetId) },
                    { 'details.response._id': targetId },
                    { 'details.response.id': targetId }
                ]
            }).lean();

            let dispatchNumber = '';
            let qty = 0;
            if (creationLog && creationLog.details && creationLog.details.body) {
                dispatchNumber = creationLog.details.body.dispatchNumber;
                qty = (creationLog.details.body.items || []).reduce((sum, i) => sum + (i.qty || i.quantity || 0), 0);
                console.log(`Matched target ID ${targetId} to Creation Log with dispatchNumber: ${dispatchNumber}, Qty: ${qty}`);
            } else {
                console.log(`Could not find creation log for target ID ${targetId}`);
            }

            // Find in DB by dispatchNumber or similar
            if (dispatchNumber) {
                const dispatch = await Dispatch.findOne({ dispatchNumber }).lean();
                if (dispatch) {
                    console.log(`  Found Dispatch in DB! ID: ${dispatch._id}, Status in DB: ${dispatch.status}, Qty: ${dispatch.items.reduce((sum, i) => sum + i.qty, 0)}`);
                } else {
                    console.log(`  Dispatch ${dispatchNumber} NOT found in DB!`);
                }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
