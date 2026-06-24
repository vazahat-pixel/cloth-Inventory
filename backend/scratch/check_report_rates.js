const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let nonZeroRatesCount = 0;
let linesCount = 0;

data.storeStockByStore.forEach(store => {
    store.lines.forEach(line => {
        linesCount++;
        if (line.rate > 0) nonZeroRatesCount++;
    });
});

console.log("Store Stock Lines Count:", linesCount);
console.log("Store Stock Non-Zero Rates Count:", nonZeroRatesCount);
