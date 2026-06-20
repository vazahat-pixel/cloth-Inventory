const mongoose = require('mongoose');
require('dotenv').config();

const Dispatch = require('../src/models/dispatch.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const dispatches = await Dispatch.find({}).sort({ createdAt: -1 });
        console.log('--- ALL DISPATCHES ---');
        dispatches.forEach(d => {
            console.log(`ID: ${d._id}, Number: ${d.dispatchNumber}, Status: ${d.status}, RefType: ${d.referenceType}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
