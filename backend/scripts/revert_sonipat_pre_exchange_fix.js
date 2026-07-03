#!/usr/bin/env node
/**
 * Revert Sonipat inventory (+ optional sale docs) from backup_sonipat_pre_exchange_fix.js
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const StoreInventory = require('../src/models/storeInventory.model');
const Sale = require('../src/models/sale.model');

const BACKUP_POINTER = path.join(__dirname, '../reports/backups/sonipat-pre-exchange-fix-LATEST.json');

async function main() {
  if (!fs.existsSync(BACKUP_POINTER)) {
    throw new Error('No backup found. Run backup_sonipat_pre_exchange_fix.js first.');
  }
  const pointer = JSON.parse(fs.readFileSync(BACKUP_POINTER, 'utf8'));
  const backupPath = pointer.backupFile || BACKUP_POINTER;
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  await mongoose.connect(process.env.MONGODB_URI);

  let invRestored = 0;
  for (const row of backup.inventory || []) {
    await StoreInventory.updateOne(
      { _id: row._id },
      {
        $set: {
          quantity: row.quantity,
          quantityAvailable: row.quantityAvailable,
          quantityInTransit: row.quantityInTransit,
          quantitySold: row.quantitySold,
          quantityReturned: row.quantityReturned,
        },
      },
    );
    invRestored += 1;
  }

  let salesRestored = 0;
  for (const sale of backup.exchangeSales || []) {
    await Sale.updateOne(
      { _id: sale._id },
      { $set: { returnedItems: sale.returnedItems, exchangeDetails: sale.exchangeDetails, type: sale.type } },
    );
    salesRestored += 1;
  }

  const [after] = await StoreInventory.aggregate([
    { $match: { storeId: new mongoose.Types.ObjectId(backup.storeId) } },
    { $group: { _id: null, closing: { $sum: '$quantityAvailable' } } },
  ]);

  console.log(
    JSON.stringify(
      {
        success: true,
        backupUsed: backupPath,
        inventoryRowsRestored: invRestored,
        salesDocsRestored: salesRestored,
        closingBeforeBackup: backup.closingTotal,
        closingAfterRevert: after?.closing || 0,
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
