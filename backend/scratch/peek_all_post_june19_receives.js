const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

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
            console.log(`\n=== Log ID: ${l._id} | Action: ${l.action} | Created: ${l.createdAt} ===`);
            console.log("Details keys:", Object.keys(l.details || {}));
            if (l.details && l.details.body) {
                console.log("Body:", JSON.stringify(l.details.body, null, 2));
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
