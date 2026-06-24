const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const uniqueItemCodes = new Set();
const uniqueSkus = new Set();

// Scan store stocks
data.storeStockByStore.forEach(store => {
    store.lines.forEach(line => {
        const sku = line.sku;
        const parts = sku.split('-');
        const itemCode = parts[0];
        uniqueItemCodes.add(itemCode);
        uniqueSkus.add(sku);
    });
});

// Scan warehouse stocks
data.warehouseStockByLocation.forEach(wh => {
    wh.lines.forEach(line => {
        const sku = line.sku;
        const parts = sku.split('-');
        const itemCode = parts[0];
        uniqueItemCodes.add(itemCode);
        uniqueSkus.add(sku);
    });
});

console.log("Unique Item Codes in Report:", uniqueItemCodes.size);
console.log("Unique SKUs in Report:", uniqueSkus.size);

const sampleCodes = Array.from(uniqueItemCodes).slice(0, 10);
console.log("Sample Item Codes:", sampleCodes);
