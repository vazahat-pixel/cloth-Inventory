const mongoose = require('mongoose');
require('dotenv').config();

const WarehouseInventory = require('./src/models/warehouseInventory.model');
const StoreInventory = require('./src/models/storeInventory.model');
const StockMovement = require('./src/models/stockMovement.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Calculate correct Warehouse stock based on movements
    const whMovementsIn = await StockMovement.aggregate([
        { $match: { toLocation: { $exists: true } } },
        { $lookup: { from: 'warehouses', localField: 'toLocation', foreignField: '_id', as: 'wh' } },
        { $match: { 'wh.0': { $exists: true } } },
        { $group: { _id: '$variantId', totalIn: { $sum: '$qty' } } }
    ]);
    
    const whMovementsOut = await StockMovement.aggregate([
        { $match: { fromLocation: { $exists: true } } },
        { $lookup: { from: 'warehouses', localField: 'fromLocation', foreignField: '_id', as: 'wh' } },
        { $match: { 'wh.0': { $exists: true } } },
        { $group: { _id: '$variantId', totalOut: { $sum: '$qty' } } }
    ]);

    let calculatedWhStock = 0;
    const variantStock = new Map();

    for (const mov of whMovementsIn) {
        const id = mov._id.toString();
        variantStock.set(id, (variantStock.get(id) || 0) + mov.totalIn);
    }
    for (const mov of whMovementsOut) {
        const id = mov._id.toString();
        variantStock.set(id, (variantStock.get(id) || 0) - Math.abs(mov.totalOut)); // in case out is positive
    }
    for (const val of variantStock.values()) {
        calculatedWhStock += val;
    }
    
    console.log(`Calculated Warehouse Stock based on StockMovement: ${calculatedWhStock}`);

    // Let's also check the actual WarehouseInventory sum
    const actualWhStock = await WarehouseInventory.aggregate([
        { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    console.log(`Actual WarehouseInventory Stock: ${actualWhStock[0]?.total || 0}`);

    // If there is a missing dispatch deduction (the 504), let's subtract it from calculated?
    // Wait, if it's missing from StockMovement, then calculated won't have it either!
    // So if the 504 is missing from StockMovement, calculatedWhStock should be 106763.2 because the out movement was never recorded.
    
    // Let's see if there are any StockLedger records that were created without StockMovement
    const StockLedger = require('./src/models/stockLedger.model');
    const ledgerIn = await StockLedger.aggregate([
        { $match: { locationType: 'WAREHOUSE', type: 'IN' } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const ledgerOut = await StockLedger.aggregate([
        { $match: { locationType: 'WAREHOUSE', type: 'OUT' } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    
    const calculatedLedgerWhStock = (ledgerIn[0]?.total || 0) - (ledgerOut[0]?.total || 0);
    console.log(`Calculated Warehouse Stock based on StockLedger sum: ${calculatedLedgerWhStock}`);
    
    process.exit(0);
}
run();
