const mongoose = require('mongoose');
require('dotenv').config();

const WarehouseInventory = require('./src/models/warehouseInventory.model');
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

    const variantStock = new Map();
    for (const mov of whMovementsIn) {
        const id = mov._id.toString();
        variantStock.set(id, (variantStock.get(id) || 0) + mov.totalIn);
    }
    for (const mov of whMovementsOut) {
        const id = mov._id.toString();
        variantStock.set(id, (variantStock.get(id) || 0) - Math.abs(mov.totalOut));
    }

    const whInventories = await WarehouseInventory.find();
    
    const corrections = [];
    let totalDifference = 0;

    for (const inv of whInventories) {
        const vid = inv.variantId ? inv.variantId.toString() : null;
        if (!vid) continue;
        const calculated = variantStock.get(vid) || 0;
        
        if (inv.quantity !== calculated) {
            corrections.push({
                variantId: vid,
                warehouseId: inv.warehouseId,
                currentQty: inv.quantity,
                calculatedQty: calculated,
                difference: inv.quantity - calculated
            });
            totalDifference += (inv.quantity - calculated);
        }
        
        // Remove from variantStock so we can find variants that are missing from WarehouseInventory
        variantStock.delete(vid);
    }
    
    for (const [vid, qty] of variantStock.entries()) {
        if (qty !== 0) {
            corrections.push({
                variantId: vid,
                warehouseId: 'missing',
                currentQty: 0,
                calculatedQty: qty,
                difference: 0 - qty
            });
            totalDifference += (0 - qty);
        }
    }

    console.log(`Found ${corrections.length} variants with discrepancies.`);
    console.log(`Total difference (Current - Calculated): ${totalDifference}`);
    
    const fs = require('fs');
    fs.writeFileSync('corrections.json', JSON.stringify(corrections, null, 2));
    
    // Also missing dispatches from StockMovement
    const Dispatch = require('./src/models/dispatch.model');
    const dispatches = await Dispatch.find({ status: { $in: ['DISPATCHED', 'RECEIVED'] } });
    let totalQtyToDeduct = 0;

    for (const disp of dispatches) {
        const movement = await StockMovement.findOne({
            referenceId: disp._id,
            referenceType: 'Dispatch',
            fromLocation: disp.sourceWarehouseId
        });
        if (!movement) {
            for (const item of disp.items) {
                totalQtyToDeduct += item.qty;
            }
        }
    }

    console.log(`Total Dispatch Qty missing from BOTH StockMovement and WarehouseInventory: ${totalQtyToDeduct}`);
    
    process.exit(0);
}
run();
