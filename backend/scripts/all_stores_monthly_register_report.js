#!/usr/bin/env node
/**
 * All-stores monthly register report (May / June / July-3)
 * Usage: node scripts/all_stores_monthly_register_report.js [--endDate=2026-07-03]
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const {
  getAllStoresRegisterReport,
  defaultPeriods,
} = require('../src/modules/reports/allStoresRegisterReport.service');
const { writeAllStoresRegisterExcel } = require('../src/modules/reports/allStoresRegisterExcel');

const parseArgs = () => {
  const opts = {};
  process.argv.slice(2).forEach((arg) => {
    const [key, val] = arg.replace(/^--/, '').split('=');
    opts[key] = val || true;
  });
  return opts;
};

const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString('en-IN'));
const fmtAmt = (n) => (n == null ? '-' : `₹${Number(n).toLocaleString('en-IN')}`);

const buildCsv = (report) => {
  const months = report.period.months.map((m) => m.key);
  const header = [
    'Store',
    'Opening Qty',
    ...months.flatMap((m) => [
      `${m} Inward`,
      `${m} Sale Qty`,
      `${m} Sale Amount`,
      `${m} Exchange`,
    ]),
    'Total Inward',
    'Total Sale Qty',
    'Total Sale Amount',
    'Total Exchange',
    'Purchase Return',
    'Store to HO',
    'Closing Qty',
    'Expected Closing',
    'Gap',
  ];

  const rows = report.stores.map((s) => {
    const monthCells = s.months.flatMap((m) => [
      m.inward.inwardQty,
      m.sales.saleQty,
      m.sales.saleAmount,
      m.exchangeQty,
    ]);
    return [
      s.storeName,
      s.openingQty ?? '',
      ...monthCells,
      s.totals.inwardQty,
      s.totals.saleQty,
      s.totals.saleAmount,
      s.totals.exchangeQty,
      s.totals.purchaseReturnQty,
      s.totals.storeToHOQty,
      s.closingQty,
      s.expectedClosingQty ?? '',
      s.closingGap ?? '',
    ];
  });

  const escape = (v) => {
    const str = String(v ?? '');
    return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
  };

  return [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
};

const printStoreBlock = (s) => {
  console.log(`\n${'━'.repeat(72)}`);
  console.log(`🏪 ${s.storeName}${s.storeCode ? ` (${s.storeCode})` : ''}`);
  console.log(
    `   Opening (business)          : ${fmt(s.openingQty)} pcs  [import ${s.importDate || 'n/a'}]`,
  );
  if (s.openingLedgerQty != null && s.openingLedgerQty !== s.openingQty) {
    console.log(`   Opening (ledger DB)         : ${fmt(s.openingLedgerQty)} pcs`);
  }
  console.log(`   Closing Stock (live DB)     : ${fmt(s.closingQty)} pcs`);

  for (const m of s.months) {
    console.log(`\n   📅 ${m.label}`);
    console.log(
      `      Inward (challan date)    : +${fmt(m.inward.inwardQty)} pcs (${m.inward.dispatchCount} challans)`,
    );
    if (m.inwardLedgerQty && m.inwardLedgerQty !== m.inward.inwardQty) {
      console.log(`      Inward (ledger posted)   : +${fmt(m.inwardLedgerQty)} pcs`);
    }
    console.log(`      Sale Qty (register)      : -${fmt(m.sales.saleQty)} pcs  |  Net: ${fmt(m.sales.saleNetQty)}`);
    console.log(`      Sale Amount (saleDate)   : ${fmtAmt(m.sales.saleAmount)}`);
    console.log(`      Exchange                 : ${fmt(m.exchangeQty)} pcs`);
    console.log(`      Purchase Return          : ${fmt(m.purchaseReturn.purchaseReturnQty)} pcs`);
    console.log(`      Store → HO Return        : ${fmt(m.storeToHO.storeToHOQty)} pcs`);
  }

  console.log(`\n   📊 Period Totals`);
  console.log(`      Inward                 : +${fmt(s.totals.inwardQty)}`);
  console.log(`      Sale Qty               : -${fmt(s.totals.saleQty)} (net ${fmt(s.totals.saleNetQty)})`);
  console.log(`      Sale Amount            : ${fmtAmt(s.totals.saleAmount)}`);
  console.log(`      Exchange               : ${fmt(s.totals.exchangeQty)}`);
  console.log(`      Purchase Return        : ${fmt(s.totals.purchaseReturnQty)}`);
  console.log(`      Store → HO             : ${fmt(s.totals.storeToHOQty)}`);

  if (s.expectedClosingQty != null) {
    const gapStr =
      s.closingGap === 0 ? '✅ MATCH' : `⚠️  gap ${s.closingGap > 0 ? '+' : ''}${s.closingGap}`;
    console.log(`\n   Formula: ${s.openingQty} + ${s.totals.inwardQty} - ${s.totals.saleNetQty} - ${s.totals.storeToHOQty} - ${s.totals.purchaseReturnQty} = ${s.expectedClosingQty}  |  DB: ${s.closingQty}  ${gapStr}`);
  }
};

async function main() {
  const args = parseArgs();
  await mongoose.connect(process.env.MONGODB_URI);

  let periods = defaultPeriods();
  if (args.endDate && String(args.endDate).startsWith('2026-07')) {
    const endDay = Number(String(args.endDate).split('-')[2]) || 3;
    periods = [
      ...periods.slice(0, 2),
      {
        ...periods[2],
        end: new Date(`2026-07-${String(endDay).padStart(2, '0')}T23:59:59.999Z`),
      },
    ];
  }

  const report = await getAllStoresRegisterReport({ periods });

  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  ALL STORES — MONTHLY REGISTER REPORT (Opening → Inward → Sale)      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`\nPeriod: ${report.period.from} → ${report.period.to}`);
  console.log(`Generated: ${report.generatedAt}`);
  if (report.methodology) {
    console.log(`Inward: ${report.methodology.inward}`);
    console.log(`Ledger: ${report.methodology.inwardLedger}`);
  } else if (report.note) {
    console.log(`Note: ${report.note}`);
  }
  console.log('');

  report.stores.forEach(printStoreBlock);

  const g = report.grandTotals;
  console.log(`\n${'═'.repeat(72)}`);
  console.log('GRAND TOTAL (all stores)');
  console.log(`  Opening: ${fmt(g.openingQty)} | Inward: +${fmt(g.inwardQty)} | Sale: -${fmt(g.saleQty)} | Amount: ${fmtAmt(g.saleAmount)}`);
  console.log(`  Exchange: ${fmt(g.exchangeQty)} | Purchase Return: ${fmt(g.purchaseReturnQty)} | Store→HO: ${fmt(g.storeToHOQty)} | Closing: ${fmt(g.closingQty)}`);

  const outDir = path.join(__dirname, '../reports/all-stores');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const jsonPath = path.join(outDir, `all-stores-register-${stamp}.json`);
  const csvPath = path.join(outDir, `all-stores-register-${stamp}.csv`);
  const xlsxPath = path.join(outDir, `all-stores-register-${stamp}.xlsx`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(csvPath, buildCsv(report));
  writeAllStoresRegisterExcel(report, xlsxPath);

  console.log(`\n📁 JSON:  ${jsonPath}`);
  console.log(`📁 CSV:   ${csvPath}`);
  console.log(`📁 EXCEL: ${xlsxPath}\n`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
