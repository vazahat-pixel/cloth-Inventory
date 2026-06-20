const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

// Register models
require('../src/models/user.model');
require('../src/models/warehouse.model');
require('../src/models/store.model');
require('../src/models/deliveryChallan.model');
require('../src/models/sale.model');
require('../src/models/item.model');
require('../src/models/hsnCode.model');
require('../src/models/brand.model');
require('../src/models/category.model');
require('../src/models/group.model');

const Dispatch = require('../src/models/dispatch.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const dispatches = await Dispatch.find({
            status: { $in: ['DISPATCHED', 'RECEIVED'] }
        }).sort({ createdAt: -1 });

        console.log(`\nFound ${dispatches.length} DISPATCHED/RECEIVED dispatches in DB:\n`);
        
        dispatches.forEach((d) => {
            const hasCombinedNote = String(d.notes || '').includes('[Combined into');
            console.log(`Number: ${d.dispatchNumber}`);
            console.log(`  ID: ${d._id}`);
            console.log(`  Status: ${d.status}`);
            console.log(`  RefType: ${d.referenceType}`);
            console.log(`  Notes: "${d.notes || ''}"`);
            console.log(`  hasCombinedNote: ${hasCombinedNote}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
