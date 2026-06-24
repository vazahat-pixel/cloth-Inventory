require('dotenv').config();
const mongoose = require('mongoose');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("Analyzing log details for POST endpoints...");
        
        const postActions = await SystemLog.distinct('action', { action: /^POST/ });
        console.log("Post Actions found:", postActions);
        
        for (const action of postActions) {
            const sample = await SystemLog.findOne({ action, 'details.body': { $exists: true } }).lean();
            if (sample) {
                console.log(`Action: ${action} HAS body in details. Keys:`, Object.keys(sample.details.body));
            } else {
                console.log(`Action: ${action} has NO body in details.`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
