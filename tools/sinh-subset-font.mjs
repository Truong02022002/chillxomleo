#!/usr/bin/env node
/**
 * Sinh fonts/dancing-script-subset.woff2 + fonts/subset-kytu.txt
 *
 * Vi sao co file nay: Dancing Script ban day (latin 41,7 KB + vietnamese 7,5 KB)
 * nam trong duong toi han ve cua trang chu — phan tu LCP la chu <h1>, ma chu
 * khong ve duoc truoc khi font ngu ngu. Do bang CDP (CPU x4 + Slow 4G, 8 vong
 * xen ke, 29-08-2026): bo bot glyph xuong 39,3 KB thi LCP 2180ms -> 1538ms.
 *
 * CAN BIET — hieu ung co NGUONG, khong tuyen tinh theo kich thuoc:
 *     50,4 KB (2 file goc)        LCP ~2180ms
 *     49,4 KB (subset du Latin-1) LCP ~2186ms   <- khong loi gi
 *     46,7 KB (subset trung binh) LCP ~2126ms   <- khong loi gi
 *     39,3 KB (subset nay)        LCP ~1538ms   <- loi 650ms
 * Nghia la chi ban HEP NHAT moi an. Them lai vai chuc glyph Latin-1 co dau la
 * mat sach phan loi. Co che thi CHUA giai thich duoc: 11 KB tren link 1,6 Mbps
 * chi dang ~55ms, nen 650ms han khong phai do truyen tai. Phong doan la chi phi
 * dung chu voi bang kerning cua font viet tay, nhung KHONG do duoc. So lieu thi
 * lap lai on dinh (8/8 vong).
 *
 * QUY TAC BAT BUOC: bo ky tu phai la TAP CON cua unicode-range dang khai bao
 * truoc day. Nho vay ky tu chi co the giu nguyen hoac roi ve font du phong,
 * KHONG BAO GIO doi tu "fallback ve" thanh "Dancing Script ve" — tranh lam doi
 * hinh dang nhung ky tu nhu → ← von dang do font he thong ve.
 *
 * Cach dung:  node tools/sinh-subset-font.mjs [--ghi]
 *   khong co --ghi : chi bao se sinh gi, khong dong vao file nao
 * Sau khi --ghi PHAI chay tiep: node tools/build-css.js --write
 *                         roi:  node tools/cache-bust.js --write
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GHI = process.argv.includes('--ghi');

// Hai dai unicode-range GOC (chep tu fonts/fonts.css truoc khi gop)
const DAI_GOC =
  'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,'
  + 'U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB,'
  + 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,'
  + 'U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

const dai = DAI_GOC.split(',').map((p) => {
  const [a, b] = p.trim().replace('U+', '').split('-');
  return [parseInt(a, 16), parseInt(b ?? a, 16)];
});
const trongDaiGoc = (cp) => dai.some(([a, b]) => cp >= a && cp <= b);

// ---- Bo ky tu MUON giu ----
const muon = new Set();

// ASCII in duoc
for (let c = 0x20; c <= 0x7e; c++) muon.add(c);

// Chu cai tieng Viet (ca thuong lan hoa)
const VIET = 'àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ';
for (const ch of VIET) { muon.add(ch.codePointAt(0)); muon.add(ch.toUpperCase().codePointAt(0)); }

// Dau ket hop (mot so trinh soan thao xuat dang to hop thay vi tien to hop)
for (const ch of '̣̩̀́̃̄̈̉') muon.add(ch.codePointAt(0));

// Ky hieu + dau cau site dang dung
for (const ch of '₫€™©°²·«»‘’“”–—•…') muon.add(ch.codePointAt(0));

// Ep quy tac tap con
const ngoai = [...muon].filter((c) => !trongDaiGoc(c));
if (ngoai.length) {
  console.error('Cac diem ma sau NAM NGOAI unicode-range goc, da loai bo:');
  console.error('  ' + ngoai.map((c) => String.fromCodePoint(c) + ' U+' + c.toString(16).toUpperCase()).join('  '));
  for (const c of ngoai) muon.delete(c);
}

const text = [...muon].sort((a, b) => a - b).map((c) => String.fromCodePoint(c)).join('');
console.log('Bo ky tu:', text.length, 'ky tu (deu nam trong unicode-range goc)');

if (!GHI) { console.log('\n(che do thu — them --ghi de thuc su sinh file)'); process.exit(0); }

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const url = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700'
  + '&text=' + encodeURIComponent(text) + '&display=swap';

const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
// Endpoint subset dong cua Google la /l/font?kit=... , KHONG co duoi .woff2
const m = css.match(/url\((https:\/\/[^)]+)\)/);
if (!m) { console.error('Khong tim thay URL font trong CSS Google tra ve:\n' + css.slice(0, 400)); process.exit(2); }

const buf = Buffer.from(await (await fetch(m[1], { headers: { 'User-Agent': UA } })).arrayBuffer());
if (buf.subarray(0, 4).toString('latin1') !== 'wOF2') {
  console.error('File tai ve khong phai woff2 (magic =', JSON.stringify(buf.subarray(0, 4).toString('latin1')), ')');
  process.exit(3);
}

fs.writeFileSync(path.join(ROOT, 'fonts/dancing-script-subset.woff2'), buf);
fs.writeFileSync(path.join(ROOT, 'fonts/subset-kytu.txt'), text, 'utf8');

console.log('\nDa ghi fonts/dancing-script-subset.woff2 :', buf.length.toLocaleString('vi'), 'bytes');
console.log('Da ghi fonts/subset-kytu.txt             :', text.length, 'ky tu');
console.log('\nChay tiep: node tools/build-css.js --write && node tools/cache-bust.js --write');
