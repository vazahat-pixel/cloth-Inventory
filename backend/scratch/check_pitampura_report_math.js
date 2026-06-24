const fs = require('fs');
const path = require('path');

function run() {
    const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const storeId = '69e86a235df4170210683604'; // Pitampura
    const rStore = reportData.storeStockByStore.find(s => String(s.storeId) === storeId);

    if (!rStore) {
        console.error("Pitampura store stock not found in report!");
        return;
    }

    let totalOpening = 0;
    let totalInward = 0; // received
    let totalSold = 0;
    let totalReturned = 0;
    let totalDamaged = 0;
    let totalClosing = 0;
    let totalInTransit = 0;

    rStore.lines.forEach(line => {
        totalOpening += (line.openingStock || 0);
        totalInward += (line.received || 0);
        totalSold += (line.sold || 0);
        totalReturned += (line.returned || 0);
        totalDamaged += (line.damaged || 0);
        totalClosing += (line.closingStock || 0);
        totalInTransit += (line.inTransit || 0);
    });

    console.log("=== Pitampura Store Stock Report Totals (From JSON Report) ===");
    console.log(`Opening Stock: ${totalOpening} pcs`);
    console.log(`Inward (Received): ${totalInward} pcs`);
    console.log(`Sales (Sold): ${totalSold} pcs`);
    console.log(`Returned: ${totalReturned} pcs`);
    console.log(`Damaged: ${totalDamaged} pcs`);
    console.log(`Closing Stock: ${totalClosing} pcs`);
    console.log(`In Transit: ${totalInTransit} pcs`);
    console.log(`\nCalculation: Opening (${totalOpening}) + Inward (${totalInward}) - Sold (${totalSold}) + Returned (${totalReturned}) = ${totalOpening + totalInward - totalSold + totalReturned} pcs`);
    console.log(`Report Closing Stock: ${totalClosing} pcs`);
    console.log(`Difference (Closing - Calculation): ${totalClosing - (totalOpening + totalInward - totalSold + totalReturned)} pcs`);
}

run();
