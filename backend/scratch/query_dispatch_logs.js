const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const query = '6a38d92c12517c17ad17bd51';
        const logs = await SystemLog.find({
            $or: [
                { action: { $regex: query } },
                { 'details.response': { $regex: query } }, // wait, response might be an object
                { 'details.body': { $regex: query } }       // body might be an object
            ]
        }).lean();

        // If that query didn't find anything, search by converting to JSON string
        const allLogs = await SystemLog.find({
            createdAt: { $gte: new Date('2026-06-19T00:00:00Z') }
        }).lean();

        const matchedLogs = allLogs.filter(l => JSON.stringify(l).includes(query));

        console.log(`Matched logs for ${query} count: ${matchedLogs.length}`);
        matchedLogs.forEach(l => {
            console.log(`\n--- Log ID: ${l._id} | Action: ${l.action} | Created: ${l.createdAt} ---`);
            console.log("Details keys:", Object.keys(l.details || {}));
            if (l.details && l.details.body) {
                console.log("Body:", JSON.stringify(l.details.body).substring(0, 500));
            }
            if (l.details && l.details.response) {
                console.log("Response:", JSON.stringify(l.details.response).substring(0, 500));
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
