const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Dispatch = require('../src/models/dispatch.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const dispatch = await Dispatch.findOne({ dispatchNumber: 'SCH-LBQUMQ' }).lean();
        console.log("SCH-LBQUMQ Details:");
        if (dispatch) {
            console.log("Total Qty:", dispatch.items.reduce((sum, i) => sum + i.qty, 0));
            console.log("Items Count:", dispatch.items.length);
            
            // Print items
            dispatch.items.forEach((item, idx) => {
                console.log(`- Item ${idx+1}: Barcode: ${item.barcode} | Qty: ${item.qty} | Rate: ${item.rate}`);
            });
        } else {
            console.log("SCH-LBQUMQ not found in DB!");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
