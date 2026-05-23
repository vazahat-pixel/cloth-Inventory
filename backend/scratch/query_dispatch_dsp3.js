const mongoose = require('mongoose');
const mongoURI = 'mongodb://wazahatqureshi4_db_user:pKUv0rnI1Fv28A8w@ac-g6dgyg7-shard-00-00.nmyzy1e.mongodb.net:27017,ac-g6dgyg7-shard-00-01.nmyzy1e.mongodb.net:27017,ac-g6dgyg7-shard-00-02.nmyzy1e.mongodb.net:27017/cloth-inventory?ssl=true&authSource=admin&replicaSet=atlas-11u2xh-shard-0&retryWrites=true&w=majority';

require('../src/models/dispatch.model');

async function run() {
    try {
        await mongoose.connect(mongoURI);
        const Dispatch = mongoose.model('Dispatch');
        const dsp = await Dispatch.findOne({ dispatchNumber: 'DSP-00003' }).lean();
        
        const counts = {};
        dsp.items.forEach((item, idx) => {
            const key = `taxPercentage: ${item.taxPercentage}`;
            counts[key] = (counts[key] || 0) + 1;
            if (item.taxPercentage !== 0) {
                console.log(`Item [${idx}] barcode: ${item.barcode}, taxPercentage: ${item.taxPercentage}, rate: ${item.rate}`);
            }
        });
        console.log("Counts:", counts);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
