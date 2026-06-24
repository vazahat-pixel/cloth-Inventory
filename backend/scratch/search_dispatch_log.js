const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const targetId = '6a34df8a6aa096db0c85501b';
        const logs = await SystemLog.find({
            $or: [
                { _id: new mongoose.Types.ObjectId(targetId) },
                { action: new RegExp(targetId, 'i') },
                { 'details.body.dispatchId': targetId },
                { 'details.body.id': targetId }
            ]
        }).lean();

        console.log(`Logs matching ${targetId}: ${logs.length}`);
        logs.forEach(l => {
            console.log(`Log ID: ${l._id}, Action: ${l.action}, details:`, JSON.stringify(l.details, null, 2));
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
