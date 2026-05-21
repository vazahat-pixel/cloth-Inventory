const mongoose = require('mongoose');
require('dotenv').config();

const WarehouseInventory = require('./src/models/warehouseInventory.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const res = await WarehouseInventory.aggregate([
        { $group: { _id: null, totalDamaged: { $sum: '$damagedQuantity' }, totalReserved: { $sum: '$reservedQuantity' } } }
    ]);
    console.log('Total Damaged:', res[0]?.totalDamaged);
    console.log('Total Reserved:', res[0]?.totalReserved);
    process.exit(0);
}
run();
