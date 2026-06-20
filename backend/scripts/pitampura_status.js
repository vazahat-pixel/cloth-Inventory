#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Store = require('../src/models/store.model');
const StoreInventory = require('../src/models/storeInventory.model');
const Sale = require('../src/models/sale.model');
const zeroMismatchService = require('../src/modules/inventory/zeroMismatch.service');

const PITAMPURA_ID = '69e86a235df4170210683604';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const store = await Store.findById(PITAMPURA_ID).lean();
  const [inv] = await StoreInventory.aggregate([
    { $match: { storeId: new mongoose.Types.ObjectId(PITAMPURA_ID) } },
    {
      $group: {
        _id: null,
        skuLines: { $sum: 1 },
        stock: { $sum: '$quantityAvailable' },
        inTransit: { $sum: '$quantityInTransit' },
        negativeLines: { $sum: { $cond: [{ $lt: ['$quantityAvailable', 0] }, 1, 0] } },
      },
    },
  ]);

  const [sales] = await Sale.aggregate([
    {
      $match: {
        storeId: new mongoose.Types.ObjectId(PITAMPURA_ID),
        isDeleted: { $ne: true },
        status: { $nin: ['CANCELLED', 'REFUNDED'] },
      },
    },
    {
      $group: {
        _id: null,
        invoices: { $sum: 1 },
        revenue: { $sum: '$grandTotal' },
        paid: { $sum: '$amountPaid' },
        due: { $sum: '$dueAmount' },
      },
    },
  ]);

  const report = await zeroMismatchService.verify({ forUi: true });
  const checks = report.checks.filter((c) => String(c.storeId) === PITAMPURA_ID);
  const mismatches = report.mismatches.filter((m) => String(m.storeId) === PITAMPURA_ID);

  console.log(JSON.stringify({
    store: store?.name,
    asOf: new Date().toISOString(),
    stock: {
      totalPcs: inv?.stock || 0,
      skuLines: inv?.skuLines || 0,
      inTransitPcs: inv?.inTransit || 0,
      negativeSkuLines: inv?.negativeLines || 0,
    },
    sales: {
      invoices: sales?.invoices || 0,
      revenue: Math.round((sales?.revenue || 0) * 100) / 100,
      paid: Math.round((sales?.paid || 0) * 100) / 100,
      due: Math.round((sales?.due || 0) * 100) / 100,
    },
    verification: {
      allPassed: mismatches.length === 0,
      mismatchCount: mismatches.length,
      checks: checks.map((c) => ({
        name: c.check,
        passed: c.passed,
        live: c.liveInventory,
        report: c.reportTotal,
        diff: c.differenceQty,
        pool: c.poolTotal,
      })),
    },
  }, null, 2));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
