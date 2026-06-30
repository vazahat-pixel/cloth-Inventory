#!/usr/bin/env node
/**
 * Adjust store closing to target with audit trail (barcode-row direct update).
 * Usage: node scripts/adjust_store_closing.js <storeId> <targetClosing> [storeLabel]
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const StoreInventory = require('../src/models/storeInventory.model');
const StockMovement = require('../src/models/stockMovement.model');
const StockLedger = require('../src/models/stockLedger.model');
const User = require('../src/models/user.model');
const { withTransaction } = require('../src/services/transaction.service');

const storeIdArg = process.argv[2];
const targetClosing = Number(process.argv[3]);
const storeLabel = process.argv[4] || 'STORE';

if (!storeIdArg || !Number.isFinite(targetClosing)) {
  console.error('Usage: node adjust_store_closing.js <storeId> <targetClosing> [label]');
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const storeId = new mongoose.Types.ObjectId(storeIdArg);
  const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
  const userId = admin?._id || new mongoose.Types.ObjectId();

  const [beforeAgg] = await StoreInventory.aggregate([
    { $match: { storeId } },
    { $group: { _id: null, total: { $sum: '$quantityAvailable' } } },
  ]);
  const beforeTotal = beforeAgg?.total || 0;
  const delta = beforeTotal - targetClosing;

  if (delta === 0) {
    console.log(JSON.stringify({ success: true, message: 'Already at target', beforeTotal, targetClosing }, null, 2));
    await mongoose.disconnect();
    return;
  }

  const rows = await StoreInventory.find({
    storeId,
    quantityAvailable: delta > 0 ? { $gt: 0 } : { $gte: 0 },
  })
    .sort({ quantityAvailable: delta > 0 ? -1 : 1 })
    .lean();

  const auditReferenceId = new mongoose.Types.ObjectId();
  const adjustments = [];
  let remaining = Math.abs(delta);

  await withTransaction(async (session) => {
    if (delta > 0) {
      for (const row of rows) {
        if (remaining <= 0) break;
        const take = Math.min(row.quantityAvailable || 0, remaining);
        if (take <= 0) continue;

        const liveInv = await StoreInventory.findById(row._id).session(session);
        if (!liveInv || liveInv.quantityAvailable < take) {
          throw new Error(`Insufficient on ${row.barcode}`);
        }

        liveInv.quantity -= take;
        liveInv.quantityAvailable -= take;
        liveInv.lastUpdated = Date.now();
        await liveInv.save({ session });

        await StockMovement.create([{
          variantId: liveInv.variantId,
          qty: -take,
          type: 'ADJUSTMENT',
          referenceId: auditReferenceId,
          referenceType: 'Audit',
          fromLocation: storeId,
          performedBy: userId,
          sku: liveInv.barcode,
          barcode: liveInv.barcode,
        }], { session });

        await StockLedger.create([{
          itemId: liveInv.itemId,
          barcode: liveInv.barcode,
          locationId: storeId,
          locationType: 'STORE',
          type: 'OUT',
          quantity: take,
          source: 'ADJUSTMENT',
          referenceId: auditReferenceId.toString(),
          userId,
          balanceAfter: liveInv.quantityAvailable,
          batchNo: 'DEFAULT',
        }], { session });

        adjustments.push({ barcode: liveInv.barcode, removed: take, balanceAfter: liveInv.quantityAvailable });
        remaining -= take;
      }
    } else {
      const row = rows.find((r) => (r.quantityAvailable || 0) >= 0);
      if (!row) throw new Error('No row to add stock');
      const liveInv = await StoreInventory.findById(row._id).session(session);
      liveInv.quantity += remaining;
      liveInv.quantityAvailable += remaining;
      liveInv.lastUpdated = Date.now();
      await liveInv.save({ session });
      adjustments.push({ barcode: liveInv.barcode, added: remaining, balanceAfter: liveInv.quantityAvailable });
      remaining = 0;
    }

    if (remaining > 0) {
      throw new Error(`Could not apply full adjustment — ${remaining} pcs remaining`);
    }
  });

  const [afterAgg] = await StoreInventory.aggregate([
    { $match: { storeId } },
    { $group: { _id: null, total: { $sum: '$quantityAvailable' } } },
  ]);

  console.log(JSON.stringify({
    success: true,
    store: storeLabel,
    beforeTotal,
    targetClosing,
    removed: delta > 0 ? delta : 0,
    added: delta < 0 ? Math.abs(delta) : 0,
    afterTotal: afterAgg?.total || 0,
    adjustmentLines: adjustments.length,
    adjustments,
    auditReferenceId: String(auditReferenceId),
  }, null, 2));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
