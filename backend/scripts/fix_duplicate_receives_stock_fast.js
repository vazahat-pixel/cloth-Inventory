#!/usr/bin/env node
/**
 * Fast bulk-write duplicate stock receipt correction script.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Register schemas
require('../src/models/warehouse.model');
require('../src/models/store.model');
const Dispatch = require('../src/models/dispatch.model');
const User = require('../src/models/user.model');
const Item = require('../src/models/item.model');
const StoreInventory = require('../src/models/storeInventory.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');
const StockLedger = require('../src/models/stockLedger.model');
const StockMovement = require('../src/models/stockMovement.model');

async function getAdminUserId() {
    const admin = await User.findOne({
        $or: [
            { role: 'admin' },
            { role: 'ADMIN' },
            { role: 'superadmin' },
            { role: 'SUPER_ADMIN' },
        ],
        isActive: { $ne: false },
    }).select('_id').lean();
    if (admin) return admin._id;
    const any = await User.findOne({ isActive: { $ne: false } }).select('_id').lean();
    if (!any) throw new Error('No active user found for audits');
    return any._id;
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database!');
    const userId = await getAdminUserId();
    console.log(`Using admin userId: ${userId}`);

    // Find master dispatches
    const masterDispatches = await Dispatch.find({
        dispatchNumber: /^DSP-/i,
        notes: /Combined dispatch of dispatches/i,
        status: 'RECEIVED'
    }).populate('destinationStoreId').lean();

    console.log(`Found ${masterDispatches.length} RECEIVED master dispatches to correct.`);

    for (const master of masterDispatches) {
        console.log(`\nEvaluating master dispatch ${master.dispatchNumber}...`);
        
        const notes = master.notes || '';
        const match = notes.match(/dispatches:\s*(.*)/i);
        if (!match) {
            console.log(`  - No child dispatches. Skipping.`);
            continue;
        }

        const childNums = match[1].split(',').map(s => s.trim());
        let allChildrenReceived = true;
        const children = [];

        for (const num of childNums) {
            const child = await Dispatch.findOne({ dispatchNumber: num }).lean();
            if (!child) {
                allChildrenReceived = false;
                console.log(`  - Child ${num} not found. Skipping.`);
                break;
            }
            if (child.status !== 'RECEIVED') {
                allChildrenReceived = false;
                console.log(`  - Child ${num} is ${child.status} (not RECEIVED). Skipping.`);
                break;
            }
            children.push(child);
        }

        if (!allChildrenReceived) {
            continue;
        }

        console.log(`  - Reversing master duplicate stock using bulk operations...`);

        // 1. Gather all barcodes
        const barcodes = master.items.map(item => item.barcode).filter(Boolean);

        // 2. Fetch current inventory levels
        const currentStoreInv = await StoreInventory.find({
            storeId: master.destinationStoreId._id,
            barcode: { $in: barcodes }
        }).lean();

        const currentWhInv = await WarehouseInventory.find({
            warehouseId: master.sourceWarehouseId,
            barcode: { $in: barcodes }
        }).lean();

        const storeInvMap = new Map(currentStoreInv.map(inv => [inv.barcode, inv]));
        const whInvMap = new Map(currentWhInv.map(inv => [inv.barcode, inv]));

        // 3. Prepare operations
        const storeOps = [];
        const whOps = [];
        const ledgerEntries = [];
        const movementEntries = [];

        const referenceId = master._id.toString();

        for (const item of master.items) {
            const barcode = item.barcode;
            const qty = item.qty;

            const currentStore = storeInvMap.get(barcode);
            const currentWh = whInvMap.get(barcode);

            const storeQtyBefore = currentStore ? (currentStore.quantityAvailable || 0) : 0;
            const whQtyBefore = currentWh ? (currentWh.quantity || 0) : 0;

            const storeQtyAfter = storeQtyBefore - qty;
            const whQtyAfter = whQtyBefore + qty;

            // Store Update
            storeOps.push({
                updateOne: {
                    filter: { storeId: master.destinationStoreId._id, barcode },
                    update: {
                        $inc: { quantity: -qty, quantityAvailable: -qty },
                        $set: { lastUpdated: new Date() }
                    }
                }
            });

            // Warehouse Update
            whOps.push({
                updateOne: {
                    filter: { warehouseId: master.sourceWarehouseId, barcode },
                    update: {
                        $inc: { quantity: qty },
                        $set: { lastUpdated: new Date() }
                    }
                }
            });

            // Store Ledger correction
            ledgerEntries.push({
                itemId: item.itemId,
                barcode,
                type: 'OUT',
                quantity: qty,
                source: 'ADJUSTMENT',
                referenceId,
                balanceAfter: storeQtyAfter,
                userId,
                locationId: master.destinationStoreId._id,
                locationType: 'STORE',
                batchNo: 'DEFAULT'
            });

            // Warehouse Ledger correction
            ledgerEntries.push({
                itemId: item.itemId,
                barcode,
                type: 'IN',
                quantity: qty,
                source: 'ADJUSTMENT',
                referenceId,
                balanceAfter: whQtyAfter,
                userId,
                locationId: master.sourceWarehouseId,
                locationType: 'WAREHOUSE',
                batchNo: 'DEFAULT'
            });

            // Movement logs
            movementEntries.push({
                variantId: item.variantId,
                qty: -qty,
                type: 'ADJUSTMENT',
                referenceId: master._id,
                referenceType: 'Dispatch',
                fromLocation: master.destinationStoreId._id,
                performedBy: userId
            });

            movementEntries.push({
                variantId: item.variantId,
                qty: qty,
                type: 'ADJUSTMENT',
                referenceId: master._id,
                referenceType: 'Dispatch',
                toLocation: master.sourceWarehouseId,
                performedBy: userId
            });
        }

        // 4. Perform bulk operations
        if (storeOps.length > 0) {
            await StoreInventory.bulkWrite(storeOps);
        }
        if (whOps.length > 0) {
            await WarehouseInventory.bulkWrite(whOps);
        }
        if (ledgerEntries.length > 0) {
            await StockLedger.insertMany(ledgerEntries);
        }
        if (movementEntries.length > 0) {
            await StockMovement.insertMany(movementEntries);
        }

        // 5. Mark master as CANCELLED with explanation note
        const updatedNotes = `${notes} | System Correction: Duplicate stock receipt reversed on ${new Date().toLocaleDateString('en-IN')} to prevent double-inward with child dispatches.`.trim();
        await Dispatch.updateOne(
            { _id: master._id },
            {
                $set: {
                    status: 'CANCELLED',
                    notes: updatedNotes
                }
            }
        );

        console.log(`  ✓ Successfully corrected duplicate stock for ${master.dispatchNumber}.`);
    }

    // Run item stock master totals sync
    console.log('\n--- Syncing Item Master Stock Totals ---');
    const items = await Item.find();
    let updatedItemsCount = 0;
    for (const item of items) {
        let updated = false;
        for (const sz of (item.sizes || [])) {
            // Find store stock + warehouse stock
            const storeStock = await StoreInventory.aggregate([
                { $match: { variantId: String(sz._id) } },
                { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
            ]);
            
            const warehouseStock = await WarehouseInventory.aggregate([
                { $match: { variantId: String(sz._id) } },
                { $group: { _id: null, total: { $sum: '$quantity' } } }
            ]);
            
            const newSizeStock = (storeStock[0]?.total || 0) + (warehouseStock[0]?.total || 0);
            if (sz.stock !== newSizeStock) {
                sz.stock = newSizeStock;
                updated = true;
            }
        }
        if (updated) {
            await item.save();
            updatedItemsCount++;
        }
    }
    console.log(`✓ Synchronized item master stock totals for ${updatedItemsCount} items.`);

    await mongoose.disconnect();
    console.log('\nAll stock corrections completed successfully!');
}

main().catch(err => {
    console.error('Failed to run stock correction:', err);
    process.exit(1);
});
