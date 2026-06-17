#!/usr/bin/env node
/**
 * Sync all in-transit: reconcile pools + receive all DISPATCHED shipments
 * (when physical goods have already arrived at stores).
 *
 * Usage: node scripts/sync_all_in_transit.js [--dry-run]
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Dispatch = require('../src/models/dispatch.model');
const User = require('../src/models/user.model');
const zeroMismatchService = require('../src/modules/inventory/zeroMismatch.service');
const dispatchService = require('../src/modules/dispatch/dispatch.service');

const dryRun = process.argv.includes('--dry-run');

async function getAdminUserId() {
    const admin = await User.findOne({
        $or: [
            { role: 'admin' },
            { role: 'ADMIN' },
            { role: 'superadmin' },
            { role: 'SUPER_ADMIN' },
        ],
        isActive: { $ne: false },
    }).select('_id email role').lean();
    if (admin) return admin._id;
    const any = await User.findOne({ isActive: { $ne: false } }).select('_id email role').lean();
    if (!any) throw new Error('No user found for receive audit trail');
    return any._id;
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const userId = await getAdminUserId();

    const beforeDispatched = await Dispatch.find({ status: 'DISPATCHED' })
        .select('dispatchNumber destinationStoreId items')
        .lean();

    console.log(`\n=== In-Transit Full Sync ${dryRun ? '(DRY RUN)' : ''} ===`);
    console.log(`Open DISPATCHED shipments: ${beforeDispatched.length}`);

    if (dryRun) {
        beforeDispatched.forEach((d) => {
            const qty = (d.items || []).reduce((s, it) => s + Number(it.qty || 0), 0);
            console.log(`  ${d.dispatchNumber} → store ${d.destinationStoreId} (${qty} pcs)`);
        });
        await mongoose.disconnect();
        return;
    }

    console.log('\n[1/3] Reconciling in-transit pools (all stores)...');
    const reconcile1 = await zeroMismatchService.reconcileInTransitPools({ userId });
    console.log(`  Adjusted ${reconcile1.adjustedLines} pool line(s)`);

    console.log('\n[2/3] Receiving all DISPATCHED shipments...');
    const received = [];
    const failed = [];

    for (const dsp of beforeDispatched) {
        try {
            await dispatchService.receiveDispatch(dsp._id, userId);
            received.push(dsp.dispatchNumber);
            console.log(`  ✓ ${dsp.dispatchNumber}`);
        } catch (err) {
            try {
                await zeroMismatchService.reconcileInTransitPools({
                    storeId: dsp.destinationStoreId,
                    userId,
                });
                await dispatchService.receiveDispatch(dsp._id, userId);
                received.push(dsp.dispatchNumber);
                console.log(`  ✓ ${dsp.dispatchNumber} (after store pool sync)`);
            } catch (retryErr) {
                failed.push({
                    dispatchNumber: dsp.dispatchNumber,
                    error: retryErr.message,
                });
                console.error(`  ✗ ${dsp.dispatchNumber}: ${retryErr.message}`);
            }
        }
    }

    console.log('\n[3/3] Final pool reconcile (clear orphan in-transit)...');
    const reconcile2 = await zeroMismatchService.reconcileInTransitPools({ userId });
    console.log(`  Adjusted ${reconcile2.adjustedLines} pool line(s)`);

    console.log('\n[Verify] Running zero-mismatch check...');
    const report = await zeroMismatchService.verify();
    const dispatchMismatches = (report.mismatches || []).filter(
        (m) => String(m.type).includes('TRANSIT') || m.type === 'DISPATCH_IN_TRANSIT_MISMATCH',
    );

    console.log('\n=== Summary ===');
    console.log(`Received: ${received.length}/${beforeDispatched.length}`);
    console.log(`Failed: ${failed.length}`);
    if (failed.length) {
        failed.forEach((f) => console.log(`  - ${f.dispatchNumber}: ${f.error}`));
    }
    console.log(`Dispatch/in-transit mismatches remaining: ${dispatchMismatches.length}`);
    console.log(`Total mismatches remaining: ${report.summary.mismatchCount}`);
    console.log(report.status);

    await mongoose.disconnect();
    process.exit(failed.length > 0 || dispatchMismatches.length > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
