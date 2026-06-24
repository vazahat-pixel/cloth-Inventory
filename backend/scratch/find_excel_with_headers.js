const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const downloadsDir = 'C:\\Users\\admin\\Downloads';
const targetHeaders = ['ITEM DIRECTORY_12', 'ITEM DIRECTORY_13', 'ITEM DIRECTORY_1', 'ITEM DIRECTORY_16'];

function checkFiles() {
    try {
        console.log(`Scanning directory: ${downloadsDir}`);
        const files = fs.readdirSync(downloadsDir);
        const xlsxFiles = files.filter(f => f.endsWith('.xlsx'));
        
        console.log(`Found ${xlsxFiles.length} xlsx files in Downloads.`);
        
        for (const file of xlsxFiles) {
            const filePath = path.join(downloadsDir, file);
            try {
                console.log(`Checking file: ${file}`);
                const workbook = XLSX.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (rows.length > 0) {
                    const firstRow = rows[0].map(c => String(c).trim().toUpperCase());
                    console.log(`First row in ${file}:`, firstRow.slice(0, 20));
                    
                    // Also check if any key matches target headers in json format
                    const rowsJson = XLSX.utils.sheet_to_json(worksheet);
                    if (rowsJson.length > 0) {
                        const keys = Object.keys(rowsJson[0]);
                        const matchedKeys = keys.filter(k => targetHeaders.includes(k));
                        if (matchedKeys.length > 0) {
                            console.log(`✨ MATCH FOUND in ${file}! Keys matched:`, matchedKeys);
                        }
                    }
                }
            } catch (e) {
                console.log(`Error checking file ${file}: ${e.message}`);
            }
        }
    } catch (e) {
        console.error('Error scanning downloads directory:', e.message);
    }
}

checkFiles();
