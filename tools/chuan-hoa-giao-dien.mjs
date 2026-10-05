#!/usr/bin/env node
// Chuan hoa HTML theo Web Interface Guidelines cua Vercel (05-10-2026, chu site: "ap dung de
// giao dien dinh hon"). Hai viec, ca hai IDEMPOTENT — chay lai tren trang da chuan khong doi gi:
//
//  1. Icon SVG trang tri nam trong link / nut / summary / label DA CO TEN (chu hoac aria-label)
//     -> them aria-hidden="true" focusable="false". Quet 05-10: 450 icon tren 90 trang chua an;
//     trinh doc man hinh doc thua "hinh anh" giua ten nut.
//
//  2. Kieu chu trong CHU HIEN THI — khong dong vao thuoc tinh, <title>, JSON-LD, script, style,
//     svg, code:  "..." -> "…",  nhay thang " ' -> nhay cong “ ” ‘ ’, dau luoc ’ (Da Lat’s).
//     Truoc 05-10: 522 doan co nhay kep thang, 396 doan nhay don thang, 45 doan "..." tren 62 trang;
//     nhay thang ve bang Playfair (tieu de) trong vung ve. Ca 5 ky tu deu co trong
//     fonts/playfair-display-subset.woff2 (fonts/subset-kytu.txt) va dai latin cua Signika
//     (U+2000-206F) — khong ky tu nao roi ve font du phong.
//
// Ba cong cu doi chieu chu coi nhay cong = nhay thang, … = ... (doi KIEU chu, khong doi NOI
// DUNG): tools/kiem-schema.mjs (FAQ hien thi vs JSON-LD), tools/kiem-sitemap.mjs (lastmod) va
// tools/indexnow.mjs (bao Bing). Nho vay lan chuan hoa nay khong nang lastmod ~60 trang.
//
// Chay:  node tools/chuan-hoa-giao-dien.mjs           kiem, exit 1 neu co trang chua chuan
//        node tools/chuan-hoa-giao-dien.mjs --write   ghi lai
//        node tools/chuan-hoa-giao-dien.mjs --chi-tiet   in tung doan nhay khong can (de soat)
// Tu dong chay: .github/workflows/dang-bai-theo-lich.yml sau khi dang (ban nhap tren nhanh
// noi-dung soan truoc 05-10 con nhay thang).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BO_QUA_THU_MUC = new Set(['.git', '.github', 'node_modules', '.claude', 'skills', 'tools', 'hang-doi', 'img', 'uploads', 'css', 'js', 'fonts']);

