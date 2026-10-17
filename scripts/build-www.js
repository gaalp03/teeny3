// A játék fájljainak összegyűjtése a www/ mappába (ebből készül az Android app).
// Ha az assets/custom mappában vannak saját textúráid, azok is bekerülnek — így a
// saját gépeden épített APK a saját képeiddel fut.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const item of ['index.html', 'manifest.webmanifest', 'sw.js', 'src', 'assets']) {
  fs.cpSync(path.join(root, item), path.join(out, item), { recursive: true });
}
const raw = path.join(out, 'assets', 'custom', 'raw');
fs.rmSync(raw, { recursive: true, force: true });
console.log('www/ kész');
