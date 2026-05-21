const mongoose = require('mongoose');
require('dotenv').config();

const WarehouseInventory = require('./src/models/warehouseInventory.model');
const StockMovement = require('./src/models/stockMovement.model');
const StockLedger = require('./src/models/stockLedger.model');
const Item = require('./src/models/item.model');
const Dispatch = require('./src/models/dispatch.model');
const StoreInventory = require('./src/models/storeInventory.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log("Fetching movements...");
        const whMovementsIn = await StockMovement.aggregate([
            { $match: { toLocation: { $exists: true } } },
            { $lookup: { from: 'warehouses', localField: 'toLocation', foreignField: '_id', as: 'wh' } },
            { $match: { 'wh.0': { $exists: true } } },
            { $group: { _id: { variantId: '$variantId', warehouseId: '$toLocation' }, totalIn: { $sum: '$qty' } } }
        ]).session(session);
        
        const whMovementsOut = await StockMovement.aggregate([
            { $match: { fromLocation: { $exists: true } } },
            { $lookup: { from: 'warehouses', localField: 'fromLocation', foreignField: '_id', as: 'wh' } },
            { $match: { 'wh.0': { $exists: true } } },
            { $group: { _id: { variantId: '$variantId', warehouseId: '$fromLocation' }, totalOut: { $sum: '$qty' } } }
        ]).session(session);

        const variantStock = new Map();
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
        
        const missingMovements = [];
        for (const disp of dispatches) {
            const movement = await StockMovement.findOne({
                referenceId: disp._id,
                referenceType: 'Dispatch',
                fromLocation: disp.sourceWarehouseId
            }).session(session);
            
            if (!movement) {
                for (const item of disp.items) {
                    const key = `${disp.sourceWarehouseId}_${item.variantId}`;
                    variantStock.set(key, (variantStock.get(key) || 0) - item.qty);
                    
                    missingMovements.push({
                        variantId: item.variantId,
                        qty: -item.qty,
                        type: 'TRANSFER',
                        referenceId: disp._id,
                        referenceType: 'Dispatch',
                        fromLocation: disp.sourceWarehouseId,
                        toLocation: disp.destinationStoreId,
                        performedBy: disp.createdBy
                    });
                }
            }
        }
        
        if (missingMovements.length > 0) {
            await StockMovement.insertMany(missingMovements, { session });
            console.log(`Created ${missingMovements.length} missing StockMovements for past dispatches.`);
        }

        console.log("Applying corrected stock to WarehouseInventory...");
        let totalCalculated = 0;
        
        await WarehouseInventory.deleteMany({}, { session });

        const items = await Item.find().session(session);
        const itemMap = new Map();
        const variantItemMap = new Map();
        
        for (const it of items) {
            itemMap.set(it._id.toString(), it);
            for (const sz of (it.sizes || [])) {
                variantItemMap.set(sz._id.toString(), { item: it, variant: sz });
            }
        }

        const newInventories = [];
        for (const [key, qty] of variantStock.entries()) {
            if (qty > 0) {
                const [warehouseId, variantId] = key.split('_');
                const vData = variantItemMap.get(variantId);
                if (!vData) continue;
                
                newInventories.push({
                    warehouseId,
                    variantId,
                    itemId: vData.item._id,
                    barcode: vData.variant.sku || vData.variant.barcode || vData.item.itemCode,
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
            source: 'ADJUSTMENT',
            referenceId: new mongoose.Types.ObjectId(),
            locationId: inv.warehouseId,
            locationType: 'WAREHOUSE',
            batchNo: 'DEFAULT'
        }));
        
        if (ledgerEntries.length > 0) {
            await StockLedger.insertMany(ledgerEntries, { session });
        }

        console.log("Syncing Item Master stock...");
        const storeStockGroups = await StoreInventory.aggregate([
            { $group: { _id: '$variantId', total: { $sum: '$quantityAvailable' } } }
        ]).session(session);
        
        const storeStockMap = new Map();
        for (const sg of storeStockGroups) {
            storeStockMap.set(String(sg._id), sg.total);
        }

        let updatedItemsCount = 0;
        for (const item of items) {
            let updated = false;
            for (const sz of (item.sizes || [])) {
                const storeQty = storeStockMap.get(String(sz._id)) || 0;
                
                let whQty = 0;
                const whKey = String(sz._id);
                for (const inv of newInventories) {
                    if (inv.variantId === whKey) whQty += inv.quantity;
                }
                
                const newSizeStock = storeQty + whQty;
                if (sz.stock !== newSizeStock) {
                    sz.stock = newSizeStock;
                    updated = true;
                }
            }
            if (updated) {
                await item.save({ session });
                updatedItemsCount++;
            }
        }
        console.log(`Updated Item master totals for ${updatedItemsCount} items.`);

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
