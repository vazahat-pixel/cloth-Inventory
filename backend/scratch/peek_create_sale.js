require('dotenv').config();
const mongoose = require('mongoose');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const log = await SystemLog.findOne({ action: 'CREATE_SALE' }).lean();
        if (log) {
            console.log("CREATE_SALE Keys:", Object.keys(log));
            console.log("Details keys:", log.details ? Object.keys(log.details) : 'null');
            console.log("Full Details object:", JSON.stringify(log.details, null, 2));
        } else {
            console.log("No CREATE_SALE log found.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
