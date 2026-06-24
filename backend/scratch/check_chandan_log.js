const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const log = await SystemLog.findById('6a3686a8dbd9357d6e438261').lean();
        if (log) {
            console.log("Chandan Kumar Log details:", JSON.stringify(log.details?.body, null, 2));
        } else {
            console.log("Log not found.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
