#!/usr/bin/env node
/**
 * MIGRATION: Set stockReceivedAt for existing RECEIVED dispatches
 * 
 * SAFE: Only sets metadata field — zero stock changes.
 * 
 * For each RECEIVED dispatch without stockReceivedAt:
 *   → stockReceivedAt = receivedAt  (if present)
 *   → stockReceivedAt = updatedAt   (fallback for 2 dispatches missing receivedAt)
 *   → receiptToken    = "MIGRATED-{dispatchNumber}"
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

require('../src/models/warehouse.model');
require('../src/models/store.model');
const Dispatch = require('../src/models/dispatch.model');
const StoreInventory = require('../src/models/storeInventory.model');
const Store = mongoose.model('Store');

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');
    console.log(DRY_RUN ? '🔍 DRY RUN — no changes\n' : '⚡ LIVE — applying migration\n');

    // Stock snapshot BEFORE (to verify nothing changes)
    const beforeSnapshot = {};
    const Store_ = mongoose.model('Store');
    const stores = await Store_.find({}).select('name _id').lean();
    for (const s of stores) {
        const [agg] = await StoreInventory.aggregate([
            { $match: { storeId: s._id } },
            { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
        ]);
        beforeSnapshot[String(s._id)] = { name: s.name, stock: agg?.total || 0 };
    }

    // Find dispatches that need migration
    const toMigrate = await Dispatch.find({
        status: 'RECEIVED',
        stockReceivedAt: null
    }).lean();

    console.log(`Dispatches needing migration: ${toMigrate.length}\n`);

    const results = [];
    for (const d of toMigrate) {
        const timestamp = d.receivedAt || d.updatedAt || d.createdAt || new Date();
        const receiptToken = `MIGRATED-${d.dispatchNumber}`;
        const source = d.receivedAt ? 'receivedAt' : d.updatedAt ? 'updatedAt (fallback)' : 'createdAt (final fallback)';

        results.push({
            dispatch: d.dispatchNumber,
            timestamp: new Date(timestamp).toLocaleString('en-IN'),
            source,
            receiptToken
        });

        console.log(`  ${d.dispatchNumber.padEnd(16)} | ${new Date(timestamp).toLocaleDateString('en-IN').padEnd(12)} | source: ${source}`);

        if (!DRY_RUN) {
            await Dispatch.updateOne(
                { _id: d._id, stockReceivedAt: null }, // extra safety — won't overwrite if already set
                { $set: { stockReceivedAt: timestamp, receiptToken } }
            );
        }
    }

    if (DRY_RUN) {
        console.log('\n🔍 DRY RUN complete. Run without --dry-run to apply.');
        await mongoose.disconnect();
        return;
    }

    // Verify no dispatch was double-migrated
    const afterMigrate = await Dispatch.countDocuments({
        status: 'RECEIVED',
        stockReceivedAt: null
    });
    console.log(`\n✅ Migration done. Remaining without stockReceivedAt: ${afterMigrate}`);

    // Verify stock counts UNCHANGED
    console.log('\n📦 Stock snapshot AFTER migration (must match before):');
    let allMatch = true;
    for (const s of stores) {
        const [agg] = await StoreInventory.aggregate([
            { $match: { storeId: s._id } },
            { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
        ]);
        const afterStock = agg?.total || 0;
        const beforeStock = beforeSnapshot[String(s._id)]?.stock || 0;
        const match = afterStock === beforeStock;
        if (!match) allMatch = false;
        if (beforeStock > 0 || afterStock > 0) {
            console.log(`  ${s.name.substring(0, 45).padEnd(46)}: ${beforeStock} → ${afterStock} ${match ? '✅' : '❌ MISMATCH!'}`);
        }
    }

    if (allMatch) {
        console.log('\n✅ ALL STORE STOCKS UNCHANGED — Migration is 100% safe!');
    } else {
        console.log('\n❌ STOCK MISMATCH DETECTED — Investigate immediately!');
        process.exit(1);
    }

    await mongoose.disconnect();
}

main().catch(err => {
    console.error('❌', err.message);
    process.exit(1);
});
