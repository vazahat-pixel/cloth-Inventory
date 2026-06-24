const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log("Peek Store Stock Line:");
console.log(JSON.stringify(data.storeStockByStore[0].lines[0], null, 2));

console.log("\nPeek Warehouse Stock Line:");
console.log(JSON.stringify(data.warehouseStockByLocation[0].lines[0], null, 2));

console.log("\nPeek Invoice Line:");
const inv = data.salesByStore[0].invoices[0];
console.log(JSON.stringify({
    saleNumber: inv.saleNumber,
    date: inv.date,
    customer: inv.customer,
    netAmount: inv.netAmount,
    itemsCount: inv.items?.length
}, null, 2));
if (inv.items && inv.items.length > 0) {
    console.log("Invoice item sample:", JSON.stringify(inv.items[0], null, 2));
}
