const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../reports/store_sales_stock_report.json');
if (!fs.existsSync(filePath)) {
    console.log("File not found:", filePath);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
console.log("Keys of store_sales_stock_report.json:", Object.keys(data));

// Let's search for the GTB store ID: 69ecb1d9f04d7249bd11adf4
const storeId = "69ecb1d9f04d7249bd11adf4";

// Search within the JSON for storeId
function searchObj(obj, pathStr = "") {
    if (!obj) return;
    if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
            obj.forEach((item, idx) => {
                searchObj(item, `${pathStr}[${idx}]`);
            });
        } else {
            if (obj.storeId === storeId || obj.id === storeId || obj._id === storeId) {
                console.log(`Found GTB Nagar store at path ${pathStr}:`, JSON.stringify(obj).substring(0, 1000));
            }
            Object.keys(obj).forEach(k => {
                searchObj(obj[k], pathStr ? `${pathStr}.${k}` : k);
            });
        }
    }
}

searchObj(data);
