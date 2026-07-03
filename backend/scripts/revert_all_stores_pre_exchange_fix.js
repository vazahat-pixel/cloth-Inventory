#!/usr/bin/env node
/**
 * Revert exchange sale docs from backup_all_stores_pre_exchange_fix.js
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Sale = require('../src/models/sale.model');

const BACKUP_POINTER = path.join(__dirname, '../reports/backups/all-stores-pre-exchange-fix-LATEST.json');

async function main() {
  if (!fs.existsSync(BACKUP_POINTER)) {
    throw new Error('No backup found. Run backup_all_stores_pre_exchange_fix.js first.');
  }
  const pointer = JSON.parse(fs.readFileSync(BACKUP_POINTER, 'utf8'));
  const backup = JSON.parse(fs.readFileSync(pointer.backupFile || BACKUP_POINTER, 'utf8'));

  await mongoose.connect(process.env.MONGODB_URI);

  let restored = 0;
  for (const sale of backup.exchangeSales || []) {
    await Sale.updateOne(
      { _id: sale._id },
      {
        $set: {
          returnedItems: sale.returnedItems,
          exchangeDetails: sale.exchangeDetails,
          type: sale.type,
          exchangeAdjustment: sale.exchangeAdjustment,
          parentSaleId: sale.parentSaleId,
        },
      },
    );
    restored += 1;
  }

  console.log(JSON.stringify({ success: true, backupUsed: pointer.backupFile, salesRestored: restored }, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
