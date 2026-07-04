const Store = require('../../models/store.model');
const StoreInventory = require('../../models/storeInventory.model');
const Sale = require('../../models/sale.model');
const Dispatch = require('../../models/dispatch.model');
const StockReturn = require('../../models/stockReturn.model');
const PurchaseReturn = require('../../models/purchaseReturn.model');
const StockLedger = require('../../models/stockLedger.model');
const {
  aggregateRegisterTotals,
  aggregateSalesQty,
} = require('../../utils/saleReportUtils');

const RETAIL_SALE_MATCH = {
  isDeleted: false,
  status: { $nin: ['CANCELLED', 'REFUNDED'] },
  $or: [{ type: { $exists: false } }, { type: { $nin: ['INTERNAL_SALE'] } }],
};

const INWARD_LEDGER_SOURCES = ['DISPATCH', 'TRANSFER', 'DELIVERYCHALLAN'];
const STORE_HO_LEDGER_SOURCES = ['STOCKRETURN', 'STOCK_RETURN'];

/** Day-1 opening stock at import (business record) */
const OPENING_STOCK_MAP = {
  'gtb nagar': { qty: 2962, importDate: '2026-05-13' },
  pitampura: { qty: 3182, importDate: '2026-06-03' },
  sonipat: { qty: 2884, importDate: '2026-05-16' },
  shahjahanpur: { qty: 2817, importDate: '2026-05-16' },
  sahibabad: { qty: 3457, importDate: '2026-05-25' },
  bhopal: { qty: 1754, importDate: '2026-06-01' },
  muktsar: { qty: 3806, importDate: '2026-06-02' },
  hanumangarh: { qty: 2407, importDate: '2026-06-02' },
};

const BUSINESS_STORE_FILTER = /REBEL|SHRI KRISHNA/i;

const matchStoreKey = (storeName = '') => {
  const lower = storeName.toLowerCase();
  return Object.keys(OPENING_STOCK_MAP).find((key) => lower.includes(key)) || null;
};

const toUtcStart = (ymd) => new Date(`${ymd}T00:00:00.000Z`);
const toUtcEnd = (ymd) => new Date(`${ymd}T23:59:59.999Z`);

const inRange = (date, start, end) => date && date >= start && date <= end;

const sumDispatchItems = (dispatches = []) =>
  dispatches.reduce(
    (total, d) =>
      total + (d.items || []).reduce((s, i) => s + Number(i.qty || i.quantity || 0), 0),
    0,
  );

const sumStockReturnItems = (returns = []) =>
  returns.reduce(
    (total, r) =>
      total + (r.items || []).reduce((s, i) => s + Number(i.qty || i.quantity || 0), 0),
    0,
  );

const sumPurchaseReturnItems = (returns = []) =>
  returns.reduce(
    (total, r) =>
      total + (r.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0),
    0,
  );

const monthRange = (year, month, endDay = null) => {
  const lastDay = endDay || new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mm = String(month).padStart(2, '0');
  const ddEnd = String(lastDay).padStart(2, '0');
  return {
    key: `${year}-${mm}`,
    label: new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-IN', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    start: toUtcStart(`${year}-${mm}-01`),
    end: toUtcEnd(`${year}-${mm}-${ddEnd}`),
  };
};

const defaultPeriods = () => {
  // Use today's UTC date as the end day for the current (partial) month
  // so the report always includes data up to today without needing manual updates.
  const today = new Date();
  const todayUTCDay = today.getUTCDate();
  const todayUTCMonth = today.getUTCMonth() + 1; // 1-based
  const todayUTCYear = today.getUTCFullYear();

  // July 2026 end = today's day (if still in July 2026), else full month
  const julyEndDay = (todayUTCYear === 2026 && todayUTCMonth === 7)
    ? todayUTCDay
    : null; // null = full month

  return [
    monthRange(2026, 5),
    monthRange(2026, 6),
    monthRange(2026, 7, julyEndDay),
  ];
};

