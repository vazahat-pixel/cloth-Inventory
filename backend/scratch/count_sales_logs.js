require('dotenv').config();
const mongoose = require('mongoose');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const count = await SystemLog.countDocuments({
            action: 'POST /api/sales',
            'details.body': { $exists: true }
        });
        console.log("Count of POST /api/sales with body:", count);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
