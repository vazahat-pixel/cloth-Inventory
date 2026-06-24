const fs = require('fs');
const path = require('path');

function run() {
    const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const gtbStore = reportData.salesByStore.find(s => String(s.storeId) === '69ecb1d9f04d7249bd11adf4');

    console.log(`=== June Invoices in Report ===`);
    const juneInvs = gtbStore.invoices.filter(inv => inv.date.startsWith('2026-06'));
    juneInvs.forEach(inv => {
        console.log(`- ${inv.saleNumber}: ${inv.date}, customer: ${inv.customer}, qty: ${inv.quantity}, net: ${inv.net}`);
    });
}

run();
