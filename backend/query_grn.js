require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const GRN = require('./src/models/grn.model');
        const grns = await GRN.find({ isDeleted: false }).select('grnNumber status');
        console.log(`Total GRNs in DB: ${grns.length}`);
        grns.forEach(g => console.log(g.grnNumber));
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

run();
