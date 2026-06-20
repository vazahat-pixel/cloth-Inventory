const mongoose = require('mongoose');
require('dotenv').config();

const Dispatch = require('../src/models/dispatch.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const allDispatches = await Dispatch.find({});
        console.log(`Total dispatches in DB: ${allDispatches.length}`);
        
        const matching = await Dispatch.find({ dispatchNumber: /DSP-00042/i });
        console.log(`Found ${matching.length} matching DSP-00042:`);
        matching.forEach(d => {
            console.log(`ID: ${d._id}, Number: ${d.dispatchNumber}, status: ${d.status}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
