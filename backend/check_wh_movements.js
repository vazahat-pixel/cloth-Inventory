const mongoose = require('mongoose');
require('dotenv').config();
const WarehouseInventory = require('./src/models/warehouseInventory.model');
const StockMovement = require('./src/models/stockMovement.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const warehouseTotal = await WarehouseInventory.aggregate([
        { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    console.log('Warehouse Total Qty:', warehouseTotal[0]?.total || 0);

    const movements = await StockMovement.aggregate([
        { $match: { fromLocation: { $exists: true } } },
        { $lookup: {
            from: 'warehouses',
            localField: 'fromLocation',
            foreignField: '_id',
            as: 'warehouse'
        }},
        { $match: { 'warehouse.0': { $exists: true } } },
        { $group: { _id: '$type', totalQty: { $sum: '$qty' } } }
    ]);
    console.log('Movements OUT of Warehouse by Type:', movements);

    const movementsIn = await StockMovement.aggregate([
        { $match: { toLocation: { $exists: true } } },
        { $lookup: {
            from: 'warehouses',
            localField: 'toLocation',
            foreignField: '_id',
            as: 'warehouse'
        }},
        { $match: { 'warehouse.0': { $exists: true } } },
        { $group: { _id: '$type', totalQty: { $sum: '$qty' } } }
    ]);
    console.log('Movements IN to Warehouse by Type:', movementsIn);

    process.exit(0);
}
run();
