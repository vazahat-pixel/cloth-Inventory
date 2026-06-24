const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const inv = data.salesByStore[0].invoices[0];
console.log("Invoice Keys:", Object.keys(inv));
console.log("Invoice Sample:", JSON.stringify(inv, null, 2));
