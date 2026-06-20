#!/usr/bin/env node
/** Fix negative store stock rows for Pitampura (set sub-zero fields to 0). */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const StoreInventory = require('../src/models/storeInventory.model');
const zeroMismatchService = require('../src/modules/inventory/zeroMismatch.service');

const PITAMPURA_ID = '69e86a235df4170210683604';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const negRows = await StoreInventory.find({
    storeId: PITAMPURA_ID,
    $or: [
      { quantity: { $lt: 0 } },
      { quantityAvailable: { $lt: 0 } },
      { quantityInTransit: { $lt: 0 } },
    ],
  }).select('barcode quantity quantityAvailable quantityInTransit').lean();

  console.log(`Found ${negRows.length} negative stock row(s) at Pitampura`);

  let fixed = 0;
  for (const row of negRows) {
    const update = {};
    if ((row.quantity || 0) < 0) update.quantity = 0;
    if ((row.quantityAvailable || 0) < 0) update.quantityAvailable = 0;
    if ((row.quantityInTransit || 0) < 0) update.quantityInTransit = 0;
    // eslint-disable-next-line no-await-in-loop
    await StoreInventory.updateOne({ _id: row._id }, { $set: update });
    console.log(`Fixed ${row.barcode}: qty ${row.quantityAvailable} → 0`);
    fixed += 1;
  }

  const report = await zeroMismatchService.verify({ forUi: true });
  const pitampuraMismatches = report.mismatches.filter(
    (m) => String(m.storeId) === PITAMPURA_ID || m.store?.includes('PITAMPURA'),
  );

  console.log(`\nFixed ${fixed} row(s). Pitampura mismatches remaining: ${pitampuraMismatches.length}`);
  if (pitampuraMismatches.length) {
    console.log(JSON.stringify(pitampuraMismatches.slice(0, 3), null, 2));
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
