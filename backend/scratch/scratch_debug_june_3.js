require('dotenv').config();
const mongoose = require('mongoose');

const StoreInventory = require('../src/models/storeInventory.model');
const AuditLog = require('../src/models/auditLog.model');
const StockMovement = require('../src/models/stockMovement.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const start = new Date('2026-06-03T00:00:00.000Z');
    const end = new Date('2026-06-03T23:59:59.999Z');

    const count = await StoreInventory.countDocuments({
        createdAt: { $gte: start, $lte: end }
    });
    console.log(`StoreInventory records created on 2026-06-03: ${count}`);

    const auditLogs = await AuditLog.find({
        createdAt: { $gte: start, $lte: end }
    }).limit(10).lean();
    console.log(`Audit logs count on June 3: ${auditLogs.length}`);
    if (auditLogs.length > 0) {
        console.log('Sample audit logs:');
        auditLogs.forEach(log => {
            console.log(`- Action: ${log.action} | Module: ${log.module} | Details: ${log.details}`);
        });
    }

    const movements = await StockMovement.find({
        createdAt: { $gte: start, $lte: end }
    }).limit(10).lean();
    console.log(`Stock movements count on June 3: ${movements.length}`);

    await mongoose.disconnect();
}

run().catch(console.error);
