const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const log = await SystemLog.findOne({
            action: 'POST /api/dispatch',
            'details.body': { $exists: true }
        }).lean();

        console.log("POST /api/dispatch log example:", JSON.stringify(log, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
