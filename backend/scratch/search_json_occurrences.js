const fs = require('fs');
const path = require('path');

function run() {
    const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
    if (!fs.existsSync(reportPath)) {
        console.error(`Report file not found at: ${reportPath}`);
        return;
    }

    console.log("Reading report file...");
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    console.log("Keys in reportData:", Object.keys(reportData));

    // Let's search the JSON for PTM-0028
    // We can do a string search on the raw file or search the object
    const rawContent = fs.readFileSync(reportPath, 'utf8');
    
    // Find occurrences of PTM-0028 in the raw JSON text
    let pos = 0;
    let matchCount = 0;
    while ((pos = rawContent.indexOf('PTM-0028', pos)) !== -1) {
        matchCount++;
        const start = Math.max(0, pos - 100);
        const end = Math.min(rawContent.length, pos + 200);
        console.log(`\nMatch ${matchCount} at position ${pos}:`);
        console.log(rawContent.substring(start, end).replace(/\n/g, ' '));
        pos += 'PTM-0028'.length;
    }
}

run();
