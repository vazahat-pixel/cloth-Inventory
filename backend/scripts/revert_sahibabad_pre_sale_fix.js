#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const StoreInventory = require('../src/models/storeInventory.model');
const Sale = require('../src/models/sale.model');

const BACKUP_POINTER = path.join(__dirname, '../reports/backups/sahibabad-pre-sale-fix-LATEST.json');

async function main() {
  if (!fs.existsSync(BACKUP_POINTER)) {
    throw new Error('No backup found. Run backup_sahibabad_pre_sale_fix.js first.');
  }
  const pointer = JSON.parse(fs.readFileSync(BACKUP_POINTER, 'utf8'));
  const backup = JSON.parse(fs.readFileSync(pointer.backupFile || BACKUP_POINTER, 'utf8'));

  await mongoose.connect(process.env.MONGODB_URI);

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
  }

  for (const sale of [...(backup.juneSales || []), ...(backup.exchangeSales || [])]) {
    await Sale.updateOne(
      { _id: sale._id },
      {
        $set: {
          returnedItems: sale.returnedItems,
          exchangeDetails: sale.exchangeDetails,
          excludeFromRevenue: sale.excludeFromRevenue,
          type: sale.type,
          isDeleted: sale.isDeleted,
          status: sale.status,
        },
      },
    );
  }

  if (backup.sah0071) {
    await Sale.updateOne({ _id: backup.sah0071._id }, { $set: backup.sah0071 });
  }

  const [after] = await StoreInventory.aggregate([
    { $match: { storeId: new mongoose.Types.ObjectId(backup.storeId) } },
    { $group: { _id: null, closing: { $sum: '$quantityAvailable' } } },
  ]);

  console.log(JSON.stringify({ success: true, closingAfterRevert: after?.closing || 0 }, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
