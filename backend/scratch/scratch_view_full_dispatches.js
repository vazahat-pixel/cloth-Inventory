require('dotenv').config();
const mongoose = require('mongoose');

const Dispatch = require('../src/models/dispatch.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const d21 = await Dispatch.findOne({ dispatchNumber: 'SCH-2026-00021' }).lean();
    const d22 = await Dispatch.findOne({ dispatchNumber: 'SCH-2026-00022' }).lean();
    const d09 = await Dispatch.findOne({ dispatchNumber: 'DSP-00009' }).lean();

    console.log('\n=== SCH-2026-00021 ===');
    console.log(JSON.stringify(d21, null, 2));

    console.log('\n=== SCH-2026-00022 ===');
    console.log(JSON.stringify(d22, null, 2));

    console.log('\n=== DSP-00009 ===');
    console.log(JSON.stringify(d09, null, 2));

    await mongoose.disconnect();
}

run().catch(console.error);
