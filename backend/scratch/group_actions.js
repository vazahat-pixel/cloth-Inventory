const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const stats = await SystemLog.aggregate([
            { $match: { createdAt: { $gt: new Date('2026-06-19T00:00:00Z') } } },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log("Actions after June 19:");
        stats.forEach(s => {
            console.log(`- ${s._id}: ${s.count}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
