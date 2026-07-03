#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
require('../src/models/store.model');
require('../src/models/product.model');
const Sale = require('../src/models/sale.model');
const { aggregateRegisterTotals } = require('../src/utils/saleReportUtils');
const reportService = require('../src/modules/reports/report.service');

const SAHIBABAD_ID = '69ecbe2cf04d7249bd11ae45';
const RETAIL = {
  isDeleted: false,
  status: { $nin: ['CANCELLED', 'REFUNDED'] },
  $or: [{ type: { $exists: false } }, { type: { $nin: ['INTERNAL_SALE'] } }],
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const juneStart = new Date('2026-06-01');
  const juneEnd = new Date('2026-06-30T23:59:59.999Z');

  const saleDateSales = await Sale.find({
    ...RETAIL,
    storeId: SAHIBABAD_ID,
    saleDate: { $gte: juneStart, $lte: juneEnd },
  }).lean();

  const entrySales = await Sale.find({
    ...RETAIL,
    storeId: SAHIBABAD_ID,
    createdAt: { $gte: juneStart, $lte: juneEnd },
  }).lean();

  const register = aggregateRegisterTotals(saleDateSales, entrySales, SAHIBABAD_ID);

  console.log(
    JSON.stringify(
      {
        userRegister: { juneQty: 137, juneAmt: 128072 },
        systemRegister: register,
        match: {
          qty: register.registerSaleQty === 137,
          amt: register.registerSaleAmount === 128072,
        },
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
