const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const StoreInventory = require('../src/models/storeInventory.model');

async function checkAvailable() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const stats = await StoreInventory.aggregate([
            {
                $group: {
                    _id: "$storeId",
                    totalQty: { $sum: "$quantity" },
                    totalAvailable: { $sum: "$quantityAvailable" },
                    rows: { $sum: 1 }
                }
            }
        ]);

        for (const s of stats) {
            console.log(`Store: ${s._id}, Qty: ${s.totalQty}, Available: ${s.totalAvailable}, Rows: ${s.rows}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkAvailable();
