const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Dispatch = require('../src/models/dispatch.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const dispatches = await Dispatch.find({
            destinationStoreId: '69ecb1d9f04d7249bd11adf4'
        }).lean();

        console.log(`GTB store dispatches in DB: ${dispatches.length}`);
        dispatches.forEach(d => {
            const qty = d.items.reduce((sum, i) => sum + i.qty, 0);
            console.log(`- ID: ${d._id}, Number: ${d.dispatchNumber}, Status: ${d.status}, Qty: ${qty}, Date: ${d.dispatchDate || d.createdAt}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
