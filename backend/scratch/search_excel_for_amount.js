const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const downloadsDir = 'C:\\Users\\admin\\Downloads';
const files = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.xlsx'));

console.log(`Searching ${files.length} Excel files in Downloads...\n`);

files.forEach(file => {
    const filePath = path.join(downloadsDir, file);
    try {
        const workbook = XLSX.readFile(filePath);
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            rows.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    const cellStr = String(cell);
                    // Look for 18718 or 18718.00 or GTB Nagar or STR-003 or STR003
                    if (cellStr.includes('18718') || cellStr.includes('GTB') || cellStr.includes('STR-003')) {
                        console.log(`[File: ${file}] [Sheet: ${sheetName}] [Row: ${rowIndex + 1}, Col: ${colIndex + 1}]: ${cellStr}`);
                    }
                });
            });
        });
    } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
    }
});
console.log("\nSearch complete.");
