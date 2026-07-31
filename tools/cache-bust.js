#!/usr/bin/env node
/**
 * Dat cache-buster cho CSS/JS theo HASH NOI DUNG file.
 *
 * Ly do ton tai: GitHub Pages phuc vu /css/ va /js/ voi Cache-Control 30 ngay,
 * va query string chinh la khoa cache. Danh so tay (?v217, ?v218...) da ba lan
 * bi quen khi sua file, khien ban va nam im tren server con khach van nhan ban cu:
 *   d46ef4d  sua css/style.css        -> quen bump -> toan bo ban va a11y khong toi tay ai
 *   b7951d3  sua js/main.min.js       -> quen bump -> ban va 404 chuyen ngon ngu vo hieu
 *   3d5899f  sua css/style.css        -> quen bump -> 36 o .menu-noimg mat nen
 *
 * Cach dung:
 *   node tools/cache-bust.js          # kiem tra, bao co lech hay khong (exit 1 neu lech)
 *   node tools/cache-bust.js --write  # ghi lai cho dung
 *
 * Version = 8 ky tu dau sha1 cua chinh noi dung file, nen khong the quen:
 * file doi -> hash doi -> lenh kiem tra bao lech ngay.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
// css/site.css la BUNDLE do tools/build-css.js sinh ra tu 3 file nguon.
// Trang chi nap bundle nay, khong nap truc tiep 3 file nguon nua.
const ASSETS = [
  { file: 'css/site.css', pattern: /site\.css(\?[a-z]*[0-9a-f]+)?/g, name: 'site.css' },
  { file: 'js/main.min.js', pattern: /main\.min\.js\?[a-z]*[0-9a-f]+/g, name: 'main.min.js' },
];

const hashOf = (rel) => crypto.createHash('sha1')
  .update(fs.readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 8);

const targets = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.claude', 'skills', 'tools'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) targets.push(p);
  }
})(ROOT);
targets.push(path.join(ROOT, 'sw.js'));

const write = process.argv.includes('--write');
const want = {};
for (const a of ASSETS) want[a.name] = hashOf(a.file);

let drift = 0, changed = 0;
for (const f of targets) {
  if (!fs.existsSync(f)) continue;
  let s = fs.readFileSync(f, 'utf8');
  const o = s;
  for (const a of ASSETS) {
    s = s.replace(a.pattern, (m) => {
      const target = a.name + '?h' + want[a.name];
      if (m !== target) drift++;
      return target;
    });
  }
  if (s !== o) { changed++; if (write) fs.writeFileSync(f, s); }
}

// CACHE_VERSION cua service worker phai doi theo, neu khong handler 'activate'
// se khong don cache cua doi truoc.
const swPath = path.join(ROOT, 'sw.js');
if (fs.existsSync(swPath)) {
  let sw = fs.readFileSync(swPath, 'utf8');
  const combined = crypto.createHash('sha1')
    .update(ASSETS.map(a => want[a.name]).join('')).digest('hex').slice(0, 8);
  const nsw = sw.replace(/const CACHE_VERSION = '[^']*';/, "const CACHE_VERSION = 'xomleo-" + combined + "';");
  if (nsw !== sw) { drift++; changed++; if (write) fs.writeFileSync(swPath, nsw); }
}

for (const a of ASSETS) console.log('  ' + a.name.padEnd(22) + ' h' + want[a.name]);
if (!drift) { console.log('\nDong bo. Khong co gi phai sua.'); process.exit(0); }
if (write) { console.log('\nDa cap nhat ' + changed + ' file.'); process.exit(0); }
console.error('\nLECH: ' + changed + ' file dang tro toi ban cu. Chay lai voi --write.');
process.exit(1);
