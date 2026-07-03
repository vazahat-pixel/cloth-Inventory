#!/usr/bin/env node
/**
 * Backup Sahibabad before sale register fix.
 * Revert: node scripts/revert_sahibabad_pre_sale_fix.js
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const StoreInventory = require('../src/models/storeInventory.model');
const Sale = require('../src/models/sale.model');

const SAHIBABAD_ID = '69ecbe2cf04d7249bd11ae45';
const BACKUP_DIR = path.join(__dirname, '../reports/backups');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  const inventory = await StoreInventory.find({ storeId: SAHIBABAD_ID }).lean();
  const [closingAgg] = await StoreInventory.aggregate([
    { $match: { storeId: new mongoose.Types.ObjectId(SAHIBABAD_ID) } },
    { $group: { _id: null, closing: { $sum: '$quantityAvailable' } } },
  ]);

  const juneSales = await Sale.find({
    storeId: SAHIBABAD_ID,
    saleDate: { $gte: new Date('2026-06-01'), $lte: new Date('2026-06-30T23:59:59.999Z') },
  }).lean();

  const exchangeSales = await Sale.find({
    storeId: SAHIBABAD_ID,
    $or: [
      { type: 'EXCHANGE' },
      { 'exchangeDetails.items.0': { $exists: true } },
    ],
  }).lean();

  const sah0071 = await Sale.findOne({ storeId: SAHIBABAD_ID, saleNumber: 'SAH-0071' }).lean();

  const payload = {
    createdAt: new Date().toISOString(),
    storeId: SAHIBABAD_ID,
    closingTotal: closingAgg?.closing || 0,
    inventory,
    juneSales,
    exchangeSales,
    sah0071,
  };

  const file = path.join(BACKUP_DIR, `sahibabad-pre-sale-fix-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'sahibabad-pre-sale-fix-LATEST.json'),
    JSON.stringify({ ...payload, backupFile: file }, null, 2),
  );

  console.log(JSON.stringify({ success: true, backupFile: file, closing: payload.closingTotal }, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
