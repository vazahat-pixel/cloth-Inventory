const fs = require('fs');
const path = require('path');

const SRC_ROOT = path.join(__dirname, '..', 'src');

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== 'node_modules') walk(p, files);
    else if (/\.(jsx?|tsx?)$/.test(ent.name)) files.push(p);
  }
  return files;
}

function depthImport(file) {
  const rel = path.relative(SRC_ROOT, file).split(path.sep);
  const depth = rel.length - 1;
  return `import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '${'../'.repeat(depth)}utils/formatters';`;
}

const replacements = [
  [/new Date\(([^)]+)\)\.toLocaleDateString\([^)]*\)/g, 'formatDateDDMMYYYY($1)'],
  [/([a-zA-Z_$][\w$.?]*)\.toLocaleDateString\([^)]*\)/g, 'formatDateDDMMYYYY($1)'],
  [/new Date\(([^)]+)\)\.toLocaleString\(\)/g, 'formatDateTimeDDMMYYYY($1)'],
  [/new Date\(([^)]+)\)\.toLocaleString\([^)]*\)/g, 'formatDateTimeDDMMYYYY($1)'],
];

let changed = 0;
for (const file of walk(SRC_ROOT)) {
  if (file.endsWith(`${path.sep}utils${path.sep}formatters.js`)) continue;
  let src = fs.readFileSync(file, 'utf8');
  if (!/toLocaleDateString|new Date\([^)]*\)\.toLocaleString/.test(src)) continue;

  let next = src;
  for (const [re, rep] of replacements) {
    next = next.replace(re, rep);
  }
  if (next === src) continue;

  if (!/from ['"].*utils\/formatters['"]/.test(next)) {
    const importStmt = depthImport(file);
    const match = next.match(/^import .+;$/m);
    if (match) {
      const idx = next.indexOf(match[0]);
      const lineEnd = next.indexOf('\n', idx);
      next = `${next.slice(0, lineEnd + 1)}${importStmt}\n${next.slice(lineEnd + 1)}`;
    } else {
      next = `${importStmt}\n${next}`;
    }
  }

  fs.writeFileSync(file, next);
  changed += 1;
  console.log('updated', path.relative(SRC_ROOT, file));
}
console.log('total', changed);
