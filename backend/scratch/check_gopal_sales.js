const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Sale = require('../src/models/sale.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("=== AUDITING GOPAL SALES ===");
        
        const dbGopal = await Sale.findOne({ saleNumber: 'SAH-0027' }).lean();
        if (dbGopal) {
            console.log("DB Gopal Sale (SAH-0027):", JSON.stringify(dbGopal, null, 2));
        } else {
            console.log("SAH-0027 not found in DB.");
        }

        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            $or: [
                { "details.body.customerName": /gopal/i },
                { "details.body.customerName": /Gopal/i }
            ]
        }).lean();

        console.log(`Found ${logs.length} Gopal logs in SystemLog globally:`);
        logs.forEach(l => {
            console.log(`Log ID: ${l._id} | Time: ${l.createdAt.toISOString()} | Store: ${l.details?.body?.storeId} | Date: ${l.details?.body?.date} | Total: ${l.details?.body?.grandTotal} | Products: ${JSON.stringify(l.details?.body?.products)}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
