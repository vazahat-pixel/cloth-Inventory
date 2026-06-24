const fs = require('fs');
const path = require('path');

function run() {
    const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const storeId = '69e86a235df4170210683604'; // Pitampura
    const rStore = reportData.salesByStore.find(s => String(s.storeId) === storeId);

    console.log("=== June 9 Invoices for Pitampura in Report ===");
    const june9Invs = rStore.invoices.filter(i => i.date === '2026-06-09');
    june9Invs.forEach(inv => {
        console.log(`- ${inv.saleNumber}: Qty ${inv.quantity}, Net ${inv.net}, Customer: ${inv.customer}, Payment: ${inv.paymentMode}`);
    });
}

run();
