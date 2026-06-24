const fs = require('fs');
const path = require('path');

const uniqueItemCodes = new Set();
const uniqueSkus = new Set();

function processReport(fileName) {
    const filePath = path.join(__dirname, '../reports/full', fileName);
    if (!fs.existsSync(filePath)) return;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.storeStockByStore?.forEach(store => {
        store.lines.forEach(line => {
            const sku = line.sku;
            const parts = sku.split('-');
            const itemCode = parts[0];
            uniqueItemCodes.add(itemCode);
            uniqueSkus.add(sku);
        });
    });
    
    data.warehouseStockByLocation?.forEach(wh => {
        wh.lines.forEach(line => {
            const sku = line.sku;
            const parts = sku.split('-');
            const itemCode = parts[0];
            uniqueItemCodes.add(itemCode);
            uniqueSkus.add(sku);
        });
    });
}

processReport('complete-report-2026-06-19.json');
console.log("After 19-June report: ItemCodes:", uniqueItemCodes.size, "SKUs:", uniqueSkus.size);

processReport('complete-report-2026-06-17.json');
console.log("After adding 17-June report: ItemCodes:", uniqueItemCodes.size, "SKUs:", uniqueSkus.size);
