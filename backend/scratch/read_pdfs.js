const fs = require('fs');
const path = require('path');

const files = [
    'Store_Stock_Reconciliation_Audit_Report_19Jun2026.pdf',
    'Store_Stock_Reconciliation_Audit_Report_Excel_Style.pdf',
    'Store_Stock_Reconciliation_Full_Audit_Report.pdf'
];

files.forEach(f => {
    const filePath = path.join('C:\\Users\\admin\\Downloads', f);
    if (fs.existsSync(filePath)) {
        console.log(`\n=== File: ${f} ===`);
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(content.substring(0, 1000));
    } else {
        console.log("File not found:", f);
    }
});
