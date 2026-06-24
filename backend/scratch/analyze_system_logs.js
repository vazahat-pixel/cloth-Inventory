const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const SystemLog = require('../src/models/systemLog.model');

async function analyzeLogs() {
    await connectDB();
    try {
        console.log("Analyzing system logs...");
        const groups = await SystemLog.aggregate([
            {
                $group: {
                    _id: { module: '$module', action: '$action' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        console.log("System Log Event Types and Counts:");
        for (const gp of groups) {
            console.log(`- Module: ${gp._id.module} | Action: ${gp._id.action} | Count: ${gp.count}`);
        }
        
        // Also look for actions that sound like Import or Migration
        console.log("\nChecking for import or setup logs...");
        const importLogs = await SystemLog.find({
            $or: [
                { module: 'Import' },
                { action: /import/i },
                { action: /seed/i }
            ]
        }).limit(10).lean();
        
        console.log(`Found ${importLogs.length} import/setup sample logs:`);
        for (const log of importLogs) {
            console.log(JSON.stringify({
                action: log.action,
                module: log.module,
                createdAt: log.createdAt,
                detailsKeys: log.details ? Object.keys(log.details) : []
            }, null, 2));
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

analyzeLogs();
