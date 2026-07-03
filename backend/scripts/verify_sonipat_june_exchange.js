#!/usr/bin/env node
/**
 * Verify Sonipat June 2026: net sale, exchange, closing after exchange fix.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Sale = require('../src/models/sale.model');
const StoreInventory = require('../src/models/storeInventory.model');
const { aggregateSalesQty } = require('../src/utils/saleReportUtils');

const SONIPAT_ID = '69e89f8e5df4170210683876';
const JUNE_START = '2026-06-01';
const JUNE_END = '2026-06-30T23:59:59.999Z';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const salesQuery = {
    storeId: SONIPAT_ID,
    isDeleted: false,
    status: { $nin: ['CANCELLED', 'REFUNDED'] },
    saleDate: { $gte: new Date(JUNE_START), $lte: new Date(JUNE_END) },
  };
  const juneSales = await Sale.find(salesQuery).lean();
  const qty = aggregateSalesQty(juneSales);

  const [closingAgg] = await StoreInventory.aggregate([
    { $match: { storeId: new mongoose.Types.ObjectId(SONIPAT_ID) } },
    { $group: { _id: null, closing: { $sum: '$quantityAvailable' } } },
  ]);

  const julySales = await Sale.find({
    storeId: SONIPAT_ID,
    isDeleted: false,
    status: { $nin: ['CANCELLED', 'REFUNDED'] },
    saleDate: { $gte: new Date('2026-07-01'), $lte: new Date('2026-07-31T23:59:59.999Z') },
  }).lean();
  const julyQty = aggregateSalesQty(julySales);

  const exchangeBills = juneSales
    .filter((s) => (s.exchangeDetails?.items?.length || s.returnedItems?.length))
    .map((s) => ({
      bill: s.saleNumber,
      date: s.saleDate,
      gross: (s.items || []).reduce((n, i) => n + (i.quantity || 0), 0),
      exchange: (s.returnedItems?.length ? s.returnedItems : s.exchangeDetails?.items || []).reduce(
        (n, i) => n + (i.quantity || 0),
        0,
      ),
    }));

  console.log(
    JSON.stringify(
      {
        register: { juneNetSale: 419, juneExchange: 2, juneClosing: 2875 },
        system: {
          juneGross: qty.grossSaleQty,
          juneExchange: qty.exchangeQty,
          juneNet: qty.netSaleQty,
          exchangeBills,
          liveClosing: closingAgg?.closing || 0,
          julyGross: julyQty.grossSaleQty,
          julyNet: julyQty.netSaleQty,
        },
        match: {
          netSale: qty.netSaleQty === 419,
          exchange: qty.exchangeQty === 2,
          closing: (closingAgg?.closing || 0) === 2875,
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
