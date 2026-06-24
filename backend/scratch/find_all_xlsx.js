const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\admin';

function traverse(dir) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    // Skip node_modules, AppData, .git, .gemini, etc.
                    if (file === 'node_modules' || file === '.git' || file === 'AppData' || file === '.gemini') {
                        continue;
                    }
                    traverse(fullPath);
                } else if (file.endsWith('.xlsx')) {
                    console.log(`Found XLSX: ${fullPath} (${stat.size} bytes)`);
                }
            } catch (err) {
                // Ignore permission or file errors
            }
        }
    } catch (e) {
        // Ignore directory read errors
    }
}

console.log(`Searching for all XLSX files in ${root}...`);
traverse(root);
console.log('Search complete.');
