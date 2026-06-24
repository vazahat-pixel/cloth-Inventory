const fs = require('fs');
const path = require('path');

function run() {
    const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const gtbStore = reportData.salesByStore.find(s => String(s.storeId) === '69ecb1d9f04d7249bd11adf4');
    
    console.log(`First 3 invoices:`, JSON.stringify(gtbStore.invoices.slice(0, 3), null, 2));
    
    // Also let's check if there are matches for the missing sales we found:
    // 6a2113e3afd24ffd18968140: Qty 1, Amt 199.00
    // 6a3638456aa096db0c8625ae: Qty 1, Amt 599.00
    // 6a38e5f112517c17ad17f97c: Qty 3, Amt 1799.40
    // Let's filter gtbStore.invoices for quantity 1 and net 199/599, or quantity 3 and net 1799.40.
    const juneInvoices = gtbStore.invoices.filter(inv => inv.date.startsWith('2026-06'));
    console.log(`June invoices count in report: ${juneInvoices.length}`);
    
    console.log(`Invoices with net ~ 199:`, juneInvoices.filter(i => Math.abs(Number(i.net) - 199) < 1));
    console.log(`Invoices with net ~ 599:`, juneInvoices.filter(i => Math.abs(Number(i.net) - 599) < 1));
    console.log(`Invoices with net ~ 1799.40:`, juneInvoices.filter(i => Math.abs(Number(i.net) - 1799.40) < 1));
}

run();
