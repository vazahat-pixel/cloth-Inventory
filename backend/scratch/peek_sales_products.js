require('dotenv').config();
const mongoose = require('mongoose');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const saleLog = await SystemLog.findOne({ action: 'POST /api/sales', 'details.body.products': { $exists: true } }).lean();
        if (saleLog) {
            console.log("Sale Log Body Products Sample:");
            console.log(JSON.stringify(saleLog.details.body.products.slice(0, 3), null, 2));
        } else {
            console.log("No sale log body with products found.");
        }
    } catch(e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