const bucketDispatchesByMonth = (dispatches, range) => {
  const matched = dispatches.filter((d) => inRange(d.createdAt, range.start, range.end));
  return {
    month: range.key,
    label: range.label,
    inwardQty: sumDispatchItems(matched),
    dispatchCount: matched.length,
    dateBasis: 'challanCreatedAt',
  };
};

const bucketReturnsByMonth = (returns, range, qtyFn, dateField = 'createdAt') => {
  const matched = returns.filter((r) => {
    const dt = r[dateField] || r.createdAt;
    return inRange(dt, range.start, range.end);
  });
  return {
    month: range.key,
    label: range.label,
    qty: qtyFn(matched),
    count: matched.length,
  };
};

const buildMonthSales = async (storeId, range) => {
  const sid = String(storeId);
  const saleDateSales = await Sale.find({
    ...RETAIL_SALE_MATCH,
    storeId,
    saleDate: { $gte: range.start, $lte: range.end },
  }).lean();

  const entryDateSales = await Sale.find({
    ...RETAIL_SALE_MATCH,
    storeId,
    createdAt: { $gte: range.start, $lte: range.end },
  }).lean();

  const register = aggregateRegisterTotals(saleDateSales, entryDateSales, sid);
  const entryBreakdown = aggregateSalesQty(entryDateSales);

  return {
    month: range.key,
    label: range.label,
    saleQty: register.registerSaleQty,
    saleNetQty: register.registerNetSaleQty,
    saleAmount: register.registerSaleAmount,
    exchangeQty: entryBreakdown.exchangeQty,
    billsEntered: entryDateSales.length,
    billsSaleDate: saleDateSales.length,
  };
};

