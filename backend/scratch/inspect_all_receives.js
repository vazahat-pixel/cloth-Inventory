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

        console.log(`Found ${receiveLogs.length} receive logs.`);

        for (const log of receiveLogs) {
            const parts = log.action.split('/');
            const dispatchId = parts[3];

            console.log(`\n--------------------------------------------`);
            console.log(`Receive Log ID: ${log._id}, Action: ${log.action}`);
            
            // Search SystemLog for any logs mentioning this dispatchId
            const relatedLogs = await SystemLog.find({
                action: new RegExp(dispatchId, 'i')
            }).lean();

            console.log(`Related logs: ${relatedLogs.length}`);
            
            let dispatchDoc = null;
            relatedLogs.forEach(rl => {
                if (rl.action.startsWith('GET /api/dispatch/') && rl.details && rl.details.response) {
                    dispatchDoc = rl.details.response;
                }
            });

            if (dispatchDoc) {
                console.log(`Found Dispatch Doc in GET log!`);
                console.log(`- Dispatch Number: ${dispatchDoc.dispatchNumber}`);
                console.log(`- Status: ${dispatchDoc.status}`);
                console.log(`- Source Warehouse: ${dispatchDoc.sourceWarehouseId?.name || dispatchDoc.sourceWarehouseId}`);
                console.log(`- Destination Store: ${dispatchDoc.destinationStoreId?.name || dispatchDoc.destinationStoreId}`);
                const qty = (dispatchDoc.items || []).reduce((sum, i) => sum + (i.qty || i.quantity || 0), 0);
                console.log(`- Qty: ${qty}`);
                
                // Let's check if this dispatch number is in the DB
                const dbDispatch = await Dispatch.findOne({ dispatchNumber: dispatchDoc.dispatchNumber }).lean();
                if (dbDispatch) {
                    console.log(`  Found in DB! ID: ${dbDispatch._id}, Status in DB: ${dbDispatch.status}`);
                } else {
                    console.log(`  NOT found in DB!`);
                }
            } else {
                console.log(`Could not find GET log with dispatch doc.`);
                // Let's print actions of related logs
                relatedLogs.forEach(rl => {
                    console.log(`  - ${rl.action} (createdAt: ${rl.createdAt})`);
                });
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
