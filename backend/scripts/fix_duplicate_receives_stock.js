#!/usr/bin/env node
/**
 * Fix duplicate stock receipts caused by receiving both master dispatches and child dispatches.
 * Removes duplicate store stock, restores warehouse stock, and logs audit corrections.
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
const stockService = require('../src/services/stock.service');
const { withTransaction } = require('../src/services/transaction.service');

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
    console.log(`Using admin userId for audit: ${userId}`);

    // Find all master dispatches that are RECEIVED and combine child dispatches
    const masterDispatches = await Dispatch.find({
        dispatchNumber: /^DSP-/i,
        notes: /Combined dispatch of dispatches/i,
        status: 'RECEIVED'
    }).populate('destinationStoreId').lean();

    console.log(`Found ${masterDispatches.length} RECEIVED master dispatches to evaluate.`);

    for (const master of masterDispatches) {
        console.log(`\nEvaluating master dispatch ${master.dispatchNumber} to store ${master.destinationStoreId?.name}...`);
        
        const notes = master.notes || '';
        const match = notes.match(/dispatches:\s*(.*)/i);
        if (!match) {
            console.log(`  - No child dispatches listed in notes. Skipping.`);
            continue;
        }

        const childNums = match[1].split(',').map(s => s.trim());
        let allChildrenReceived = true;
        const children = [];

        for (const num of childNums) {
            const child = await Dispatch.findOne({ dispatchNumber: num }).lean();
            if (!child) {
                allChildrenReceived = false;
                console.log(`  - Child ${num} NOT FOUND. Skipping master correction.`);
                break;
            }
            if (child.status !== 'RECEIVED') {
                allChildrenReceived = false;
                console.log(`  - Child ${num} is in status ${child.status} (not RECEIVED). Skipping.`);
                break;
            }
            children.push(child);
        }

        if (!allChildrenReceived) {
            console.log(`  - Some child dispatches are not received. Master is not a duplicate receive. Skipping.`);
            continue;
        }

        console.log(`  - All child dispatches are RECEIVED. Preparing to reverse master duplicate stock...`);

        // Execute stock reversal in transaction
        await withTransaction(async (session) => {
            for (const item of master.items) {
                // Resolve identifiers
                let itmId = item.itemId;
                let bcode = item.barcode;
                if (!itmId || !bcode) {
                    const parent = await Item.findOne({ "sizes._id": String(item.variantId) }).session(session);
                    if (parent) {
                        itmId = itmId || parent._id;
                        const variant = (parent.sizes || []).find(sz => String(sz._id) === String(item.variantId));
                        bcode = bcode || (variant ? (variant.sku || variant.barcode || parent.itemCode) : 'UNKNOWN');
                    } else {
                        itmId = itmId || item.variantId;
                        bcode = bcode || 'LEGACY';
                    }
                }

                // 1. Remove duplicate stock from destination store
                await stockService.removeStock({
                    itemId: itmId,
                    barcode: bcode,
                    variantId: item.variantId,
                    locationId: master.destinationStoreId._id,
                    locationType: 'STORE',
                    qty: item.qty,
                    type: 'ADJUSTMENT',
                    referenceId: master._id,
                    referenceType: 'Dispatch',
                    performedBy: userId,
                    session
                });

                // 2. Add back duplicate stock to source warehouse
                await stockService.addStock({
                    itemId: itmId,
                    barcode: bcode,
                    variantId: item.variantId,
                    locationId: master.sourceWarehouseId,
                    locationType: 'WAREHOUSE',
                    qty: item.qty,
                    type: 'ADJUSTMENT',
                    referenceId: master._id,
                    referenceType: 'Dispatch',
                    performedBy: userId,
                    session
                });
            }

            // 3. Mark master dispatch as CANCELLED to prevent it from double adding stock, and add explanation notes
            const updatedNotes = `${notes} | System Correction: Duplicate stock receipt reversed on ${new Date().toLocaleDateString('en-IN')} to prevent double-inward with child dispatches.`.trim();
            await Dispatch.updateOne(
                { _id: master._id },
                {
                    $set: {
                        status: 'CANCELLED',
                        notes: updatedNotes
                    }
                },
                { session }
            );

            console.log(`  ✓ Successfully reversed duplicate stock for ${master.dispatchNumber} (Status updated to CANCELLED)`);
        });
    }

    // Run item stock master totals sync to recalculate item catalog stock
    console.log('\n--- Syncing Item Master Stock Totals ---');
    const items = await Item.find();
    let updatedItemsCount = 0;
    for (const item of items) {
        let updated = false;
        for (const sz of (item.sizes || [])) {
            // Find store stock + warehouse stock
            const storeStock = await require('../src/models/storeInventory.model').aggregate([
                { $match: { variantId: String(sz._id) } },
                { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
            ]);
            
            const warehouseStock = await require('../src/models/warehouseInventory.model').aggregate([
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
    console.log('\nStock correction completed successfully!');
}

main().catch(err => {
    console.error('Failed to correct duplicate dispatches:', err);
    process.exit(1);
});
