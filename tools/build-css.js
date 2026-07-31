#!/usr/bin/env node
/**
 * Gop 3 file CSS nguon thanh mot bundle: css/site.css
 *
 * Ly do: PageSpeed bao "Yeu cau chan hien thi 1.980ms". Trang nap 3 file CSS chan
 * hien thi (fonts.css, tailwind-output.css, style.css). Gop lai con 1 request va
 * bo chu thich/khoang trang: 17,1 KB -> 13,3 KB sau gzip.
 *
 * BA FILE NGUON GIU NGUYEN lam ban de sua — chung chua day du chu thich giai thich
 * vi sao tung rule ton tai. Chi bundle la file duoc trinh duyet nap.
 *
 * Cach dung:
 *   node tools/build-css.js          # kiem tra bundle con khop nguon khong (exit 1 neu lech)
 *   node tools/build-css.js --write  # dung lai bundle
 * Sau khi --write PHAI chay tiep: node tools/cache-bust.js --write
 *
 * Thu tu gop: fonts -> tailwind -> style (style cuoi de rule viet tay thang khi
 * trung do uu tien voi Tailwind; da doi chieu chi .font-script va .container trung
 * ten, ca hai cho ket qua giong nhau du thu tu nao).
 *
 * Minify co chu dich la BAO THU: chi bo chu thich va gom khoang trang, KHONG gop
 * hay sap xep lai rule. Da do: cach nay cho 13,3 KB gzip, con tot hon clean-css
 * level 2 (13,4 KB) va giu du 970/970 khoi rule trong khi clean-css L2 gop mat 10.
 * Khong dung thu vien ngoai vi repo nay khong co package.json.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SOURCES = ['fonts/fonts.css', 'css/tailwind-output.css', 'css/style.css'];
const BUNDLE = 'css/site.css';

function minify(css) {
  let out = '', i = 0; const n = css.length;
  while (i < n) {
    const c = css[i];
    if (c === '"' || c === "'") {                    // giu nguyen chuoi
      const q = c; let s = c; i++;
      while (i < n) {
        if (css[i] === '\\') { s += css[i] + (css[i + 1] || ''); i += 2; continue; }
        if (css[i] === q) { s += q; i++; break; }
        s += css[i++];
      }
      out += s; continue;
    }
    if (css.startsWith('url(', i)) {                 // giu nguyen url(...)
      const e = css.indexOf(')', i);
      if (e > 0) { out += css.slice(i, e + 1); i = e + 1; continue; }
    }
    if (c === '/' && css[i + 1] === '*') {           // bo chu thich
      const e = css.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue;
    }
    if (/\s/.test(c)) {                              // gom khoang trang
      let j = i; while (j < n && /\s/.test(css[j])) j++;
      const prev = out[out.length - 1] || '', next = css[j] || '';
      if (prev && next && !/[{};:,>~+()]/.test(prev) && !/[{};:,>~+()]/.test(next)) out += ' ';
      i = j; continue;
    }
    out += c; i++;
  }
  return out.replace(/;}/g, '}');
}

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const joined = SOURCES.map(read).join('\n');
const srcHash = crypto.createHash('sha1').update(joined).digest('hex').slice(0, 12);
const body = minify(joined);

// canh bao neu minify lam mat khoi rule nao
const blocks = s => (s.match(/\{/g) || []).length;
if (blocks(body) !== blocks(joined)) {
  console.error('LOI: so khoi rule doi ' + blocks(joined) + ' -> ' + blocks(body) + '. Dung lai.');
  process.exit(2);
}

const built = '/* BUNDLE TU DONG SINH — DUNG SUA TRUC TIEP.\n' +
  '   Nguon: ' + SOURCES.join(' + ') + '\n' +
  '   Sua nguon roi chay: node tools/build-css.js --write && node tools/cache-bust.js --write\n' +
  '   src-hash: ' + srcHash + ' */\n' + body + '\n';

const bundlePath = path.join(ROOT, BUNDLE);
const current = fs.existsSync(bundlePath) ? fs.readFileSync(bundlePath, 'utf8') : '';
const currentHash = (current.match(/src-hash: ([0-9a-f]+)/) || [])[1];

if (process.argv.includes('--write')) {
  fs.writeFileSync(bundlePath, built);
  const gz = require('zlib').gzipSync(Buffer.from(body), { level: 9 }).length;
  console.log('da dung ' + BUNDLE + ': ' + (body.length / 1024).toFixed(1) + ' KB (' +
    (gz / 1024).toFixed(1) + ' KB gzip) | ' + blocks(body) + ' khoi rule | src-hash ' + srcHash);
  process.exit(0);
}
if (currentHash === srcHash) { console.log('bundle khop nguon (src-hash ' + srcHash + ')'); process.exit(0); }
console.error('LECH: bundle dung tu nguon khac (' + (currentHash || 'chua co') + ' != ' + srcHash + ').');
console.error('Chay: node tools/build-css.js --write && node tools/cache-bust.js --write');
process.exit(1);
