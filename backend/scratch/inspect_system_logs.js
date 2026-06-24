require('dotenv').config();
const mongoose = require('mongoose');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("Searching SystemLog for bulk imports and sales...");
        
        const importLogs = await SystemLog.find({ action: /import/i }).limit(5).lean();
        console.log(`Found ${importLogs.length} import logs:`);
        importLogs.forEach(l => {
            console.log(`- Action: ${l.action} | Module: ${l.module} | Details keys: ${l.details ? Object.keys(l.details) : 'null'}`);
            if (l.details) {
                console.log('Details snippet:', JSON.stringify(l.details).substring(0, 500));
            }
        });

        const saleLogs = await SystemLog.find({ action: /CREATE_SALE/i }).limit(5).lean();
        console.log(`\nFound ${saleLogs.length} sale logs:`);
        saleLogs.forEach(l => {
            console.log(`- Action: ${l.action} | Module: ${l.module} | Details keys: ${l.details ? Object.keys(l.details) : 'null'}`);
            if (l.details) {
                console.log('Details snippet:', JSON.stringify(l.details).substring(0, 500));
            }
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
