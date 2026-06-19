require('dotenv').config();
const mongoose = require('mongoose');

// Register schemas
require('../src/models/warehouse.model');
require('../src/models/store.model');
const Dispatch = require('../src/models/dispatch.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Find all master dispatches starting with DSP-
    const masterDispatches = await Dispatch.find({
        dispatchNumber: /^DSP-/i,
        notes: /Combined dispatch of dispatches/i,
        status: 'RECEIVED'
    }).populate('destinationStoreId').lean();

    console.log(`Found ${masterDispatches.length} RECEIVED master dispatches.`);

    for (const master of masterDispatches) {
        console.log(`\n========================================`);
        console.log(`Master Dispatch: ${master.dispatchNumber} (ID: ${master._id})`);
        console.log(`Store: ${master.destinationStoreId?.name}`);
        console.log(`Master Date: ${master.createdAt}`);
        console.log(`Master Status: ${master.status}`);
        
        // Extract child dispatch numbers from the notes
        // e.g. "Combined dispatch of dispatches: SCH-2026-00022, SCH-2026-00021"
        const notes = master.notes || '';
        const match = notes.match(/dispatches:\s*(.*)/i);
        if (match) {
            const childNums = match[1].split(',').map(s => s.trim());
            console.log(`Linked children: ${JSON.stringify(childNums)}`);
            
            for (const num of childNums) {
                const child = await Dispatch.findOne({ dispatchNumber: num }).lean();
                if (child) {
                    console.log(`  - Child No: ${child.dispatchNumber} | Status: ${child.status} | CreatedAt: ${child.createdAt} | ReceivedAt: ${child.receivedAt}`);
                } else {
                    console.log(`  - Child No: ${num} | NOT FOUND in database!`);
                }
            }
        } else {
            console.log('No child dispatch numbers found in notes');
        }
    }

    await mongoose.disconnect();
}

run().catch(console.error);
