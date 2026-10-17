// sw.js fájllistájának frissítése (új forrásfájl hozzáadása után futtasd: node scripts/gen-sw.js)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const files = ['./', 'index.html', 'manifest.webmanifest'];
function walk(dir) {
  for (const f of fs.readdirSync(path.join(root, dir)).sort()) {
    const rel = path.join(dir, f);
    if (fs.statSync(path.join(root, rel)).isDirectory()) walk(rel);
    else if (/\.(js|woff2|png)$/.test(f)) files.push(rel.split(path.sep).join('/'));
  }
}
walk('src');
walk('assets/fonts');
walk('assets/icons');
const hash = crypto.createHash('sha1');
for (const f of files.slice(1)) hash.update(fs.readFileSync(path.join(root, f)));
const version = hash.digest('hex').slice(0, 10);

const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8')
  .replace(/const CACHE = '[^']*';/, `const CACHE = 'tt3-${version}';`)
  .replace(/const FILES = \[[\s\S]*?\];/, 'const FILES = ' + JSON.stringify(files, null, 2) + ';');
fs.writeFileSync(path.join(root, 'sw.js'), sw);
console.log(`sw.js: ${files.length} fájl, gyorsítótár: tt3-${version}`);
