const mongoose = require('mongoose');
require('dotenv').config();

const WarehouseInventory = require('./src/models/warehouseInventory.model');
const StockMovement = require('./src/models/stockMovement.model');
const StockLedger = require('./src/models/stockLedger.model');
const Item = require('./src/models/item.model');
const Dispatch = require('./src/models/dispatch.model');

async function run() {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log("Fetching movements...");
        const whMovementsIn = await StockMovement.aggregate([
            { $match: { toLocation: { $exists: true } } },
            { $lookup: { from: 'warehouses', localField: 'toLocation', foreignField: '_id', as: 'wh' } },
            { $match: { 'wh.0': { $exists: true } } },
            { $group: { _id: { variantId: '$variantId', warehouseId: '$toLocation' }, totalIn: { $sum: '$qty' } } }
        ]);
        
        const whMovementsOut = await StockMovement.aggregate([
            { $match: { fromLocation: { $exists: true } } },
            { $lookup: { from: 'warehouses', localField: 'fromLocation', foreignField: '_id', as: 'wh' } },
            { $match: { 'wh.0': { $exists: true } } },
            { $group: { _id: { variantId: '$variantId', warehouseId: '$fromLocation' }, totalOut: { $sum: '$qty' } } }
        ]);

        const variantStock = new Map(); // key: warehouseId_variantId
        for (const mov of whMovementsIn) {
            const key = `${mov._id.warehouseId}_${mov._id.variantId}`;
            variantStock.set(key, (variantStock.get(key) || 0) + mov.totalIn);
        }
        for (const mov of whMovementsOut) {
            const key = `${mov._id.warehouseId}_${mov._id.variantId}`;
            variantStock.set(key, (variantStock.get(key) || 0) - Math.abs(mov.totalOut));
        }

        console.log("Finding missing dispatch deductions...");
        const dispatches = await Dispatch.find({ status: { $in: ['DISPATCHED', 'RECEIVED'] } }).session(session);
        for (const disp of dispatches) {
            const movement = await StockMovement.findOne({
                referenceId: disp._id,
                referenceType: 'Dispatch',
                fromLocation: disp.sourceWarehouseId
            }).session(session);
            
            if (!movement) {
                // Deduct these from our calculated stock!
                for (const item of disp.items) {
                    const key = `${disp.sourceWarehouseId}_${item.variantId}`;
                    variantStock.set(key, (variantStock.get(key) || 0) - item.qty);
                    
                    // Also create the missing StockMovement so history is correct
                    await StockMovement.create([{
                        variantId: item.variantId,
                        qty: -item.qty,
                        type: 'TRANSFER',
                        referenceId: disp._id,
                        referenceType: 'Dispatch',
                        fromLocation: disp.sourceWarehouseId,
                        toLocation: disp.destinationStoreId,
                        performedBy: disp.createdBy
                    }], { session });
                }
            }
        }

        console.log("Applying corrected stock to WarehouseInventory...");
        let totalCalculated = 0;
        
        // We will just clear all WarehouseInventory and recreate it to be perfect.
        await WarehouseInventory.deleteMany({}, { session });

        const newInventories = [];
        for (const [key, qty] of variantStock.entries()) {
            if (qty > 0) { // Only keep positive or 0 stock
                const [warehouseId, variantId] = key.split('_');
                
                // Get itemId from variantId
                const itemDoc = await Item.findOne({ "sizes._id": variantId }).session(session);
                if (!itemDoc) continue;
                const variant = itemDoc.sizes.id(variantId);
                if (!variant) continue;
                
                newInventories.push({
                    warehouseId,
                    variantId,
                    itemId: itemDoc._id,
                    barcode: variant.sku || variant.barcode || itemDoc.itemCode,
                    quantity: qty,
                    damagedQuantity: 0,
                    quantityInTransit: 0,
                    reservedQuantity: 0,
                    quantityAvailable: qty
                });
                totalCalculated += qty;
            }
        }
        
        if (newInventories.length > 0) {
            await WarehouseInventory.insertMany(newInventories, { session });
        }
        
        console.log(`New Total Warehouse Stock: ${totalCalculated}`);

        // Update StockLedger to reflect this adjustment
        // We can just wipe WAREHOUSE ledger and insert a baseline
        console.log("Resetting StockLedger for WAREHOUSE...");
        await StockLedger.deleteMany({ locationType: 'WAREHOUSE' }, { session });
        
        const ledgerEntries = newInventories.map(inv => ({
            itemId: inv.itemId,
            variantId: inv.variantId,
            barcode: inv.barcode,
            type: 'IN',
            quantity: inv.quantity,
            balanceBefore: 0,
            balanceAfter: inv.quantity,
            source: 'SYSTEM_SYNC',
            referenceId: new mongoose.Types.ObjectId(),
            locationId: inv.warehouseId,
            locationType: 'WAREHOUSE',
            batchNo: 'DEFAULT'
        }));
        
        if (ledgerEntries.length > 0) {
            await StockLedger.insertMany(ledgerEntries, { session });
        }

        console.log("Syncing Item Master stock...");
        const items = await Item.find().session(session);
        for (const item of items) {
            let totalItemStock = 0;
            let updated = false;
            for (const sz of item.sizes) {
                // Find store stock + warehouse stock
                const storeStock = await require('./src/models/storeInventory.model').aggregate([
                    { $match: { variantId: String(sz._id) } },
                    { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
                ]).session(session);
                
                const whStock = newInventories.filter(inv => inv.variantId === String(sz._id)).reduce((sum, inv) => sum + inv.quantity, 0);
                
                const newSizeStock = (storeStock[0]?.total || 0) + whStock;
                if (sz.stock !== newSizeStock) {
                    sz.stock = newSizeStock;
                    updated = true;
                }
            }
            if (updated) {
                await item.save({ session });
            }
        }

        await session.commitTransaction();
        console.log("Stock successfully synchronized!");
        process.exit(0);
    } catch (e) {
        await session.abortTransaction();
        console.error("Failed:", e);
        process.exit(1);
    } finally {
        session.endSession();
    }
}
run();
