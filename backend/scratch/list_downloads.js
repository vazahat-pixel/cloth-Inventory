const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\admin\\Downloads';
try {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
        const stats = fs.statSync(path.join(dir, f));
        console.log(`- ${f} (${stats.size} bytes, modified: ${stats.mtime})`);
    });
} catch (e) {
    console.error(e);
}
