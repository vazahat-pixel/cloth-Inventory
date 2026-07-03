#!/usr/bin/env node
/**
 * Backup Sonipat inventory + exchange sale docs before exchange/closing fixes.
 * Revert: node scripts/revert_sonipat_pre_exchange_fix.js
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const StoreInventory = require('../src/models/storeInventory.model');
const Sale = require('../src/models/sale.model');

const SONIPAT_ID = '69e89f8e5df4170210683876';
const BACKUP_DIR = path.join(__dirname, '../reports/backups');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  const inventory = await StoreInventory.find({ storeId: SONIPAT_ID }).lean();
  const [closingAgg] = await StoreInventory.aggregate([
    { $match: { storeId: new mongoose.Types.ObjectId(SONIPAT_ID) } },
    { $group: { _id: null, closing: { $sum: '$quantityAvailable' } } },
  ]);

  const exchangeSales = await Sale.find({
    storeId: SONIPAT_ID,
    $or: [
      { type: 'EXCHANGE' },
      { 'exchangeDetails.originalSaleId': { $exists: true } },
    ],
  }).lean();

  const payload = {
    createdAt: new Date().toISOString(),
    storeId: SONIPAT_ID,
    closingTotal: closingAgg?.closing || 0,
    inventoryRowCount: inventory.length,
    inventory,
    exchangeSales,
  };

  const file = path.join(BACKUP_DIR, `sonipat-pre-exchange-fix-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  fs.writeFileSync(path.join(BACKUP_DIR, 'sonipat-pre-exchange-fix-LATEST.json'), JSON.stringify({ ...payload, backupFile: file }, null, 2));

  console.log(JSON.stringify({ success: true, backupFile: file, closing: payload.closingTotal, rows: inventory.length }, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
