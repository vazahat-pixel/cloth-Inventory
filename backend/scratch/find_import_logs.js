require('dotenv').config();
const mongoose = require('mongoose');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const importActions = await SystemLog.distinct('action', { action: /import/i });
        console.log("Import actions found in logs:", importActions);
        
        for (const action of importActions) {
            const count = await SystemLog.countDocuments({ action });
            console.log(`- Action: ${action} | Count: ${count}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
