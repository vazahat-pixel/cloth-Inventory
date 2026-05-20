const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Dispatch = require('../src/models/dispatch.model');

async function test() {
    await connectDB();
    
    // Reset the two original dispatches to PENDING status
    const ids = ['6a0c3bd0a95872c0bfc2e6e2', '6a0c3e71a95872c0bfc2e806'];
    const res = await Dispatch.updateMany(
        { _id: { $in: ids } },
        { 
            $set: { 
                status: 'PENDING',
                referenceId: null,
                referenceType: null
            } 
        }
    );
    console.log('Reset original dispatches:', res);

    // Delete the combined dispatch records to avoid duplicates
    const del = await Dispatch.deleteMany({ dispatchNumber: 'DSP-00002' });
    console.log('Deleted combined dispatch:', del);
    
    await mongoose.disconnect();
}

test().catch(console.error);
