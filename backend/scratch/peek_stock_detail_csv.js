const fs = require('fs');
const path = require('path');

function run() {
    const csvPath = path.join(__dirname, '../reports/full/store-stock-detail-2026-06-19.csv');
    if (!fs.existsSync(csvPath)) {
        console.error(`CSV file not found at: ${csvPath}`);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n');

    console.log("=== CSV Header ===");
    if (lines.length > 0) console.log(lines[0]);

    console.log("\n=== First 10 Pitampura Lines in CSV ===");
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].includes('PITAMPURA')) {
            console.log(lines[i]);
            count++;
            if (count >= 10) break;
        }
    }
}

run();
