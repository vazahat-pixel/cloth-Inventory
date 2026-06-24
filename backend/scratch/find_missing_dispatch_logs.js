const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const ids = ['6a366ad36aa096db0c8642be', '6a38d92c12517c17ad17bd51'];
        for (const id of ids) {
            console.log(`\nSearching logs for ${id}:`);
            const logs = await SystemLog.find({
                $or: [
                    { action: new RegExp(id, 'i') },
                    { 'details.body.dispatchNumber': new RegExp(id, 'i') },
                    { 'details.response.dispatchNumber': new RegExp(id, 'i') }
                ]
            }).lean();
            console.log(`Found ${logs.length} logs.`);
            logs.forEach(l => {
                console.log(`- ID: ${l._id}, Action: ${l.action}, Date: ${l.createdAt}`);
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
