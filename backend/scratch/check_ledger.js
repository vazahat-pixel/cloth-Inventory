const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const StockLedger = require('../src/models/stockLedger.model');

async function checkLedger() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Sum of IN - sum of OUT
        const stats = await StockLedger.aggregate([
            {
                $group: {
                    _id: null,
                    totalIn: { $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$quantity", 0] } },
                    totalOut: { $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$quantity", 0] } }
                }
            }
        ]);

        if (stats.length > 0) {
            console.log('Total IN:', stats[0].totalIn);
            console.log('Total OUT:', stats[0].totalOut);
            console.log('Net Stock (IN - OUT):', stats[0].totalIn - stats[0].totalOut);
        } else {
            console.log('No ledger entries found');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkLedger();
