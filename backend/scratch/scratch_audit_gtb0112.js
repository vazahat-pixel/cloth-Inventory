const mongoose = require('mongoose');
require('dotenv').config();

const AuditLog = require('../src/models/auditLog.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const gtbId = '6a2eb308e442d6672d10d246';

        const logs = await AuditLog.find({ targetId: gtbId })
            .populate('performedBy')
            .sort({ createdAt: 1 })
            .lean();

        console.log(`Found ${logs.length} audit logs for GTB-0112:`);
        logs.forEach((log, idx) => {
            console.log(`\n--- Log #${idx + 1} ---`);
            console.log(`Action: ${log.action}`);
            console.log(`Performed By: ${log.performedBy?.username || log.performedBy?.name || log.performedBy}`);
            console.log(`Time: ${log.createdAt}`);
            console.log(`Before:`, JSON.stringify(log.before));
            console.log(`After:`, JSON.stringify(log.after));
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
