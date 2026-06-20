#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Dispatch = require('../src/models/dispatch.model');
const StockReturn = require('../src/models/stockReturn.model');
const Return = require('../src/models/return.model');
const StockMovement = require('../src/models/stockMovement.model');

const PITAMPURA_ID = '69e86a235df4170210683604';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const storeOid = new mongoose.Types.ObjectId(PITAMPURA_ID);

  const receivedDispatches = await Dispatch.find({
    destinationStoreId: storeOid,
    status: 'RECEIVED',
  }).select('dispatchNumber items status createdAt').lean();

  let dispatchInward = 0;
  receivedDispatches.forEach((d) => {
    (d.items || []).forEach((i) => { dispatchInward += Number(i.qty || 0); });
  });

  const stockReturns = await StockReturn.find({ sourceStoreId: storeOid, status: 'RECEIVED' }).lean();
  let purchaseReturnOut = 0;
  stockReturns.forEach((r) => {
    (r.items || []).forEach((i) => { purchaseReturnOut += Number(i.quantity || i.qprovedQty || i.qty || 0); });
  });

  const custReturns = await Return.find({ locationId: storeOid, status: 'APPROVED' }).lean();
  let customerReturnIn = 0;
  custReturns.forEach((r) => {
    (r.items || []).forEach((i) => { customerReturnIn += Number(i.quantity || 0); });
  });

  const receiveMovements = await StockMovement.aggregate([
    {
      $match: {
        toLocation: storeOid,
        type: { $in: ['RECEIVE', 'TRANSFER', 'ADJUSTMENT'] },
        referenceType: { $in: ['Dispatch', 'GRN', 'Adjustment', 'DeliveryChallan'] },
      },
    },
    { $group: { _id: '$referenceType', qty: { $sum: '$qty' } } },
  ]);

  const saleMovements = await StockMovement.aggregate([
    { $match: { fromLocation: storeOid, type: 'SALE' } },
    { $group: { _id: null, qty: { $sum: { $abs: '$qty' } } } },
  ]);

  console.log(JSON.stringify({
    dispatchReceivedCount: receivedDispatches.length,
    dispatchInwardQty: dispatchInward,
    dispatchNumbers: receivedDispatches.map((d) => ({ n: d.dispatchNumber, qty: (d.items || []).reduce((s, i) => s + Number(i.qty || 0), 0) })),
    purchaseReturnOut,
    purchaseReturnCount: stockReturns.length,
    customerReturnIn,
    customerReturnCount: custReturns.length,
    receiveMovements,
    saleMovementQty: saleMovements[0]?.qty || 0,
    userFormula: {
      opening: 3182,
      inward: 176,
      sale: 153,
      closing: 3182 + 176 - 153,
    },
  }, null, 2));

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
