#!/usr/bin/env node
/**
 * Adjust Pitampura closing stock to 3205 (Opening 3182 + Inward 176 - Sale 153).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const StoreInventory = require('../src/models/storeInventory.model');
const User = require('../src/models/user.model');
const { adjustStoreStock } = require('../src/services/stock.service');
const { withTransaction } = require('../src/services/transaction.service');
const { StockMovementType } = require('../src/core/enums');
const zeroMismatchService = require('../src/modules/inventory/zeroMismatch.service');

const PITAMPURA_ID = '69e86a235df4170210683604';
const TARGET_CLOSING = 3205;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
  const userId = admin?._id || new mongoose.Types.ObjectId();

  const [beforeAgg] = await StoreInventory.aggregate([
    { $match: { storeId: new mongoose.Types.ObjectId(PITAMPURA_ID) } },
    { $group: { _id: null, total: { $sum: '$quantityAvailable' } } },
  ]);
  const beforeTotal = beforeAgg?.total || 0;
  const toRemove = beforeTotal - TARGET_CLOSING;

  if (toRemove <= 0) {
    console.log(JSON.stringify({ message: 'No adjustment needed', beforeTotal, target: TARGET_CLOSING }, null, 2));
    await mongoose.disconnect();
    return;
  }

  const rows = await StoreInventory.find({
    storeId: PITAMPURA_ID,
    quantityAvailable: { $gt: 0 },
  })
    .select('barcode variantId itemId quantityAvailable')
    .sort({ quantityAvailable: -1 })
    .lean();

  const auditReferenceId = new mongoose.Types.ObjectId();
  const adjustments = [];
  let remaining = toRemove;

  await withTransaction(async (session) => {
    for (const row of rows) {
      if (remaining <= 0) break;
      const take = Math.min(row.quantityAvailable || 0, remaining);
      if (take <= 0) continue;

      // eslint-disable-next-line no-await-in-loop
      await adjustStoreStock({
        variantId: row.variantId,
        productId: row.variantId,
        storeId: PITAMPURA_ID,
        quantityChange: -take,
        type: StockMovementType.ADJUSTMENT,
        referenceId: auditReferenceId,
        referenceModel: 'Audit',
        performedBy: userId,
        notes: `Pitampura closing reconciliation → target ${TARGET_CLOSING} (Opening 3182 + Inward 176 - Sale 153)`,
        session,
      });

      adjustments.push({ barcode: row.barcode, removed: take });
      remaining -= take;
    }

    if (remaining > 0) {
      throw new Error(`Could not remove full ${toRemove} pcs — ${remaining} pcs short (insufficient positive stock rows)`);
    }
  });

  const [afterAgg] = await StoreInventory.aggregate([
    { $match: { storeId: new mongoose.Types.ObjectId(PITAMPURA_ID) } },
    { $group: { _id: null, total: { $sum: '$quantityAvailable' } } },
  ]);

  const report = await zeroMismatchService.verify({ forUi: true });
  const pitCheck = report.checks.find(
    (c) => c.check === 'STORE_STOCK_REPORT' && String(c.storeId) === PITAMPURA_ID,
  );

  console.log(JSON.stringify({
    success: true,
    beforeTotal,
    targetClosing: TARGET_CLOSING,
    removed: toRemove,
    afterTotal: afterAgg?.total || 0,
    adjustmentLines: adjustments.length,
    adjustments,
    reportClosing: pitCheck?.reportTotal,
    liveClosing: pitCheck?.liveInventory,
    mismatch: pitCheck?.differenceQty,
  }, null, 2));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
