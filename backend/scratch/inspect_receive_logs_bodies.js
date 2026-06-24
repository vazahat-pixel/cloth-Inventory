const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const ids = ['6a34df8a6aa096db0c85501b', '6a366ad36aa096db0c8642be', '6a38d92c12517c17ad17bd51'];
        
        for (const id of ids) {
            const logs = await SystemLog.find({
                action: new RegExp(id, 'i')
            }).lean();

            console.log(`\n============================================`);
            console.log(`Logs for ${id}:`);
            logs.forEach(l => {
                console.log(`Log ID: ${l._id}, Action: ${l.action}, Date: ${l.createdAt}`);
                console.log(`Body:`, JSON.stringify(l.details.body, null, 2));
                if (l.details.response) {
                    console.log(`Response:`, JSON.stringify(l.details.response, null, 2));
                }
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