// Mot "the" HTML day du (thuoc tinh co the chua ">" trong dau nhay), comment, doctype, hoac chu.
const TOKEN = /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][\w:-]*(?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?>|[^<]+|</g;

// Noi dung cac the nay khong phai chu hien thi (hoac la chu nguyen van) — chep nguyen.
const NGUYEN_VAN = new Set(['script', 'style', 'textarea', 'title', 'noscript', 'template', 'code', 'pre', 'kbd', 'samp', 'svg', 'math']);
// Ranh gioi khoi: chu truoc va sau khong lien mach, dau nhay dau khoi luon la nhay MO.
const KHOI = new Set(['html', 'head', 'body', 'main', 'header', 'footer', 'nav', 'section', 'article', 'aside', 'div', 'p', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'form', 'fieldset', 'legend', 'label', 'button', 'select', 'option', 'details', 'summary', 'br', 'hr', 'img', 'picture', 'video', 'iframe', 'input']);

const tenThe = (t) => (t.match(/^<\/?([a-zA-Z][\w:-]*)/) || [])[1]?.toLowerCase();

// Ky tu dung truoc dau nhay MO: dau khoi, khoang trang, ngoac mo, gach noi/ngang, nhay mo khac.
const TRUOC_MO = /[\s([{\u00AB\u2014\u2013\-\/\u201C\u2018]/;
const LA_CHU_SO = /[0-9A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/;

// Doi kieu chu trong mot doan chu (van con thuc the HTML). `truoc` = ky tu hien thi dung ngay
// truoc doan nay trong cung khoi ('' neu la dau khoi). Tra ve [chu moi, ky tu cuoi, so cho doi].
function kieuChu(raw, truoc) {
  let s = raw
    .replace(/&quot;|&#0*34;|&#x0*22;/gi, '"')
    .replace(/&#0*39;|&#x0*27;|&apos;/gi, "'");
  let doi = 0;
  s = s.replace(/(^|[^.])\.\.\.(?!\.)/g, (m, a) => { doi++; return a + '\u2026'; });
  let out = '';
  let p = truoc;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '&') {
      // Thuc the: chep nguyen; khoang trang khong ngat tinh la khoang trang.
      const m = s.slice(i).match(/^&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i);
      if (m) {
        out += m[0];
        p = /^&(nbsp|ensp|emsp|thinsp|#160|#xa0);$/i.test(m[0]) ? ' ' : 'x';
        i += m[0].length - 1;
        continue;
      }
    }
    if (c === '"') {
      out += p === '' || TRUOC_MO.test(p) ? '\u201C' : '\u201D';
      doi++;
    } else if (c === "'") {
      const sau = s[i + 1] || '';
      if (LA_CHU_SO.test(p) && LA_CHU_SO.test(sau)) out += '\u2019'; // dau luoc: Da Lat’s, don’t
      else if ((p === '' || TRUOC_MO.test(p)) && /[0-9]/.test(sau)) out += '\u2019'; // ’90s
      else out += p === '' || TRUOC_MO.test(p) ? '\u2018' : '\u2019';
      doi++;
    } else {
      out += c;
    }
    p = out[out.length - 1];
  }
  return [out, p, doi];
}

function chuanHoaChu(html, ghiChu) {
  let out = '';
  let nguyenVan = null; // ten the dang chep nguyen
  let truoc = '';
  let doi = 0;
  let khoiChu = '';
  const dongKhoi = () => {
    if (ghiChu) {
      const mo = (khoiChu.match(/\u201C/g) || []).length;
      const dong = (khoiChu.match(/\u201D/g) || []).length;
      if (mo !== dong) ghiChu.push(khoiChu.replace(/\s+/g, ' ').trim().slice(0, 140));
    }
    khoiChu = '';
    truoc = '';
  };
  for (const m of html.matchAll(TOKEN)) {
    const t = m[0];
    if (nguyenVan) {
      out += t;
      if (t[0] === '<' && t[1] === '/' && tenThe(t) === nguyenVan) nguyenVan = null;
      continue;
    }
    if (t[0] === '<' && t.length > 1 && t[1] !== '!') {
      const ten = tenThe(t);
      out += t;
      if (!ten) continue;
      if (t[1] !== '/' && NGUYEN_VAN.has(ten) && !t.endsWith('/>')) { nguyenVan = ten; continue; }
      if (KHOI.has(ten)) dongKhoi();
      continue;
    }
    if (t[0] === '<') { out += t; continue; } // comment, doctype, "<" le
    const [moi, cuoi, n] = kieuChu(t, truoc);
    out += moi;
    khoiChu += moi;
    truoc = cuoi ?? truoc;
    doi += n;
  }
  dongKhoi();
  return [out, doi];
}

// ---- 1. aria-hidden cho SVG trang tri ----
// Che script/style/comment bang khoang trang CUNG DO DAI de vi tri trong ban che = ban goc.
const che = (html) => html.replace(/<!--[\s\S]*?-->|<(script|style|template)\b[\s\S]*?<\/\2\s*>/gi, (m) => ' '.repeat(m.length));
const thuocTinh = (the, ten) => {
  const m = the.match(new RegExp('\\s' + ten + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i'));
  return m ? (m[2] ?? m[3]) : null;
};
const giaiMaGon = (s) => s.replace(/&nbsp;|&#160;/gi, ' ').replace(/&[a-z]+;|&#\d+;/gi, 'x');

function anIconTrangTri(html) {
  const mat = che(html);
  const chen = [];
  for (const m of mat.matchAll(/<(a|button|summary|label)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi)) {
    const moThe = '<' + m[1] + m[2] + '>';
    const ben = m[3];
    if (!/<svg\b/i.test(ben)) continue;
    const chu = giaiMaGon(ben.replace(/<svg\b[\s\S]*?<\/svg\s*>/gi, ' ').replace(/<[^>]+>/g, ' ')).trim();
    const altAnh = [...ben.matchAll(/<img\b[^>]*>/gi)].some((x) => (thuocTinh(x[0], 'alt') || '').trim());
    const coTen = chu || altAnh || ['aria-label', 'aria-labelledby', 'title'].some((a) => (thuocTinh(moThe, a) || '').trim());
    if (!coTen) continue; // SVG la nguon ten duy nhat — khong an
    const goc = m.index + moThe.length;
    for (const s of ben.matchAll(/<svg\b[^>]*>/gi)) {
      const the = s[0];
      if (/\saria-hidden\s*=/i.test(the) || /\srole\s*=\s*["']img["']/i.test(the) || /\saria-label(ledby)?\s*=/i.test(the)) continue;
      chen.push(goc + s.index + 4); // ngay sau "<svg"
    }
  }
  let out = html;
  for (const vt of chen.sort((a, b) => b - a)) out = out.slice(0, vt) + ' aria-hidden="true" focusable="false"' + out.slice(vt);
  return [out, chen.length];
}

// ---- 3. Chu thich anh bia nam TRONG khung anh (05-10-2026) ----
// tools/tao-bai-nhap.mjs truoc 05-10 de anhBia() mo khung ma khong dong, roi chen chu thich va
// mot </div> le -> chu thich nam trong khung co <img absolute inset-0> nen bi anh DE LEN, khach
// khong bao gio doc duoc (6 trang song + moi ban nhap tren nhanh noi-dung). Dong khung ngay sau
// <img>, chu thich ra ngoai. Trang da dung khong con khop mau nay nen chay lai khong doi gi.
const BIA_KHUNG = /(<div class="relative w-full[^"]*"[^>]*>\s*<img\b[^>]*>)(\s*)(<div class="text-center mt-3[^"]*">[\s\S]*?<\/div>)(\s*)<\/div>/g;
function chuThichAnhBia(html) {
  let n = 0;
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const out = html.replace(BIA_KHUNG, (m, khung, ws, chuThich) => { n++; return khung + nl + '            </div>' + nl + chuThich; });
  return [out, n];
}

export function chuanHoaTrang(html, ghiChu) {
  const [a, soIcon] = anIconTrangTri(html);
  const [b, soChu] = chuanHoaChu(a, ghiChu);
  const [c, soBia] = chuThichAnhBia(b);
  return { html: c, soIcon, soChu: soChu + soBia };
}

function duyet(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (BO_QUA_THU_MUC.has(e.name) || e.name.startsWith('.')) continue;
      duyet(path.join(dir, e.name), out);
    } else if (e.name.endsWith('.html')) out.push(path.join(dir, e.name));
  }
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const GHI = process.argv.includes('--write');
  const CHI_TIET = process.argv.includes('--chi-tiet');
  let tongIcon = 0, tongChu = 0, soTrang = 0;
  const lech = [];
  for (const f of duyet(ROOT)) {
    const s = fs.readFileSync(f, 'utf8');
    const ghiChu = [];
    const r = chuanHoaTrang(s, ghiChu);
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    ghiChu.forEach((x) => lech.push(`${rel}: ${x}`));
    if (r.html === s) continue;
    soTrang++; tongIcon += r.soIcon; tongChu += r.soChu;
    if (GHI) fs.writeFileSync(f, r.html);
    if (CHI_TIET || !GHI) console.log(`  ${rel}: ${r.soIcon} icon, ${r.soChu} cho kieu chu`);
  }
  console.log(`\n${GHI ? 'Da sua' : 'Can sua'}: ${soTrang} trang — ${tongIcon} icon an khoi trinh doc man hinh, ${tongChu} cho doi kieu chu.`);
  if (lech.length) {
    console.log(`\nCANH BAO ${lech.length} khoi co nhay kep mo/dong khong can (xem tay — thuong do nhay vat qua nhieu doan):`);
    lech.slice(0, CHI_TIET ? 500 : 25).forEach((x) => console.log('  ! ' + x));
  }
  if (!GHI && soTrang) process.exit(1);
}
