const fs = require('fs');
const path = require('path');

const SRC_ROOT = path.join(__dirname, '..', 'src');

const TARGET_FILES = [
  'modules/reports/SalesReportPage.jsx',
  'modules/reports/CollectionReportPage.jsx',
  'modules/reports/LedgerReportPage.jsx',
  'modules/reports/BankBookPage.jsx',
  'modules/reports/PurchaseReportPage.jsx',
  'modules/reports/DailyInwardReportPage.jsx',
  'modules/reports/saleReportUtils.js',
  'modules/sales/SalesListPage.jsx',
  'modules/inventory/StockAuditView.jsx',
  'modules/shared/AccountEntryDialog.jsx',
  'modules/gst/InvoiceTaxReportPage.jsx',
  'modules/inventory/MovementHistoryPage.jsx',
  'modules/sales/SaleChallanPrint.jsx',
  'modules/items/components/OpeningStockPage.jsx',
  'modules/grn/components/BulkInventoryUploadDialog.jsx',
  'modules/setup/SetupCustomFieldsAccountsPage.jsx',
];

function depthImport(file) {
  const rel = path.relative(SRC_ROOT, file).split(path.sep);
  const depth = rel.length - 1;
  return `import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '${'../'.repeat(depth)}utils/formatters';`;
}

const replacements = [
  [/<TableCell>\{row\.date\}<\/TableCell>/g, '<TableCell>{formatDateDDMMYYYY(row.date)}</TableCell>'],
  [/<TableCell>\{r\.date\}<\/TableCell>/g, '<TableCell>{formatDateDDMMYYYY(r.date)}</TableCell>'],
  [/<TableCell>\{e\.date\}<\/TableCell>/g, '<TableCell>{formatDateDDMMYYYY(e.date)}</TableCell>'],
  [/<TableCell>\{movement\.date\}<\/TableCell>/g, '<TableCell>{formatDateDDMMYYYY(movement.date)}</TableCell>'],
  [/<TableCell>\{row\.billDate\}<\/TableCell>/g, '<TableCell>{formatDateDDMMYYYY(row.billDate)}</TableCell>'],
  [/Date: row\.date/g, 'Date: formatDateDDMMYYYY(row.date)'],
  [/Date: r\.date/g, 'Date: formatDateDDMMYYYY(r.date)'],
  [/Date: e\.date/g, 'Date: formatDateDDMMYYYY(e.date)'],
  [/Date: row\.billDate/g, 'Date: formatDateDDMMYYYY(row.billDate)'],
  [/DATE: row\.date/g, 'DATE: formatDateDDMMYYYY(row.date)'],
  [/date_time: row\.createdAt \? formatDateTimeDDMMYYYY\(row\.createdAt\) : row\.dateTime/g, 'date_time: row.createdAt ? formatDateTimeDDMMYYYY(row.createdAt) : formatDateDDMMYYYY(row.dateTime)'],
];

let changed = 0;
for (const rel of TARGET_FILES) {
  const file = path.join(SRC_ROOT, rel);
  if (!fs.existsSync(file)) continue;
  let next = fs.readFileSync(file, 'utf8');
  let src = next;
  for (const [re, rep] of replacements) {
    next = next.replace(re, rep);
  }

  // Manual one-offs
  if (rel.includes('SaleChallanPrint')) {
    next = next.replace(
      /new Date\(challan\.createdAt \|\| challan\.date \|\| Date\.now\(\)\)\.toLocaleDateString\('en-IN'\)/,
      'formatDateDDMMYYYY(challan.createdAt || challan.date || Date.now())',
    );
  }
  if (rel.includes('OpeningStockPage')) {
    next = next.replace(
      /new Date\(\)\.toLocaleDateString\('en-IN'\)/,
      'formatDateDDMMYYYY(new Date())',
    );
  }
  if (rel.includes('BulkInventoryUploadDialog')) {
    next = next.replace(
      /new Date\(\)\.toLocaleString\(\)/,
      'formatDateTimeDDMMYYYY(new Date())',
    );
  }
  if (rel.includes('SetupCustomFieldsAccountsPage')) {
    next = next.replace(
      /new Date\(\)\.toLocaleString\('en-IN', \{ hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true \}\)/,
      "formatDateTimeDDMMYYYY(new Date())",
    );
  }

  if (next === src) continue;

  if (!/from ['"].*utils\/formatters['"]/.test(next)) {
    const importStmt = depthImport(file);
    const match = next.match(/^import .+;$/m);
    if (match) {
      const idx = next.indexOf(match[0]);
      const lineEnd = next.indexOf('\n', idx);
      next = `${next.slice(0, lineEnd + 1)}${importStmt}\n${next.slice(lineEnd + 1)}`;
    } else {
      next = `${importStmt}\n${next}`;
    }
  }

  fs.writeFileSync(file, next);
  changed += 1;
  console.log('updated', rel);
}
console.log('total', changed);
