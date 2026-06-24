const fs = require('fs');
const path = require('path');

function run() {
    const csvPath = path.join(__dirname, '../reports/full/all-sales-detail-2026-06-19.csv');
    if (!fs.existsSync(csvPath)) {
        console.error(`CSV file not found at: ${csvPath}`);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n');

    console.log("=== Searching for PTM-0028 and PTM-0041 in CSV ===");
    
    // Print the header line first
    if (lines.length > 0) {
        console.log(`Header: ${lines[0]}`);
    }

    let foundLines = 0;
    lines.forEach((line, index) => {
        if (line.includes('PTM-0028') || line.includes('PTM-0041')) {
            console.log(`Line ${index + 1}: ${line}`);
            foundLines++;
        }
    });

    console.log(`\nFound ${foundLines} matching lines in CSV.`);
}

run();
