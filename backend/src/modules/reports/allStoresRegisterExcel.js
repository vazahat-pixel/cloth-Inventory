const XLSX = require('xlsx');

const num = (v) => (v == null || v === '' ? '' : Number(v));

const buildSummaryRows = (report) => {
  const months = report.period.months;
  const header = [
    'Store',
    'Store Code',
    'Opening Qty',
    'Opening Ledger Qty',
    'Import Date',
    ...months.flatMap((m) => [
      `${m.label} Inward`,
      `${m.label} Sale Qty`,
      `${m.label} Sale Net Qty`,
      `${m.label} Sale Amount`,
      `${m.label} Exchange`,
      `${m.label} Purchase Return`,
      `${m.label} Store to HO`,
    ]),
    'Total Inward',
    'Total Sale Qty',
    'Total Sale Net Qty',
    'Total Sale Amount',
    'Total Exchange',
    'Total Purchase Return',
    'Total Store to HO',
    'Closing Qty',
    'Expected Closing',
    'Gap',
    'Status',
  ];

  const dataRows = report.stores.map((s) => {
    const monthCells = s.months.flatMap((m) => [
      m.inward.inwardQty,
      m.sales.saleQty,
      m.sales.saleNetQty,
      m.sales.saleAmount,
      m.exchangeQty,
      m.purchaseReturn.purchaseReturnQty,
      m.storeToHO.storeToHOQty,
    ]);
    const status =
      s.closingGap === 0 ? 'MATCH' : s.closingGap == null ? '' : `GAP ${s.closingGap > 0 ? '+' : ''}${s.closingGap}`;
    return [
      s.storeName,
      s.storeCode,
      num(s.openingQty),
      num(s.openingLedgerQty),
      s.importDate || '',
      ...monthCells.map(num),
      num(s.totals.inwardQty),
      num(s.totals.saleQty),
      num(s.totals.saleNetQty),
      num(s.totals.saleAmount),
      num(s.totals.exchangeQty),
      num(s.totals.purchaseReturnQty),
      num(s.totals.storeToHOQty),
      num(s.closingQty),
      num(s.expectedClosingQty),
      num(s.closingGap),
      status,
    ];
  });

  const g = report.grandTotals;
  const grandRow = [
    'GRAND TOTAL',
    '',
    num(g.openingQty),
    '',
    '',
    ...months.flatMap(() => ['', '', '', '', '', '', '']),
    num(g.inwardQty),
    num(g.saleQty),
    num(g.saleNetQty),
    num(g.saleAmount),
    num(g.exchangeQty),
    num(g.purchaseReturnQty),
    num(g.storeToHOQty),
    num(g.closingQty),
    '',
    '',
    '',
  ];

  return [header, ...dataRows, grandRow];
};

const buildMonthlyDetailRows = (report) => {
  const header = [
    'Store',
    'Store Code',
    'Month',
    'Inward (Challan Date)',
    'Inward Challan Count',
    'Inward (Ledger Posted)',
    'Sale Qty (Register)',
    'Sale Net Qty',
    'Sale Amount',
    'Exchange Qty',
    'Purchase Return',
    'Store to HO',
    'Sale (Ledger OUT)',
    'Store to HO (Ledger)',
  ];

  const rows = [header];
  for (const s of report.stores) {
    for (const m of s.months) {
      rows.push([
        s.storeName,
        s.storeCode,
        m.label,
        num(m.inward.inwardQty),
        num(m.inward.dispatchCount),
        num(m.inwardLedgerQty),
        num(m.sales.saleQty),
        num(m.sales.saleNetQty),
        num(m.sales.saleAmount),
        num(m.exchangeQty),
        num(m.purchaseReturn.purchaseReturnQty),
        num(m.storeToHO.storeToHOQty),
        num(m.saleLedgerQty),
        num(m.storeToHOLedgerQty),
      ]);
    }
  }
  return rows;
};

const buildInfoRows = (report) => {
  const m = report.methodology || {};
  return [
    ['ALL STORES REGISTER REPORT'],
    ['Generated At', report.generatedAt],
    ['Period From', report.period.from],
    ['Period To', report.period.to],
    [],
    ['METHODOLOGY'],
    ['Opening', m.opening || ''],
    ['Inward', m.inward || ''],
    ['Inward Ledger', m.inwardLedger || ''],
    ['Sale Qty', m.saleQty || ''],
    ['Sale Amount', m.saleAmount || ''],
    ['Store to HO', m.storeToHO || ''],
  ];
};

/**
 * Build xlsx workbook from register report JSON.
 */
const buildAllStoresRegisterWorkbook = (report) => {
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet(buildSummaryRows(report));
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  const detailSheet = XLSX.utils.aoa_to_sheet(buildMonthlyDetailRows(report));
  XLSX.utils.book_append_sheet(wb, detailSheet, 'Monthly Detail');

  const infoSheet = XLSX.utils.aoa_to_sheet(buildInfoRows(report));
  XLSX.utils.book_append_sheet(wb, infoSheet, 'Info');

  return wb;
};

const writeAllStoresRegisterExcel = (report, filePath) => {
  const wb = buildAllStoresRegisterWorkbook(report);
  XLSX.writeFile(wb, filePath);
  return filePath;
};

module.exports = {
  buildAllStoresRegisterWorkbook,
  writeAllStoresRegisterExcel,
};
