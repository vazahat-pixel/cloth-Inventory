const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const StockMovement = require('../src/models/stockMovement.model');

async function checkMovements() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const stats = await StockMovement.aggregate([
            {
                $group: {
                    _id: "$type",
                    totalQty: { $sum: "$qty" },
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('Stock Movements by Type:', stats);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkMovements();
