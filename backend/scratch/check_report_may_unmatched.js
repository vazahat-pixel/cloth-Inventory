const fs = require('fs');
const path = require('path');

function run() {
    const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    // Find GTB store (storeId: 69ecb1d9f04d7249bd11adf4)
    const gtbStore = reportData.salesByStore.find(s => String(s.storeId) === '69ecb1d9f04d7249bd11adf4');
    if (!gtbStore) {
        console.log("GTB store not found in report!");
        return;
    }

    console.log(`GTB store total invoices in report: ${gtbStore.invoices.length}`);
    const mayInvoices = gtbStore.invoices.filter(inv => inv.date.startsWith('2026-05'));
    console.log(`GTB store May invoices in report: ${mayInvoices.length}`);

    const reportMayAmount = mayInvoices.reduce((sum, inv) => sum + Number(inv.net), 0);
    const reportMayQty = mayInvoices.reduce((sum, inv) => sum + Number(inv.quantity), 0);

    console.log(`Report May Totals - Amount: ${reportMayAmount.toFixed(2)}, Qty: ${reportMayQty}`);
}
run();
