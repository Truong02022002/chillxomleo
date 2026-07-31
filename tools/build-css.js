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

// Trong SELECTOR, khoang trang la TO HOP HAU DUE — bo di la doi nghia selector.
// Da tung bo nham va lam chet ca khoi tuong phan hero:
//   nguon : .hero-cinematic :is([class^="text-primary"])   <- con ben trong hero
//   bundle: .hero-cinematic:is([class^="text-primary"])    <- chinh phan tu hero -> khop rong
// Nen chi duoc bo khoang trang canh cac dau THAT SU la dau phan cach:
//   - trong selector : { } , > ~ +      (dac biet KHONG bo canh : ( ) [ ])
//   - trong khai bao : { } ; : ,        (KHONG bo canh + - * / de khong pha calc())
const SEP_SELECTOR = /[{},>~+]/;
const SEP_DECL = /[{};:,]/;
// Cac at-rule ma ben trong van la selector chu khong phai khai bao.
const NESTED_AT = /^@(media|supports|container|layer|scope|document|-moz-document)\b/i;

function minify(css) {
  let out = '', i = 0; const n = css.length;
  const stack = [];            // true = khoi long nhau (van la selector), false = khoi khai bao
  let prelude = '';            // van ban ke tu dau khoi/cau lenh hien tai, de doan loai khoi
  const inSelector = () => stack.length === 0 || stack[stack.length - 1] === true;

  while (i < n) {
    const c = css[i];
    if (c === '"' || c === "'") {                    // giu nguyen chuoi
      const q = c; let s = c; i++;
      while (i < n) {
        if (css[i] === '\\') { s += css[i] + (css[i + 1] || ''); i += 2; continue; }
        if (css[i] === q) { s += q; i++; break; }
        s += css[i++];
      }
      out += s; prelude += s; continue;
    }
    if (css.startsWith('url(', i)) {                 // giu nguyen url(...)
      const e = css.indexOf(')', i);
      if (e > 0) { out += css.slice(i, e + 1); prelude += css.slice(i, e + 1); i = e + 1; continue; }
    }
    if (c === '/' && css[i + 1] === '*') {           // bo chu thich
      const e = css.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue;
    }
    if (/\s/.test(c)) {                              // gom khoang trang
      let j = i; while (j < n && /\s/.test(css[j])) j++;
      const prev = out[out.length - 1] || '', next = css[j] || '';
      const sep = inSelector() ? SEP_SELECTOR : SEP_DECL;
      if (prev && next && !sep.test(prev) && !sep.test(next)) { out += ' '; prelude += ' '; }
      i = j; continue;
    }
    if (c === '{') { stack.push(NESTED_AT.test(prelude.trim())); prelude = ''; }
    else if (c === '}') { stack.pop(); prelude = ''; }
    else if (c === ';') { prelude = ''; }
    else prelude += c;
    out += c; i++;
  }
  return out.replace(/;}/g, '}');
}

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const joined = SOURCES.map(read).join('\n');
const srcHash = crypto.createHash('sha1').update(joined).digest('hex').slice(0, 12);
const body = minify(joined);

// KIEM CHUNG: dem so khoi '{' la KHONG DU. Lan truoc minify bo mat dau cach to hop
// hau due (".hero-cinematic :is(...)" -> ".hero-cinematic:is(...)"), selector doi
// nghia va khop rong, nhung SO KHOI VAN Y NGUYEN nen phep dem bao "khong sao".
// Nay so thang DANH SACH SELECTOR truoc/sau, da chuan hoa khoang trang.
function selectorsOf(css) {
  const list = []; let i = 0; const n = css.length;
  let prelude = ''; const stack = [];
  while (i < n) {
    const c = css[i];
    if (c === '"' || c === "'") {
      const q = c; let s = c; i++;
      while (i < n) {
        if (css[i] === '\\') { s += css[i] + (css[i + 1] || ''); i += 2; continue; }
        if (css[i] === q) { s += q; i++; break; }
        s += css[i++];
      }
      prelude += s; continue;
    }
    if (css.startsWith('url(', i)) { const e = css.indexOf(')', i); if (e > 0) { prelude += css.slice(i, e + 1); i = e + 1; continue; } }
    if (c === '/' && css[i + 1] === '*') { const e = css.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === '{') {
      const p = prelude.replace(/\s+/g, ' ').trim();
      if (stack.length === 0 || stack[stack.length - 1] === true) list.push(p);
      stack.push(NESTED_AT.test(p)); prelude = ''; i++; continue;
    }
    if (c === '}') { stack.pop(); prelude = ''; i++; continue; }
    if (c === ';') { prelude = ''; i++; continue; }
    prelude += c; i++;
  }
  return list;
}
// Khoang trang quanh , > + ~ la KHONG dang ke (CSS coi nhu nhau) -> chuan hoa hai ve.
// Khoang trang o cho khac thi DANG ke: no la to hop hau due.
const normSel = s => s.replace(/\s*([,>+~])\s*/g, '$1');
const selSrc = selectorsOf(joined).map(normSel), selOut = selectorsOf(body).map(normSel);
if (selSrc.length !== selOut.length) {
  console.error('LOI: so selector doi ' + selSrc.length + ' -> ' + selOut.length + '. Dung lai.');
  process.exit(2);
}
const diffs = [];
for (let k = 0; k < selSrc.length; k++) if (selSrc[k] !== selOut[k]) diffs.push(k);
if (diffs.length) {
  console.error('LOI: minify lam doi ' + diffs.length + ' selector. Dung lai. Vi du:');
  for (const k of diffs.slice(0, 5)) {
    console.error('  nguon : ' + selSrc[k]);
    console.error('  bundle: ' + selOut[k]);
  }
  process.exit(2);
}

// Phep so tren chi phu SELECTOR. Kiem not phan KHAI BAO bang cach dua ca hai ve
// mot dang chuan chung: bo chu thich, gom khoang trang, roi bo khoang trang o
// nhung cho CSS coi la khong dang ke. Neu minify trung thuc thi hai chuoi trung khop.
const canon = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};:,>+~])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();
const cSrc = canon(joined), cOut = canon(body);
if (cSrc !== cOut) {
  let k = 0; while (k < cSrc.length && cSrc[k] === cOut[k]) k++;
  console.error('LOI: noi dung bundle khac nguon tai vi tri ' + k + '. Dung lai.');
  console.error('  nguon : ...' + cSrc.slice(Math.max(0, k - 60), k + 60));
  console.error('  bundle: ...' + cOut.slice(Math.max(0, k - 60), k + 60));
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
    (gz / 1024).toFixed(1) + ' KB gzip) | ' + selOut.length + ' selector | src-hash ' + srcHash);
  process.exit(0);
}
if (currentHash === srcHash) { console.log('bundle khop nguon (src-hash ' + srcHash + ')'); process.exit(0); }
console.error('LECH: bundle dung tu nguon khac (' + (currentHash || 'chua co') + ' != ' + srcHash + ').');
console.error('Chay: node tools/build-css.js --write && node tools/cache-bust.js --write');
process.exit(1);
