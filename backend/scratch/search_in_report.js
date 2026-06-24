const fs = require('fs');
const path = require('path');

function run() {
    const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
    if (!fs.existsSync(reportPath)) {
        console.log(`Report path does not exist: ${reportPath}`);
        return;
    }
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    const gtbStore = reportData.salesByStore.find(s => String(s.storeId) === '69ecb1d9f04d7249bd11adf4');
    if (!gtbStore) {
        console.log(`GTB store not found in report`);
        return;
    }

    console.log(`GTB Invoices count: ${gtbStore.invoices.length}`);

    // Search for Sugandha, sugandha, Prem Sharma, PREM SHARMA, jaswant, padma, etc.
    const searchTerms = [/sugandha/i, /prem/i, /padma/i, /jaswant/i, /9211058609/, /9990688631/, /9599231011/, /9419178636/, /8377879934/];

    console.log(`\n=== Searching Invoices in Report ===`);
    gtbStore.invoices.forEach(inv => {
        const match = searchTerms.some(term => {
            return term.test(inv.customerName || '') || 
                   term.test(inv.customerMobile || '') || 
                   term.test(inv.saleNumber || '');
        });
        if (match) {
            console.log(`- Sale: ${inv.saleNumber}, Date: ${inv.date}, Customer: ${inv.customerName} (${inv.customerMobile}), Qty: ${inv.quantity}, Net: ${inv.net}`);
        }
    });
}

run();
