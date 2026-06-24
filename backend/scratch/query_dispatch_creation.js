const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const ids = [
            '6a38d92c12517c17ad17bd51',
            '6a34df8a6aa096db0c85501b',
            '6a366ad36aa096db0c8642be'
        ];

        for (const id of ids) {
            const logs = await SystemLog.find({}).lean();
            const matched = logs.filter(l => JSON.stringify(l).includes(id));
            console.log(`\n=== Matches for ${id} (Total: ${matched.length}) ===`);
            matched.forEach(l => {
                console.log(`- Log ID: ${l._id} | Action: ${l.action} | Created: ${l.createdAt}`);
                if (l.action === 'POST /api/dispatch' && l.details && l.details.response) {
                    console.log("  Status Code:", l.details.statusCode);
                }
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
