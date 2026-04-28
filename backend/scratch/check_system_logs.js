const mongoose = require('mongoose');
const SystemLog = require('../src/models/systemLog.model');
require('../src/models/user.model');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const logs = await SystemLog.find({
        createdAt: { $gte: new Date('2026-04-27T11:30:00Z') }
    }).sort({ createdAt: 1 }).populate('userId', 'name');
    
    console.log(`System Logs (Today 11:30+):`);
    logs.forEach(l => {
        console.log(`- Time: ${l.createdAt.toISOString()}, User: ${l.userId?.name}, Action: ${l.action}, Target: ${l.targetId}, Details: ${l.details}`);
    });
    
    process.exit(0);
}
check();
