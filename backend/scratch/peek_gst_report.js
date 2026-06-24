const XLSX = require('xlsx');
const filePath = 'C:\\Users\\admin\\Downloads\\GST_Statutory_Report_2026-05-16_to_2026-06-15.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    console.log("Sheet Names:", workbook.SheetNames);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log("Rows Count:", rows.length);
    if (rows.length > 0) {
        console.log("Row 1 keys:", Object.keys(rows[0]));
        console.log("Row 1 sample:", rows[0]);
    }
} catch (e) {
    console.error(e);
}
