const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../reports/store_sales_stock_report.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log("JSON Keys:", Object.keys(data));
for (const key of Object.keys(data)) {
    if (Array.isArray(data[key])) {
        console.log(`- ${key}: Array of length ${data[key].length}`);
        if (data[key].length > 0) {
            console.log(`  Sample:`, JSON.stringify(data[key][0]).substring(0, 300));
        }
    } else {
        console.log(`- ${key}:`, typeof data[key]);
    }
}
