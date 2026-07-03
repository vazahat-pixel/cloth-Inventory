#!/usr/bin/env node
/**
 * Backup all exchange sale documents before all-stores exchange sync.
 * Revert: node scripts/revert_all_stores_pre_exchange_fix.js
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Sale = require('../src/models/sale.model');

const BACKUP_DIR = path.join(__dirname, '../reports/backups');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  const exchangeSales = await Sale.find({
    isDeleted: { $ne: true },
    $or: [{ type: 'EXCHANGE' }, { 'exchangeDetails.items.0': { $exists: true } }],
  }).lean();

  const payload = {
    createdAt: new Date().toISOString(),
    reason: 'All-stores exchange returnedItems sync (Sonipat-style register fix)',
    exchangeSaleCount: exchangeSales.length,
    exchangeSales,
  };

  const file = path.join(BACKUP_DIR, `all-stores-pre-exchange-fix-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'all-stores-pre-exchange-fix-LATEST.json'),
    JSON.stringify({ ...payload, backupFile: file }, null, 2),
  );

  console.log(JSON.stringify({ success: true, backupFile: file, bills: exchangeSales.length }, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
