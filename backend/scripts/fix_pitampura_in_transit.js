#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Store = require('../src/models/store.model');
const StoreInventory = require('../src/models/storeInventory.model');
const zeroMismatchService = require('../src/modules/inventory/zeroMismatch.service');

const PITAMPURA_ID = '69e86a235df4170210683604';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const store = await Store.findById(PITAMPURA_ID).select('name').lean();
  if (!store) {
    console.error('Pitampura store not found');
    process.exit(1);
  }

  const before = await StoreInventory.aggregate([
    { $match: { storeId: new mongoose.Types.ObjectId(PITAMPURA_ID) } },
    {
      $group: {
        _id: null,
        stock: { $sum: '$quantityAvailable' },
        inTransit: { $sum: '$quantityInTransit' },
        inTransitLines: { $sum: { $cond: [{ $gt: ['$quantityInTransit', 0] }, 1, 0] } },
      },
    },
  ]);

  console.log('Before:', before[0] || {});

  const result = await zeroMismatchService.reconcileInTransitPools({ storeId: PITAMPURA_ID });
  console.log('\nReconcile result:', JSON.stringify(result, null, 2));

  const after = await StoreInventory.aggregate([
    { $match: { storeId: new mongoose.Types.ObjectId(PITAMPURA_ID) } },
    {
      $group: {
        _id: null,
        stock: { $sum: '$quantityAvailable' },
        inTransit: { $sum: '$quantityInTransit' },
        inTransitLines: { $sum: { $cond: [{ $gt: ['$quantityInTransit', 0] }, 1, 0] } },
      },
    },
  ]);

  console.log('\nAfter:', after[0] || {});

  const report = await zeroMismatchService.verify({ forUi: true });
  const pitampuraChecks = report.checks.filter((c) => String(c.storeId) === PITAMPURA_ID || c.store?.includes('PITAMPURA'));
  const pitampuraMismatches = report.mismatches.filter((m) => String(m.storeId) === PITAMPURA_ID || m.store?.includes('PITAMPURA'));

  console.log('\nPitampura checks:', pitampuraChecks.map((c) => ({
    check: c.check,
    passed: c.passed,
    diff: c.differenceQty,
    failureReason: c.failureReason,
  })));

  console.log(`\nPitampura mismatches remaining: ${pitampuraMismatches.length}`);
  if (pitampuraMismatches.length) {
    console.log(JSON.stringify(pitampuraMismatches.slice(0, 5), null, 2));
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
