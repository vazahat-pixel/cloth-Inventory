const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Dispatch = require('../src/models/dispatch.model');
const dispatchService = require('../src/modules/dispatch/dispatch.service');

async function test() {
    await connectDB();
    console.log('--- SCANNING FOR ELIGIBLE DRAFT DISPATCHES ---');
    
    // Find dispatches that are PENDING or PACKED
    const eligible = await Dispatch.find({ status: { $in: ['PENDING', 'PACKED'] } });
    console.log(`Found ${eligible.length} dispatches in PENDING or PACKED status.`);
    
    if (eligible.length < 2) {
        console.warn('⚠️  Not enough draft dispatches found in the database to run a combine test.');
        console.log('Exiting test safely.');
        process.exit(0);
    }
    
    // Group by source and destination to find a pair we can combine
    const groups = {};
    for (const d of eligible) {
        const key = `${d.sourceWarehouseId.toString()}_${d.destinationStoreId.toString()}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(d);
    }
    
    let testGroup = null;
    for (const key in groups) {
        if (groups[key].length >= 2) {
            testGroup = groups[key];
            break;
        }
    }
    
    if (!testGroup) {
        console.warn('⚠️  Found draft dispatches, but no two drafts share the same source and destination store.');
        console.log('Exiting test safely.');
        process.exit(0);
    }
    
    const dispatchIds = testGroup.slice(0, 2).map(d => d._id.toString());
    console.log(`Found eligible pair for combination!`);
    console.log(`Dispatch IDs to combine: ${dispatchIds.join(', ')}`);
    console.log(`Source: ${testGroup[0].sourceWarehouseId}`);
    console.log(`Destination: ${testGroup[0].destinationStoreId}`);
    
    console.log('\n--- STARTING CONSOLIDATED DISPATCH PERFORMANCE TEST ---');
    const start = Date.now();
    try {
        const combined = await dispatchService.combineAndConfirmDispatch({
            dispatchIds,
            notes: 'Automated verification test of combined dispatch performance.',
            date: new Date().toISOString().slice(0, 10),
            vehicleNumber: 'TEST-1234',
            driverName: 'Test Driver'
        }, '65c26b9a8972fc00201dcd12'); // mock userId
        
        const duration = Date.now() - start;
        console.log('✅ COMBINED DISPATCH COMPLETED SUCCESSFULLY!');
        console.log(`⏱️  Execution Time: ${duration}ms`);
        console.log(`Combined Dispatch Number: ${combined.dispatchNumber}`);
        console.log(`Reference Billing Doc Type: ${combined.referenceType}`);
        console.log(`Reference Billing Doc ID: ${combined.referenceId}`);
    } catch (err) {
        console.error('❌ Consolidated dispatch failed during execution:', err);
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
}

test().catch(err => {
    console.error('Test error:', err);
    mongoose.disconnect();
});
