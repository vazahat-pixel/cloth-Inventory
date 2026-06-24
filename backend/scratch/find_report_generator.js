const fs = require('fs');
const path = require('path');

const projectDir = 'c:\\Users\\admin\\Desktop\\cloth-Inventory\\backend';

function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                searchDir(fullPath);
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.md')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes('database_ui_report.md')) {
                    console.log(`Found in: ${fullPath}`);
                }
            }
        }
    }
}

searchDir(projectDir);
console.log('Search complete.');
