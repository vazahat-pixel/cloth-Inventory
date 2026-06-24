const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let total = 0;
data.salesByStore.forEach(store => {
    total += store.invoices.length;
});
console.log("Total Invoices in Report:", total);
