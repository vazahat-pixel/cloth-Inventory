const XLSX = require('xlsx');

const filePath = "C:\\Users\\hp\\Downloads\\7baa46a6c5e3445f9e2c9ef6f51e1bd6 (1).xlsx";

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);
    
    const targets = ["DA2472", "DA2470", "DA2754", "DA3059", "DA3423"];
    
    console.log("Checking targets in Item Directory...");
    for (const r of rows) {
        const code = String(r['ITEM DIRECTORY_12'] || '').trim().toUpperCase();
        if (targets.includes(code)) {
            console.log(`- Found Match: ${code} | Name: ${r['ITEM DIRECTORY_13']} | Size: ${r['ITEM DIRECTORY_16']} | MRP: ${r['ITEM DIRECTORY_18']}`);
        }
    }
} catch (e) {
    console.error("Error reading file:", e);
}
