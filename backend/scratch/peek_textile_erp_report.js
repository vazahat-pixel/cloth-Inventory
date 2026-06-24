const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\admin\\Downloads\\Textile_ERP_Report_2026-06-17.xlsx';
try {
    const workbook = XLSX.readFile(filePath);
    console.log("Sheet Names:", workbook.SheetNames);
    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        console.log(`Rows: ${rows.length}`);
        rows.forEach(r => {
            console.log(JSON.stringify(r));
        });
    });
} catch (e) {
    console.error(e);
}
