const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');
const Dispatch = require('../src/models/dispatch.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const logId = '6a38d91112517c17ad17b5bd';
        const log = await SystemLog.findById(logId).lean();
        console.log("Log Details:");
        if (log && log.details && log.details.body) {
            console.log("Log Items:", JSON.stringify(log.details.body.items, null, 2));
        }

        const dispatch = await Dispatch.findOne({ dispatchNumber: 'SCH-6GFSTG' }).lean();
        console.log("\nDB Dispatch Details:");
        if (dispatch) {
            console.log("DB Items:", JSON.stringify(dispatch.items, null, 2));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
