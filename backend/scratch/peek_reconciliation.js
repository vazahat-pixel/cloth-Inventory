const fs = require('fs');
const path = require('path');

const files = ['ultimate_reconciliation.json', 'reconciliation_output.json', 'store_audit_output.json'];
files.forEach(f => {
    const filePath = path.join(__dirname, f);
    if (fs.existsSync(filePath)) {
        console.log(`\n=== File: ${f} ===`);
        const content = fs.readFileSync(filePath, 'utf8');
        try {
            const data = JSON.parse(content);
            console.log("Keys:", Object.keys(data));
            // Print parts that reference GTB store
            const dataStr = JSON.stringify(data);
            if (dataStr.includes('69ecb1d9f04d7249bd11adf4') || dataStr.includes('GTB')) {
                console.log("GTB mentioned! Sample/Full data:");
                console.log(content.substring(0, 2000));
            } else {
                console.log("GTB not mentioned.");
            }
        } catch (e) {
            console.log("Not valid JSON. Length:", content.length);
        }
    } else {
        console.log("File not found:", f);
    }
});
