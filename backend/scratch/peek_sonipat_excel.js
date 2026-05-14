const XLSX = require('xlsx');
const path = require('path');

const filePath = "C:\\Users\\hp\\Downloads\\SONIPAT CLOSING STOCK1305.xlsx";

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Total Rows in Excel: ${rows.length}`);
    if (rows.length > 0) {
        console.log("First 3 rows:", rows.slice(0, 3));
        const keys = Object.keys(rows[0]);
        console.log("Column Headers:", keys);
    }
} catch (e) {
    console.error("Error reading file:", e);
}
