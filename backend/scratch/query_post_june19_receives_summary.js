const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');
const Dispatch = require('../src/models/dispatch.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const actions = [
            'POST /api/dispatch/6a38d92c12517c17ad17bd51/receive',
            'POST /api/dispatch/6a366ad36aa096db0c8642be/receive',
            'POST /api/dispatch/6a34df8a6aa096db0c85501b/receive'
        ];

        const logs = await SystemLog.find({ action: { $in: actions } }).lean();

        for (const l of logs) {
            console.log(`\n=== Log ID: ${l._id} | Action: ${l.action} ===`);
            // Extract dispatch ID from action URL
            const parts = l.action.split('/');
            const dispatchId = parts[3];
            
            const dispatch = await Dispatch.findById(dispatchId).lean();
            if (dispatch) {
                const totalQty = dispatch.items.reduce((sum, item) => sum + (item.qty || item.quantity || 0), 0);
                console.log(`  Dispatch Number: ${dispatch.dispatchNumber}`);
                console.log(`  Destination Store ID: ${dispatch.destinationStoreId}`);
                console.log(`  Status in DB: ${dispatch.status}`);
                console.log(`  Total Items Qty: ${totalQty}`);
                
                // If there's a receive body, sum the received quantities
                if (l.details && l.details.body && Array.isArray(l.details.body.items)) {
                    const receivedQty = l.details.body.items.reduce((sum, item) => sum + (item.receivedQty || 0), 0);
                    console.log(`  Received Qty in Log: ${receivedQty}`);
                }
            } else {
                console.log(`  Dispatch ID ${dispatchId} not found in DB!`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
