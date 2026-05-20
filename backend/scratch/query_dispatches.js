const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Dispatch = require('../src/models/dispatch.model');

async function test() {
    await connectDB();
    const dispatches = await Dispatch.find({}).sort({ createdAt: -1 }).limit(10);
    console.log('Last 10 dispatches:');
    for (const d of dispatches) {
        console.log(`ID: ${d._id}, No: ${d.dispatchNumber}, Status: ${d.status}, RefType: ${d.referenceType}, Source: ${d.sourceWarehouseId}, Dest: ${d.destinationStoreId}`);
    }
    await mongoose.disconnect();
}

test().catch(console.error);
