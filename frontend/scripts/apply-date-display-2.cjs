const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

const patches = [
  ['modules/customers/CustomerRewardsPage.jsx', /<TableCell>\{row\.lastActivityDate \|\| '-'\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(row.lastActivityDate) || \'-\'}</TableCell>'],
  ['modules/gst/GSTRSummaryPage.jsx', /<TableCell>\{r\.invDate\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(r.invDate)}</TableCell>'],
  ['modules/inventory/StockAuditView.jsx', /<TableCell>\{row\.lastMovementDate\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(row.lastMovementDate)}</TableCell>'],
  ['modules/inventory/AuditLogViewer.jsx', /row\.dateTime/g, 'formatDateDDMMYYYY(row.dateTime)'],
  ['modules/reports/MovementReportPage.jsx', /<TableCell>\{row\.lastSoldDate \|\| '-'\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(row.lastSoldDate) || \'-\'}</TableCell>'],
  ['modules/reports/VendorReportPage.jsx', /<TableCell>\{row\.lastPurchaseDate \|\| '-'\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(row.lastPurchaseDate) || \'-\'}</TableCell>'],
  ['modules/reports/CustomerReportPage.jsx', /<TableCell>\{row\.lastPurchaseDate \|\| '-'\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(row.lastPurchaseDate) || \'-\'}</TableCell>'],
  ['modules/purchase/PurchaseOrderListPage.jsx', /<TableCell>\{row\.poDate\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(row.poDate)}</TableCell>'],
  ['modules/purchase/PurchaseOrderListPage.jsx', /<TableCell>\{row\.expectedDeliveryDate \|\| '--'\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(row.expectedDeliveryDate) || \'--\'}</TableCell>'],
  ['modules/setup/GroupsPage.jsx', /<TableCell>\{row\.createdAt \|\| '--'\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(row.createdAt) || \'--\'}</TableCell>'],
  ['modules/setup/GroupsPage.jsx', /<TableCell>\{row\.updatedAt \|\| '--'\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(row.updatedAt) || \'--\'}</TableCell>'],
  ['modules/customers/VoucherListPage.jsx', /<TableCell>\{row\.issueDate \|\| '-'\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(row.issueDate) || \'-\'}</TableCell>'],
  ['modules/customers/VoucherListPage.jsx', /<TableCell>\{row\.expiryDate \|\| '-'\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(row.expiryDate) || \'-\'}</TableCell>'],
  ['modules/customers/CreditNotesPage.jsx', /<TableCell>\{row\.issueDate \|\| '-'\}<\/TableCell>/, '<TableCell>{formatDateDDMMYYYY(row.issueDate) || \'-\'}</TableCell>'],
];

function addImport(content, file) {
  if (/from ['"].*utils\/formatters['"]/.test(content)) return content;
  const rel = path.relative(SRC, file).split(path.sep);
  const depth = rel.length - 1;
  const imp = `import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '${'../'.repeat(depth)}utils/formatters';`;
  const m = content.match(/^import .+;$/m);
  if (!m) return `${imp}\n${content}`;
  const idx = content.indexOf(m[0]);
  const lineEnd = content.indexOf('\n', idx);
  return `${content.slice(0, lineEnd + 1)}${imp}\n${content.slice(lineEnd + 1)}`;
}

let n = 0;
for (const [rel, re, rep] of patches) {
  const file = path.join(SRC, rel);
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (!re.test(content)) continue;
  content = content.replace(re, rep);
  content = addImport(content, file);
  fs.writeFileSync(file, content);
  n++;
  console.log('patched', rel);
}
console.log('done', n);
