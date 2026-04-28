const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const WarehouseInventory = require('../src/models/warehouseInventory.model');

async function checkReserved() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const stats = await WarehouseInventory.aggregate([
            { $group: { _id: null, totalReserved: { $sum: "$quantityInTransit" } } }
        ]);
        console.log('Warehouse Reserved/InTransit:', stats);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkReserved();
