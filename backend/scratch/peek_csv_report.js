const fs = require('fs');
const path = require('path');

const storeCsvPath = path.join(__dirname, '../reports/full/store-stock-detail-2026-06-19.csv');
const whCsvPath = path.join(__dirname, '../reports/full/warehouse-stock-detail-2026-06-19.csv');

if (fs.existsSync(storeCsvPath)) {
    console.log("Peek Store Stock CSV:");
    const lines = fs.readFileSync(storeCsvPath, 'utf8').split('\n').slice(0, 10);
    lines.forEach(l => console.log(l));
}

if (fs.existsSync(whCsvPath)) {
    console.log("\nPeek Warehouse Stock CSV:");
    const lines = fs.readFileSync(whCsvPath, 'utf8').split('\n').slice(0, 10);
    lines.forEach(l => console.log(l));
}
