#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Store = require('../src/models/store.model');
const StoreInventory = require('../src/models/storeInventory.model');
const StockLedger = require('../src/models/stockLedger.model');
const Sale = require('../src/models/sale.model');
const reportService = require('../src/modules/reports/report.service');

const PITAMPURA_ID = '69e86a235df4170210683604';

const RETAIL_SALE_MATCH = {
  isDeleted: false,
  status: { $nin: ['CANCELLED', 'REFUNDED'] },
  $or: [{ type: { $exists: false } }, { type: { $nin: ['INTERNAL_SALE'] } }],
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const storeOid = new mongoose.Types.ObjectId(PITAMPURA_ID);

  const [inv] = await StoreInventory.aggregate([
    { $match: { storeId: storeOid } },
    { $group: { _id: null, closing: { $sum: '$quantityAvailable' }, inTransit: { $sum: '$quantityInTransit' } } },
  ]);

  const ledgerStats = await StockLedger.aggregate([
    { $match: { locationId: storeOid, locationType: 'STORE' } },
    { $group: { _id: { source: '$source', type: '$type' }, qty: { $sum: '$quantity' } } },
  ]);

  let opening = 0;
  let inward = 0;
  let outward = 0;
  const inwardBreakdown = {};
  const outwardBreakdown = {};

  ledgerStats.forEach((row) => {
    const { source, type } = row._id;
    const qty = row.qty || 0;
    if (type === 'IN') {
      if (source === 'OPENING_BALANCE') opening += qty;
      else {
        inward += qty;
        inwardBreakdown[source] = (inwardBreakdown[source] || 0) + qty;
      }
    } else if (type === 'OUT') {
      outward += qty;
      outwardBreakdown[source] = (outwardBreakdown[source] || 0) + qty;
    }
  });

  const salesQtyAgg = await Sale.aggregate([
    { $match: { ...RETAIL_SALE_MATCH, storeId: storeOid } },
    { $unwind: '$items' },
    { $group: { _id: null, qty: { $sum: { $ifNull: ['$items.quantity', 0] } } } },
  ]);
  const retailSaleQty = salesQtyAgg[0]?.qty || 0;

  const totals = await reportService.getBranchSalesStockStoreTotals(null, null, PITAMPURA_ID);
  const reportClosing = totals.closingByStore.get(PITAMPURA_ID) ?? 0;
  const reportNetSale = totals.netSaleByStore.get(PITAMPURA_ID) ?? 0;

  const calculatedClosing = opening + inward - outward;
  const userExpected = { opening: 3182, inward: 176, sale: 153, closing: 3205 };

  console.log(JSON.stringify({
    store: 'PITAMPURA',
    dbNow: {
      closingStock: inv?.closing || 0,
      inTransit: inv?.inTransit || 0,
    },
    ledgerBased: {
      openingStock: opening,
      inwardStock: inward,
      inwardBreakdown,
      totalIn: opening + inward,
      outwardStock: outward,
      outwardBreakdown,
      calculatedClosing: opening + inward - outward,
    },
    sales: {
      retailSaleQtyFromInvoices: retailSaleQty,
      netSaleFromBranchReport: reportNetSale,
      saleOutFromLedger: outwardBreakdown.SALE || 0,
    },
    branchReportClosing: reportClosing,
    userExpected,
    gaps: {
      closingVsUser: (inv?.closing || 0) - userExpected.closing,
      closingVsLedgerFormula: (inv?.closing || 0) - calculatedClosing,
      openingVsUser: opening - userExpected.opening,
      inwardVsUser: inward - userExpected.inward,
      saleVsUser: retailSaleQty - userExpected.sale,
    },
  }, null, 2));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
