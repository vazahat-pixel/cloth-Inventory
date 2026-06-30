#!/usr/bin/env node
/**
 * Full store reconciliation: opening → inward → sales → closing + mismatches
 * Usage: node scripts/full_store_reconciliation_report.js
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Store = require('../src/models/store.model');
const Warehouse = require('../src/models/warehouse.model');
const StoreInventory = require('../src/models/storeInventory.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');
const Sale = require('../src/models/sale.model');
const Dispatch = require('../src/models/dispatch.model');
const StockReturn = require('../src/models/stockReturn.model');
const Return = require('../src/models/return.model');
const StockLedger = require('../src/models/stockLedger.model');
const reportService = require('../src/modules/reports/report.service');
const zeroMismatchService = require('../src/modules/inventory/zeroMismatch.service');

const round0 = (n) => Math.round(Number(n) || 0);
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const RETAIL_SALE_MATCH = {
  isDeleted: false,
  status: { $nin: ['CANCELLED', 'REFUNDED'] },
  $or: [{ type: { $exists: false } }, { type: { $nin: ['INTERNAL_SALE'] } }],
};

async function summarizeStore(store, branchTotals) {
  const storeId = store._id;
  const sid = String(storeId);
  const key = sid;

  const [
    invAgg,
    negCount,
    inTransitAgg,
    salesAgg,
    salesRevenueAgg,
    invoiceCount,
    receivedDispatches,
    dispatchedOpen,
    allDispatches,
    stockReturns,
    customerReturns,
    ledgerStats,
  ] = await Promise.all([
    StoreInventory.aggregate([
      { $match: { storeId } },
      {
        $group: {
          _id: null,
          closing: { $sum: '$quantityAvailable' },
          skuLines: { $sum: 1 },
          inTransit: { $sum: '$quantityInTransit' },
        },
      },
    ]),
    StoreInventory.countDocuments({
      storeId,
      $or: [{ quantityAvailable: { $lt: 0 } }, { quantity: { $lt: 0 } }, { quantityInTransit: { $lt: 0 } }],
    }),
    StoreInventory.aggregate([
      { $match: { storeId, quantityInTransit: { $gt: 0 } } },
      { $group: { _id: null, pool: { $sum: '$quantityInTransit' } } },
    ]),
    Sale.aggregate([
      { $match: { ...RETAIL_SALE_MATCH, storeId } },
      { $unwind: '$items' },
      { $group: { _id: null, qty: { $sum: { $ifNull: ['$items.quantity', 0] } } } },
    ]),
    Sale.aggregate([
      { $match: { ...RETAIL_SALE_MATCH, storeId } },
      { $group: { _id: null, revenue: { $sum: '$grandTotal' }, paid: { $sum: '$amountPaid' }, due: { $sum: '$dueAmount' } } },
    ]),
    Sale.countDocuments({ ...RETAIL_SALE_MATCH, storeId }),
    Dispatch.find({ destinationStoreId: storeId, status: 'RECEIVED' })
      .select('dispatchNumber sourceWarehouseId items status receivedAt createdAt')
      .populate('sourceWarehouseId', 'name')
      .lean(),
    Dispatch.find({ destinationStoreId: storeId, status: 'DISPATCHED' })
      .select('dispatchNumber items')
      .lean(),
    Dispatch.find({ destinationStoreId: storeId })
      .select('dispatchNumber status items createdAt receivedAt')
      .lean(),
    StockReturn.find({ sourceStoreId: storeId, status: 'RECEIVED' }).select('returnNumber items status').lean(),
    Return.find({ locationId: storeId, status: 'APPROVED' }).select('items').lean(),
    StockLedger.aggregate([
      { $match: { locationId: storeId, locationType: 'STORE' } },
      { $group: { _id: { source: '$source', type: '$type' }, qty: { $sum: '$quantity' } } },
    ]),
  ]);

  const closing = invAgg[0]?.closing || 0;
  const skuLines = invAgg[0]?.skuLines || 0;
  const inTransitPool = inTransitAgg[0]?.pool || 0;
  const salesQty = salesAgg[0]?.qty || 0;
  const revenue = round2(salesRevenueAgg[0]?.revenue);
  const paid = round2(salesRevenueAgg[0]?.paid);
  const due = round2(salesRevenueAgg[0]?.due);

  let inwardReceived = 0;
  const receivedDispatchList = receivedDispatches.map((d) => {
    const qty = (d.items || []).reduce((s, i) => s + Number(i.qty || 0), 0);
    inwardReceived += qty;
    return {
      dispatchNumber: d.dispatchNumber,
      qty,
      warehouse: d.sourceWarehouseId?.name || 'HO/Warehouse',
      receivedAt: d.receivedAt || d.createdAt,
    };
  });

  let inwardPending = 0;
  const pendingDispatchList = dispatchedOpen.map((d) => {
    const qty = (d.items || []).reduce((s, i) => s + Number(i.qty || 0), 0);
    inwardPending += qty;
    return { dispatchNumber: d.dispatchNumber, qty };
  });

  let purchaseReturnOut = 0;
  stockReturns.forEach((r) => {
    (r.items || []).forEach((i) => { purchaseReturnOut += Number(i.qty || i.quantity || 0); });
  });

  let customerReturnIn = 0;
  customerReturns.forEach((r) => {
    (r.items || []).forEach((i) => { customerReturnIn += Number(i.quantity || 0); });
  });

  let ledgerOpening = 0;
  let ledgerInward = 0;
  let ledgerOutward = 0;
  const ledgerBreakdown = { in: {}, out: {} };
  ledgerStats.forEach((row) => {
    const src = row._id.source;
    const type = row._id.type;
    const qty = row.qty || 0;
    if (type === 'IN') {
      if (src === 'OPENING_BALANCE') ledgerOpening += qty;
      else {
        ledgerInward += qty;
        ledgerBreakdown.in[src] = (ledgerBreakdown.in[src] || 0) + qty;
      }
    } else if (type === 'OUT') {
      ledgerOutward += qty;
      ledgerBreakdown.out[src] = (ledgerBreakdown.out[src] || 0) + qty;
    }
  });

  const branchClosing = branchTotals.closingByStore.get(key) ?? closing;
  const branchNetSale = branchTotals.netSaleByStore.get(key) ?? salesQty;
  const branchReturns = branchTotals.returnsByStore.get(key) ?? customerReturnIn;

  // User formula: Opening + Inward - Sale = Closing  →  Opening = Closing + Sale - Inward (+ returns out, - cust returns in)
  const calculatedOpening = round0(
    closing + salesQty + purchaseReturnOut - inwardReceived - customerReturnIn,
  );
  const expectedClosingFromFormula = round0(
    calculatedOpening + inwardReceived + customerReturnIn - salesQty - purchaseReturnOut,
  );
  const formulaGap = round0(closing - expectedClosingFromFormula);
  const branchReportGap = round0(closing - branchClosing);
  const salesReportGap = round0(salesQty - branchNetSale);
  const inTransitGap = round0(inTransitPool - inwardPending);

  const dispatchStatusSummary = {};
  allDispatches.forEach((d) => {
    dispatchStatusSummary[d.status] = (dispatchStatusSummary[d.status] || 0) + 1;
  });

  const issues = [];
  if (formulaGap !== 0) {
    issues.push({
      type: 'FORMULA_MISMATCH',
      message: `Opening(${calculatedOpening}) + Inward(${inwardReceived}) - Sale(${salesQty}) ≠ Closing(${closing}). Gap: ${formulaGap} pcs`,
    });
  }
  if (branchReportGap !== 0) {
    issues.push({
      type: 'BRANCH_REPORT_GAP',
      message: `Live stock ${closing} vs Branch Report ${branchClosing}. Gap: ${branchReportGap}`,
    });
  }
  if (salesReportGap !== 0) {
    issues.push({
      type: 'SALES_REPORT_GAP',
      message: `Sales register qty ${salesQty} vs Branch Report net sale ${branchNetSale}. Gap: ${salesReportGap}`,
    });
  }
  if (inTransitGap !== 0) {
    issues.push({
      type: 'IN_TRANSIT_POOL_GAP',
      message: `In-transit pool ${inTransitPool} vs open dispatches ${inwardPending}. Gap: ${inTransitGap}`,
    });
  }
  if (negCount > 0) {
    issues.push({
      type: 'NEGATIVE_STOCK',
      message: `${negCount} SKU line(s) with negative stock`,
    });
  }

  return {
    storeId: sid,
    storeName: store.name,
    storeCode: store.storeCode || store.code,
    stock: {
      closingPcs: round0(closing),
      calculatedOpeningPcs: calculatedOpening,
      skuLines,
      inTransitPoolPcs: round0(inTransitPool),
      branchReportClosingPcs: round0(branchClosing),
    },
    inward: {
      fromHODispatchesReceivedPcs: round0(inwardReceived),
      dispatchCountReceived: receivedDispatchList.length,
      receivedDispatches: receivedDispatchList,
      pendingInTransitPcs: round0(inwardPending),
      pendingDispatchCount: pendingDispatchList.length,
      pendingDispatches: pendingDispatchList,
      dispatchStatusSummary,
    },
    outward: {
      retailSalesQtyPcs: round0(salesQty),
      purchaseReturnToWarehousePcs: round0(purchaseReturnOut),
      purchaseReturnCount: stockReturns.length,
    },
    returns: {
      customerReturnInPcs: round0(customerReturnIn),
      branchReportReturnPcs: round0(branchReturns),
    },
    sales: {
      invoiceCount,
      revenue,
      paid,
      due,
      branchReportNetSaleQty: round0(branchNetSale),
    },
    formula: {
      opening: calculatedOpening,
      plusInward: round0(inwardReceived),
      plusCustomerReturns: round0(customerReturnIn),
      minusSales: round0(salesQty),
      minusPurchaseReturns: round0(purchaseReturnOut),
      equalsClosingExpected: expectedClosingFromFormula,
      actualClosing: round0(closing),
      gapPcs: formulaGap,
    },
    ledger: {
      openingBalance: round0(ledgerOpening),
      totalIn: round0(ledgerInward),
      totalOut: round0(ledgerOutward),
      breakdown: ledgerBreakdown,
      note: 'Ledger may not capture full history if data was imported without ledger entries',
    },
    issues,
    status: issues.length === 0 ? 'OK' : 'REVIEW',
  };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const [stores, warehouses, branchTotals, zmReport] = await Promise.all([
    Store.find({ isActive: { $ne: false } }).sort({ name: 1 }).lean(),
    Warehouse.find({ isActive: { $ne: false } }).select('name').lean(),
    reportService.getBranchSalesStockStoreTotals(null, null, null),
    zeroMismatchService.verify({ forUi: true }),
  ]);

  const storeReports = [];
  for (const store of stores) {
    // eslint-disable-next-line no-await-in-loop
    storeReports.push(await summarizeStore(store, branchTotals));
  }

  const [whAgg] = await WarehouseInventory.aggregate([
    { $group: { _id: null, qty: { $sum: '$quantity' }, lines: { $sum: 1 } } },
  ]);

  const grand = {
    stores: storeReports.length,
    totalClosingPcs: storeReports.reduce((s, r) => s + r.stock.closingPcs, 0),
    totalOpeningCalcPcs: storeReports.reduce((s, r) => s + r.stock.calculatedOpeningPcs, 0),
    totalInwardReceivedPcs: storeReports.reduce((s, r) => s + r.inward.fromHODispatchesReceivedPcs, 0),
    totalSalesQtyPcs: storeReports.reduce((s, r) => s + r.outward.retailSalesQtyPcs, 0),
    totalRevenue: round2(storeReports.reduce((s, r) => s + r.sales.revenue, 0)),
    totalInvoices: storeReports.reduce((s, r) => s + r.sales.invoiceCount, 0),
    storesWithIssues: storeReports.filter((r) => r.issues.length > 0).length,
    warehouseStockPcs: round2(whAgg?.qty || 0),
    warehouseSkuLines: whAgg?.lines || 0,
    zeroMismatchPassed: zmReport.passed,
    zeroMismatchCount: zmReport.summary?.mismatchCount || 0,
  };

  const output = {
    generatedAt: new Date().toISOString(),
    period: 'ALL TIME (opening stock era → today)',
    warehouses: warehouses.map((w) => w.name),
    grandTotals: grand,
    zeroMismatchSummary: zmReport.summary,
    zeroMismatchByStore: zmReport.mismatches.reduce((acc, m) => {
      const name = m.store || 'Unknown';
      if (!acc[name]) acc[name] = [];
      acc[name].push({ type: m.type, barcode: m.barcode, rootCause: m.rootCause, diff: m.differenceQty });
      return acc;
    }, {}),
    stores: storeReports,
  };

  const outDir = path.join(__dirname, '../reports/full');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const jsonPath = path.join(outDir, `store-reconciliation-${stamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));

  // Console summary table
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('  FULL STORE RECONCILIATION (Opening → Inward → Sale → Closing)');
  console.log('══════════════════════════════════════════════════════════════════\n');
  console.log(`Generated: ${output.generatedAt}`);
  console.log(`Warehouses: ${warehouses.map((w) => w.name).join(', ')}`);
  console.log(`Zero-Mismatch: ${zmReport.passed ? 'PASS' : 'FAIL'} (${grand.zeroMismatchCount} issues)\n`);

  console.log(
    'Store'.padEnd(42) +
    'Open'.padStart(7) +
    'Inward'.padStart(8) +
    'Sale'.padStart(7) +
    'Close'.padStart(7) +
    'Gap'.padStart(6) +
    'Transit'.padStart(8) +
    'Status'.padStart(8),
  );
  console.log('-'.repeat(93));

  storeReports.forEach((r) => {
    const name = (r.storeName || '').slice(0, 40);
    console.log(
      name.padEnd(42) +
      String(r.formula.opening).padStart(7) +
      String(r.inward.fromHODispatchesReceivedPcs).padStart(8) +
      String(r.outward.retailSalesQtyPcs).padStart(7) +
      String(r.stock.closingPcs).padStart(7) +
      String(r.formula.gapPcs).padStart(6) +
      String(r.stock.inTransitPoolPcs).padStart(8) +
      r.status.padStart(8),
    );
  });

  console.log('-'.repeat(93));
  console.log(
    'TOTAL'.padEnd(42) +
    String(grand.totalOpeningCalcPcs).padStart(7) +
    String(grand.totalInwardReceivedPcs).padStart(8) +
    String(grand.totalSalesQtyPcs).padStart(7) +
    String(grand.totalClosingPcs).padStart(7),
  );
  console.log(`\nSales Revenue: ₹${grand.totalRevenue.toLocaleString('en-IN')} | Invoices: ${grand.totalInvoices}`);
  console.log(`Warehouse Stock: ${grand.warehouseStockPcs} pcs (${grand.warehouseSkuLines} SKUs)\n`);

  const problemStores = storeReports.filter((r) => r.issues.length > 0);
  if (problemStores.length) {
    console.log('── STORES WITH ISSUES ──\n');
    problemStores.forEach((r) => {
      console.log(`▸ ${r.storeName}`);
      r.issues.forEach((i) => console.log(`   • [${i.type}] ${i.message}`));
      if (r.inward.receivedDispatches.length) {
        console.log(`   Dispatches received: ${r.inward.receivedDispatches.map((d) => `${d.dispatchNumber}(${d.qty})`).join(', ')}`);
      }
      console.log('');
    });
  }

  console.log(`Full JSON report: ${jsonPath}\n`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