const buildLedgerMonthly = async (storeId, periods) => {
  const periodStart = periods[0].start;
  const periodEnd = periods[periods.length - 1].end;

  const rows = await StockLedger.find({
    locationId: storeId,
    locationType: 'STORE',
    createdAt: { $gte: periodStart, $lte: periodEnd },
  })
    .select('type source quantity createdAt')
    .lean();

  const byMonth = {};
  for (const p of periods) {
    byMonth[p.key] = {
      inwardDispatch: 0,
      saleOut: 0,
      storeToHO: 0,
      purchaseReturn: 0,
      exchangeIn: 0,
    };
  }

  for (const r of rows) {
    const mk = `${r.createdAt.getUTCFullYear()}-${String(r.createdAt.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[mk]) continue;
    const q = Number(r.quantity || 0);
    if (r.type === 'IN' && INWARD_LEDGER_SOURCES.includes(r.source)) {
      byMonth[mk].inwardDispatch += q;
    }
    if (r.type === 'OUT' && r.source === 'SALE') byMonth[mk].saleOut += q;
    if (r.type === 'OUT' && STORE_HO_LEDGER_SOURCES.includes(r.source)) {
      byMonth[mk].storeToHO += q;
    }
    if (r.type === 'OUT' && r.source === 'PURCHASE_RETURN') {
      byMonth[mk].purchaseReturn += q;
    }
    if (r.type === 'IN' && ['SALE', 'SALES_RETURN', 'SALESRETURN'].includes(r.source)) {
      byMonth[mk].exchangeIn += q;
    }
  }

  return byMonth;
};

const resolveOpeningStock = async (store) => {
  const storeKey = matchStoreKey(store.name);

  const [ledger] = await StockLedger.aggregate([
    {
      $match: {
        locationId: store._id,
        locationType: 'STORE',
        source: 'OPENING_BALANCE',
        type: 'IN',
      },
    },
    { $group: { _id: null, qty: { $sum: '$quantity' } } },
  ]);

  const ledgerOpening = ledger?.qty || 0;
  const importOpening = storeKey ? OPENING_STOCK_MAP[storeKey].qty : null;

  return {
    storeKey,
    openingQty: importOpening ?? (ledgerOpening || null),
    openingImportQty: importOpening,
    openingLedgerQty: ledgerOpening,
    importDate: storeKey ? OPENING_STOCK_MAP[storeKey].importDate : null,
    openingSource: importOpening != null ? 'IMPORT_OPENING' : ledgerOpening ? 'LEDGER' : 'UNKNOWN',
  };
};

const summarizeStore = async (store, periods) => {
  const storeId = store._id;
  const opening = await resolveOpeningStock(store);

  const [closingAgg, allDispatches, allStockReturns, allPurchaseReturns, ledgerByMonth] =
    await Promise.all([
      StoreInventory.aggregate([
        { $match: { storeId } },
        { $group: { _id: null, closing: { $sum: '$quantityAvailable' } } },
      ]),
      Dispatch.find({ destinationStoreId: storeId, status: 'RECEIVED' })
        .select('dispatchNumber createdAt dispatchedAt receivedAt items')
        .lean(),
      StockReturn.find({
        sourceStoreId: storeId,
        status: { $in: ['DISPATCHED', 'RECEIVED', 'SENT', 'PENDING'] },
      })
        .select('returnNumber createdAt initiatedAt items')
        .lean(),
      PurchaseReturn.find({
        locationId: storeId,
        locationType: 'STORE',
        status: 'COMPLETED',
      }).lean(),
      buildLedgerMonthly(storeId, periods),
    ]);

  const monthlyInward = periods.map((p) => bucketDispatchesByMonth(allDispatches, p));
  const monthlyStoreToHO = periods.map((p) => {
    const b = bucketReturnsByMonth(allStockReturns, p, sumStockReturnItems, 'initiatedAt');
    return {
      month: b.month,
      label: b.label,
      storeToHOQty: b.qty,
      returnCount: b.count,
      dateBasis: 'initiatedAt',
    };
  });
  const monthlyPurchaseReturn = periods.map((p) => {
    const b = bucketReturnsByMonth(allPurchaseReturns, p, sumPurchaseReturnItems);
    return {
      month: b.month,
      label: b.label,
      purchaseReturnQty: b.qty,
      returnCount: b.count,
    };
  });
  const monthlySales = await Promise.all(periods.map((p) => buildMonthSales(storeId, p)));

  const closingQty = closingAgg[0]?.closing || 0;

  const totals = {
    inwardQty: monthlyInward.reduce((n, m) => n + m.inwardQty, 0),
    inwardLedgerQty: Object.values(ledgerByMonth).reduce((n, m) => n + m.inwardDispatch, 0),
    saleQty: monthlySales.reduce((n, m) => n + m.saleQty, 0),
    saleNetQty: monthlySales.reduce((n, m) => n + m.saleNetQty, 0),
    saleAmount: monthlySales.reduce((n, m) => n + m.saleAmount, 0),
    saleLedgerQty: Object.values(ledgerByMonth).reduce((n, m) => n + m.saleOut, 0),
    exchangeQty: monthlySales.reduce((n, m) => n + m.exchangeQty, 0),
    purchaseReturnQty: monthlyPurchaseReturn.reduce((n, m) => n + m.purchaseReturnQty, 0),
    storeToHOQty: monthlyStoreToHO.reduce((n, m) => n + m.storeToHOQty, 0),
    storeToHOLedgerQty: Object.values(ledgerByMonth).reduce((n, m) => n + m.storeToHO, 0),
  };

  const expectedClosing =
    opening.openingQty != null
      ? opening.openingQty +
        totals.inwardQty -
        totals.saleNetQty -
        totals.storeToHOQty -
        totals.purchaseReturnQty
      : null;

  return {
    storeId: String(storeId),
    storeName: store.name,
    storeCode: store.storeCode || store.code || '',
    openingQty: opening.openingQty,
    openingImportQty: opening.openingImportQty,
    openingLedgerQty: opening.openingLedgerQty,
    openingSource: opening.openingSource,
    importDate: opening.importDate,
    closingQty,
    expectedClosingQty: expectedClosing,
    closingGap: expectedClosing != null ? closingQty - expectedClosing : null,
    months: periods.map((p, i) => ({
      month: p.key,
      label: p.label,
      inward: monthlyInward[i],
      inwardLedgerQty: ledgerByMonth[p.key]?.inwardDispatch || 0,
      sales: monthlySales[i],
      saleLedgerQty: ledgerByMonth[p.key]?.saleOut || 0,
      exchangeQty: monthlySales[i].exchangeQty,
      purchaseReturn: monthlyPurchaseReturn[i],
      storeToHO: monthlyStoreToHO[i],
      storeToHOLedgerQty: ledgerByMonth[p.key]?.storeToHO || 0,
    })),
    totals,
    ledgerNote:
      'Ledger dates reflect when stock was posted (post DB recovery). Challan inward uses original dispatch createdAt.',
  };
};

/**
 * All-stores monthly register report — May 1 onwards, real DB + ledger cross-check.
 */
const getAllStoresRegisterReport = async (opts = {}) => {
  const periods = opts.periods?.length ? opts.periods : defaultPeriods();
  const stores = await Store.find({ isActive: { $ne: false }, isDeleted: { $ne: true } })
    .sort({ name: 1 })
    .lean();

  let filtered = stores.filter((s) => BUSINESS_STORE_FILTER.test(s.name));
  if (opts.storeFilter) {
    filtered = filtered.filter((s) =>
      s.name.toLowerCase().includes(String(opts.storeFilter).toLowerCase()),
    );
  }

  const storeReports = [];
  for (const store of filtered) {
    // eslint-disable-next-line no-await-in-loop
    storeReports.push(await summarizeStore(store, periods));
  }

  const grand = {
    openingQty: storeReports.reduce((n, s) => n + (s.openingQty || 0), 0),
    closingQty: storeReports.reduce((n, s) => n + s.closingQty, 0),
    inwardQty: storeReports.reduce((n, s) => n + s.totals.inwardQty, 0),
    saleQty: storeReports.reduce((n, s) => n + s.totals.saleQty, 0),
    saleNetQty: storeReports.reduce((n, s) => n + s.totals.saleNetQty, 0),
    saleAmount: storeReports.reduce((n, s) => n + s.totals.saleAmount, 0),
    exchangeQty: storeReports.reduce((n, s) => n + s.totals.exchangeQty, 0),
    purchaseReturnQty: storeReports.reduce((n, s) => n + s.totals.purchaseReturnQty, 0),
    storeToHOQty: storeReports.reduce((n, s) => n + s.totals.storeToHOQty, 0),
  };

  const periodEnd = periods[periods.length - 1]?.end;
  const periodStart = periods[0]?.start;

  return {
    generatedAt: new Date().toISOString(),
    period: {
      from: periodStart?.toISOString().slice(0, 10),
      to: periodEnd?.toISOString().slice(0, 10),
      months: periods.map((p) => ({ key: p.key, label: p.label })),
    },
    methodology: {
      opening: 'Business import opening (IMPORT_OPENING map); ledger opening shown for cross-check',
      inward:
        'HO dispatch RECEIVED — month from challan createdAt (original date, survives DB recovery)',
      inwardLedger:
        'StockLedger IN (DISPATCH/TRANSFER/DELIVERYCHALLAN) — system posting date',
      saleQty: 'Register bills entered (createdAt), gross qty',
      saleAmount: 'saleDate register ₹ excluding phantom + exchange bills',
      storeToHO: 'StockReturn initiatedAt month (business date)',
    },
    grandTotals: grand,
    stores: storeReports,
  };
};

module.exports = {
  OPENING_STOCK_MAP,
  defaultPeriods,
  getAllStoresRegisterReport,
};
