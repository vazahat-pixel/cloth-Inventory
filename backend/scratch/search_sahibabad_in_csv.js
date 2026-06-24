const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

async function run() {
    const csvPath = path.join(__dirname, '../reports/full/all-sales-detail-2026-06-19.csv');
    if (!fs.existsSync(csvPath)) {
        console.error(`CSV not found at: ${csvPath}`);
        return;
    }

    console.log("=== SEARCHING SAHIBABAD IN CSV (MANUAL PARSING) ===");
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length === 0) {
        console.log("CSV is empty.");
        return;
    }

    const headers = parseCSVLine(lines[0]);
    console.log("Headers:", headers);

    const storeIndex = headers.findIndex(h => h.toLowerCase().includes('store'));
    const invoiceIndex = headers.findIndex(h => h.toLowerCase().includes('invoice') || h.toLowerCase().includes('sale') || h.toLowerCase().includes('bill'));
    const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));
    const qtyIndex = headers.findIndex(h => h.toLowerCase().includes('qty') || h.toLowerCase().includes('quantity'));
    const netIndex = headers.findIndex(h => h.toLowerCase().includes('net') || h.toLowerCase().includes('total') || h.toLowerCase().includes('amount'));
    const customerIndex = headers.findIndex(h => h.toLowerCase().includes('customer') || h.toLowerCase().includes('client'));

    console.log(`Indices -> Store: ${storeIndex}, Invoice: ${invoiceIndex}, Date: ${dateIndex}, Qty: ${qtyIndex}, Net: ${netIndex}, Customer: ${customerIndex}`);

    const results = [];
    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length < headers.length) continue;

        // Check if store matches Sahibabad
        const storeName = row[storeIndex] || '';
        if (storeName.toUpperCase().includes('SAHIBABAD')) {
            results.push(row);
        }
    }

    console.log(`Found ${results.length} rows for Sahibabad in June 19 CSV.`);

    // Group by invoice number
    const sales = {};
    results.forEach(row => {
        const inv = row[invoiceIndex] || 'N/A';
        if (!sales[inv]) {
            sales[inv] = [];
        }
        sales[inv].push(row);
    });

    console.log(`Unique invoices in CSV: ${Object.keys(sales).length}`);
    Object.keys(sales).forEach(inv => {
        const rows = sales[inv];
        const date = rows[0][dateIndex] || 'N/A';
        const customer = rows[0][customerIndex] || 'N/A';
        const qty = rows.reduce((sum, r) => sum + Number(r[qtyIndex] || 0), 0);
        const net = rows[0][netIndex] || 'N/A';
        console.log(`- Invoice: ${inv} | Date: ${date} | Customer: ${customer} | Qty: ${qty} | Net: ${net}`);
    });
}
run();
