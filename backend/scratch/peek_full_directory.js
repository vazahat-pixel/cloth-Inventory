const XLSX = require('xlsx');

const filePath = "C:\\Users\\hp\\Downloads\\7baa46a6c5e3445f9e2c9ef6f51e1bd6 (1).xlsx";

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);
    
    console.log("Rows 2 to 5 in Excel:");
    console.log(rows.slice(1, 5));
} catch (e) {
    console.error("Error reading file:", e);
}
