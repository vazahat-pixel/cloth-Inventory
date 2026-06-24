const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const logIds = [
            '6a2ba89c9e2deacb997ac844',
            '6a2ba97c9e2deacb997acadc',
            '6a2ba9cd9e2deacb997acbb9'
        ];

        for (const id of logIds) {
            const log = await SystemLog.findById(id).lean();
            if (log) {
                console.log(`\n=== Log ID: ${id} ===`);
                console.log(`CreatedAt: ${log.createdAt.toISOString()}`);
                console.log(`Body:`, JSON.stringify(log.details?.body, null, 2));
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
