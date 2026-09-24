// Dang bai theo lich.
//
// Doc hang-doi/lich-dang.json, tim bai da den ngay dang ma chua co tren site,
// roi noi day du: chep thu muc bai VI + EN, chen the card vao /blog/ va /blog-en/,
// them 2 khoi <url> vao sitemap.xml.
//
// Chay:  node tools/dang-bai-theo-lich.mjs [--thu] [--ngay 2026-09-05]
//   --thu   chi bao se lam gi, khong ghi file nao
//   --ngay  gia lap ngay hom nay (de thu truoc)
//
// "Da dang hay chua" xac dinh bang viec thu muc <slug>/index.html co ton tai
// tren main hay khong — khong giu file trang thai rieng, nen chay lai bao nhieu
// lan cung ra cung ket qua, khong can ghi nguoc lai nhanh nhap.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { BAC_DLN, datBac } from './bac-dln.mjs';

const ROOT = process.cwd();
const HANG_DOI = path.join(ROOT, 'hang-doi');
const THU = process.argv.includes('--thu');
const ngayEp = (() => {
  const i = process.argv.indexOf('--ngay');
  return i !== -1 ? process.argv[i + 1] : null;
})();

const loi = [];
const canhBao = [];

// ---------- tien ich ----------

// Ngay hom nay theo gio Viet Nam. Runner cua GitHub chay gio UTC, neu lay
// truc tiep thi tu 00:00 den 07:00 gio VN se ra ngay hom truoc.
function homNay() {
  if (ngayEp) return ngayEp;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

// Repo tron CRLF (may Windows) va LF (runner Linux) — bam theo file dang sua.
const eolCua = (s) => (s.includes('\r\n') ? '\r\n' : '\n');

const ngayVI = (iso) => { const [y, m, d] = iso.split('-'); return `${+d}/${+m}/${y}`; };
const ngayEN = (iso) => { const [y, m, d] = iso.split('-'); return `${+m}/${+d}/${y}`; };

// Doc kich thuoc that cua anh webp. Runner khong co sharp nen doc thang header.
function kichThuocWebp(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF') return null;
  const dang = b.toString('ascii', 12, 16);
  if (dang === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (dang === 'VP8L') { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }; }
  if (dang === 'VP8X') return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
  return null;
}

function chepThuMuc(tu, den) {
  fs.mkdirSync(den, { recursive: true });
  for (const e of fs.readdirSync(tu, { withFileTypes: true })) {
    const a = path.join(tu, e.name), b = path.join(den, e.name);
    if (e.isDirectory()) chepThuMuc(a, b); else fs.copyFileSync(a, b);
  }
}

// ---------- dung the card ----------

// Lay the <article> thu HAI lam mau: the dau tien mang fetchpriority="high"
// (ung vien LCP), cac the sau deu loading="lazy". Nhan ban tu the thu hai roi
// chuan hoa lai sau khi chen, de dung mot the duy nhat duoc uu tien.
function layMauCard(html) {
  const cac = [...html.matchAll(/<article[\s\S]*?<\/article>/g)].map((m) => m[0]);
  if (cac.length < 2) return null;
  return cac[1];
}

function theImg(d, alt, tenAnh, kt) {
  return `<img srcset="../${tenAnh}-640w.webp 640w, ../${tenAnh}.webp ${kt.w}w" sizes="(max-width: 768px) 91vw, 361px" width="${kt.w}" height="${kt.h}" loading="lazy" decoding="async"
                         src="../${tenAnh}.webp"
                         alt="${alt}"
                         class="object-cover absolute inset-0 w-full h-full transition-transform duration-1000 group-hover:scale-110"
                       />`;
}

function taoCard(mau, d, lang, tenAnh, kt) {
  const href = lang === 'vi' ? `/${d.slug}/` : `/${d.slug}-en/`;
  const tieuDe = lang === 'vi' ? d.tieuDe : d.tieuDeEn;
  const tomTat = lang === 'vi' ? d.tomTat : d.tomTatEn;
  const danhMuc = lang === 'vi' ? d.danhMuc : d.danhMucEn;
  const ngay = lang === 'vi' ? ngayVI(d.ngayDang) : ngayEN(d.ngayDang);
  const alt = lang === 'vi' ? d.anhAlt : d.anhAltEn;

  // Luon thay bang HAM chu khong bang chuoi: tieu de / tom tat la chu do nguoi
  // viet nhap, neu lot ky tu $ vao chuoi thay the thi $& $1 se bi hieu la tham
  // chieu nhom va lam hong the.
  let c = mau;
  c = c.replace(/data-category="[^"]*"/, () => `data-category="${danhMuc}"`);
  c = c.replace(/href="\/[^"]*"/, () => `href="${href}"`);
  c = c.replace(/<img[\s\S]*?\/>/, () => theImg(d, alt, tenAnh, kt));
  c = c.replace(/(rounded-sm">)[^<]*(<)/, (_, a, b) => a + danhMuc + b);
  c = c.replace(/(tracking-widest[^>]*>)[^<]*(<)/, (_, a, b) => a + ngay + b);
  c = c.replace(/(<h2[^>]*>)([\s\S]*?)(<\/h2>)/, (_, a, cu, b) => a + giuThut(cu, tieuDe) + b);
  c = c.replace(/(<p class="text-\[#6B5443\][^>]*>)([\s\S]*?)(<\/p>)/, (_, a, cu, b) => a + giuThut(cu, tomTat) + b);
  return c;
}

// Giu nguyen thut dong cua noi dung cu, chi thay chu.
function giuThut(cu, moi) {
  const m = cu.match(/^(\s*)/);
  const dau = m ? m[1] : '';
  const cuoi = (cu.match(/(\s*)$/) || ['', ''])[1];
  return dau + moi + cuoi;
}

// Dung mot the duy nhat — the dau tien — mang fetchpriority="high". The 2 va 3 cung KHONG lazy:
// tu 1024px luoi 3 cot nen ca hang dau nam trong khung nhin dau (do 14-09-2026: 2 anh lazy o
// top 474px khi /blog/ rong 1350px). Tren mobile Chrome van tai hai anh do ngay luc load vi nam
// trong nguong lazy, nen bo lazy khong ton them byte.
function chuanHoaUuTienAnh(html) {
  let i = 0;
  return html.replace(/<article[\s\S]*?<\/article>/g, (the) => {
    i += 1;
    let t = the;
    if (i <= 3) {
      t = t.replace(/\s*loading="lazy"/, '');
      if (i === 1) { if (!/fetchpriority=/.test(t)) t = t.replace(/(<img\s)/, '$1fetchpriority="high" '); }
      else t = t.replace(/\s*fetchpriority="high"/, '');
    } else {
      t = t.replace(/\s*fetchpriority="high"/, '');
      if (!/loading=/.test(t)) t = t.replace(/(<img\s)/, '$1loading="lazy" ');
    }
    return t;
  });
}

function chenCard(file, d, lang, tenAnh, kt) {
  const html = fs.readFileSync(file, 'utf8');
  const nl = eolCua(html);
  const mau = layMauCard(html);
  if (!mau) { loi.push(`${file}: khong tim duoc the <article> mau`); return null; }

  const href = lang === 'vi' ? `/${d.slug}/` : `/${d.slug}-en/`;
  if (html.includes(`href="${href}"`)) { canhBao.push(`${file}: da co the cho ${href}, bo qua`); return html; }

  const neo = html.match(/id="blog-grid"[^>]*>/);
  if (!neo) { loi.push(`${file}: khong tim thay #blog-grid`); return null; }

  const card = taoCard(mau, d, lang, tenAnh, kt);
  // Lay dung thut cua the mau de the moi thang hang voi cac the con lai.
  const viTri = html.indexOf(mau);
  const thut = (html.slice(0, viTri).match(/([ \t]*)$/) || ['', ''])[1];
  const chen = neo[0] + nl + thut + card;
  return chuanHoaUuTienAnh(html.replace(neo[0], () => chen));
}

// ---------- sitemap ----------

function khoiUrl(slug, ngay, uuTien, nl) {
  const u = `https://xomleo.vn/${slug}/`;
  const uEn = `https://xomleo.vn/${slug}-en/`;
  return [
    '  <url>',
    `    <loc>${u}</loc>`,
    `    <lastmod>${ngay}</lastmod>`,
    `    <priority>${uuTien}</priority>`,
    `    <xhtml:link rel="alternate" hreflang="vi" href="${u}" />`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${uEn}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${u}" />`,
    '  </url>',
    '  <url>',
    `    <loc>${uEn}</loc>`,
    `    <lastmod>${ngay}</lastmod>`,
    `    <priority>${uuTien}</priority>`,
    `    <xhtml:link rel="alternate" hreflang="vi" href="${u}" />`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${uEn}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${u}" />`,
    '  </url>',
  ].join(nl) + nl;
}

// ---------- kiem tra truoc khi ghi ----------

function kiemTraBaiNhap(d) {
  const v = [];
  for (const k of ['slug', 'ngayDang', 'tieuDe', 'tieuDeEn', 'tomTat', 'tomTatEn', 'anh', 'anhAlt', 'anhAltEn']) {
    if (!d[k]) v.push(`thieu truong "${k}"`);
  }
  if (d.slug && !/^[a-z0-9-]+$/.test(d.slug)) v.push(`slug "${d.slug}" chi duoc chua chu thuong, so va dau gach ngang`);
  if (d.slug && d.slug.endsWith('-en')) v.push(`slug khong duoc ket thuc bang "-en" (ban EN tu sinh)`);
  if (d.ngayDang && !/^\d{4}-\d{2}-\d{2}$/.test(d.ngayDang)) v.push(`ngayDang "${d.ngayDang}" phai dang YYYY-MM-DD`);
  // Bac DLN thanh <html data-dln> -> content_group cua GA4. Thieu thi bai vao "(not set)".
  if (!BAC_DLN[d.bac]) v.push(`"bac" phai la mot trong ${Object.keys(BAC_DLN).join('/')} (dang la "${d.bac ?? ''}") — lay theo cot bac trong ke-hoach-26-bai.json`);

  for (const hau of ['', '-en']) {
    const f = path.join(HANG_DOI, d.slug + hau, 'index.html');
    if (!fs.existsSync(f)) { v.push(`thieu ban nhap ${path.relative(ROOT, f)}`); continue; }
    const s = fs.readFileSync(f, 'utf8');
    const url = `https://xomleo.vn/${d.slug}${hau}/`;
    if (!s.includes(`<link rel="canonical" href="${url}">`)) v.push(`${d.slug}${hau}: canonical phai tro ve ${url}`);
    if (!s.includes(`hreflang="vi" href="https://xomleo.vn/${d.slug}/"`)) v.push(`${d.slug}${hau}: thieu hreflang vi`);
    if (!s.includes(`hreflang="en" href="https://xomleo.vn/${d.slug}-en/"`)) v.push(`${d.slug}${hau}: thieu hreflang en`);
    if ((s.match(/<h1/g) || []).length !== 1) v.push(`${d.slug}${hau}: phai co dung 1 the <h1>`);
  }

  // Bo loc tab o /blog/ an moi the co data-category khong trung nut tab nao, nen bai sai
  // (hoac thieu) chuyen muc van len song ma khong hien tren trang Blog.
  for (const [truong, trang] of [['danhMuc', 'blog/index.html'], ['danhMucEn', 'blog-en/index.html']]) {
    const tab = [...fs.readFileSync(path.join(ROOT, trang), 'utf8').matchAll(/data-tab="([^"]*)"/g)].map((m) => m[1]);
    if (!tab.includes(d[truong])) v.push(`${truong} "${d[truong]}" khong trung nut tab nao o ${trang} (${tab.join(' / ')})`);
  }

  if (d.anh) {
    const goc = path.join(ROOT, d.anh);
    const nho = path.join(ROOT, d.anh.replace(/\.webp$/, '-640w.webp'));
    if (!fs.existsSync(goc)) v.push(`khong thay anh ${d.anh}`);
    if (!fs.existsSync(nho)) v.push(`khong thay bien the ${path.relative(ROOT, nho)} (card can ban 640w)`);
  }

  if (d.noiTu !== undefined && !Array.isArray(d.noiTu)) v.push('"noiTu" phai la mang slug');
  for (const nguon of Array.isArray(d.noiTu) ? d.noiTu : []) {
    for (const hau of ['', '-en']) {
      const f = path.join(ROOT, nguon + hau, 'index.html');
      if (!fs.existsSync(f)) { v.push(`noiTu: khong co trang ${nguon}${hau}/`); continue; }
      const s = fs.readFileSync(f, 'utf8');
      if (/http-equiv="refresh"/i.test(s)) { v.push(`noiTu: ${nguon}${hau}/ la stub chuyen huong`); continue; }
      if (!timKhoiLienQuan(s, hau)) v.push(`noiTu: ${nguon}${hau}/ khong co dung 1 khoi "${hau ? NHAN_LQ.en : NHAN_LQ.vi}" co san <li> mau`);
    }
  }
  if (!d.noiTu || !d.noiTu.length) canhBao.push(`${d.slug}: khong khai "noiTu" — bai len song chi co link tu the /blog/`);
  return v;
}

// ---------- noi link tu trang lien quan ----------

// Bai moi chi duoc link tu the card o /blog/ thi Google coi la trang le loi: do 21-09-2026,
// bai nhom dong dang 3 ngay van 0 link trong noi dung trang nao. Muc "noiTu" trong
// lich-dang.json liet ke slug (ban VI) cua cac trang nen tro toi bai; luc dang, script chen
// mot <li> vao khoi "Bai viet lien quan" san co cua ca ban VI lan ban EN cua trang do.
const NHAN_LQ = { vi: 'Bài viết liên quan', en: 'Related articles' };

function timKhoiLienQuan(s, hau) {
  const nhan = hau ? NHAN_LQ.en : NHAN_LQ.vi;
  const cac = [...s.matchAll(/<aside\b[^>]*aria-label="([^"]*)"[^>]*>[\s\S]*?<\/aside>/g)].filter((m) => m[1] === nhan);
  if (cac.length !== 1) return null;
  const li = [...cac[0][0].matchAll(/([ \t]*)<li><a class="text-primary hover:underline" href="[^"]*"[^>]*>[\s\S]*?<\/a><\/li>/g)].pop();
  if (!li) return null;
  return { aside: cac[0][0], viTri: cac[0].index, li };
}

const escChu = (s) => String(s)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function noiTuTrangLienQuan(d) {
  for (const nguon of d.noiTu || []) {
    for (const hau of ['', '-en']) {
      const f = path.join(ROOT, nguon + hau, 'index.html');
      const s = fs.readFileSync(f, 'utf8');
      const k = timKhoiLienQuan(s, hau);
      const href = `/${d.slug}${hau}/`;
      if (k.aside.includes(`href="${href}"`)) continue;
      const nhan = escChu(hau ? d.tieuDeEn : d.tieuDe);
      const cuoi = k.viTri + k.li.index + k.li[0].length;
      const moi = eolCua(s) + k.li[1] + `<li><a class="text-primary hover:underline" href="${href}">${nhan}</a></li>`;
      fs.writeFileSync(f, s.slice(0, cuoi) + moi + s.slice(cuoi));
      console.log(`    link tu /${nguon}${hau}/`);
    }
  }
}

// Font tieu de (Playfair Display tu 24-09-2026, truoc do Dancing Script) la ban subset
// theo fonts/subset-kytu.txt (xem tools/sinh-subset-font.mjs). Ky tu ngoai bo subset
// trong tieu de se roi ve Georgia/Times, nam lan trong chu Playfair thi nhin ra.
// (Than bai dung Signika ban day du nen khong bi.) Site hien khong dung ky tu nao nhu vay,
// nhung bai dang sau nay co ten nuoc ngoai (Zurich, Malaga, Munchen...) thi lo.
// Day chi la CANH BAO, khong chan dang bai: lech font la chuyen tham my, khong
// dang de mot bai da len lich phai nam lai.
// Sua khi bi canh bao: them ky tu vao tools/sinh-subset-font.mjs roi chay
//   node tools/sinh-subset-font.mjs --ghi
//   node tools/build-css.js --write && node tools/cache-bust.js --write
// LUU Y: dung tuong cu them thoai mai. Do duoc 29-08-2026, hieu ung co NGUONG —
// subset phinh len 46,7 KB la mat sach 650ms LCP vua an duoc. Them it thoi.
function kiemPhuFont(d) {
  const fileBo = path.join(ROOT, 'fonts/subset-kytu.txt');
  if (!fs.existsSync(fileBo)) return;                 // chua dung subset thi bo qua
  const bo = new Set([...fs.readFileSync(fileBo, 'utf8')].map((c) => c.codePointAt(0)));

  for (const hau of ['', '-en']) {
    const f = path.join(HANG_DOI, d.slug + hau, 'index.html');
    if (!fs.existsSync(f)) continue;
    let s = fs.readFileSync(f, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');
    const thuocTinh = [...s.matchAll(/\b(alt|title|aria-label)="([^"]*)"/g)].map((m) => m[2]).join(' ');
    s = s.replace(/<[^>]+>/g, ' ') + ' ' + thuocTinh;

    const thieu = new Map();
    for (const ch of s) {
      const cp = ch.codePointAt(0);
      // Chi quan tam khoang Latin/dau cau ma font CO THE ve. Emoji, mui ten, chu
      // Han... von da roi font he thong tu truoc khi co subset — khong phai loi moi.
      const trongTam = cp <= 0x24f || (cp >= 0x1e00 && cp <= 0x1eff)
        || (cp >= 0x2000 && cp <= 0x206f) || cp === 0x20ab || cp === 0x20ac;
      if (!trongTam || bo.has(cp) || /\s/.test(ch)) continue;
      thieu.set(ch, (thieu.get(ch) || 0) + 1);
    }
    if (thieu.size) {
      const ds = [...thieu.entries()].sort((a, b) => b[1] - a[1])
        .map(([c, n]) => `${c}(U+${c.codePointAt(0).toString(16).toUpperCase()})x${n}`).join(' ');
      canhBao.push(`${d.slug}${hau}: ${thieu.size} ky tu ngoai subset font, se ve bang Arial: ${ds}`);
    }
  }
}

// ---------- chay ----------

const hn = homNay();
console.log(`Hom nay (gio VN): ${hn}${THU ? '   [CHE DO THU — khong ghi gi]' : ''}\n`);

const fileLich = path.join(HANG_DOI, 'lich-dang.json');
if (!fs.existsSync(fileLich)) {
  console.log('Khong co hang-doi/lich-dang.json — khong co gi de dang.');
  process.exit(0);
}

const lich = JSON.parse(fs.readFileSync(fileLich, 'utf8'));
const dsBai = Array.isArray(lich) ? lich : lich.bai || [];

const denHan = [];
for (const d of dsBai) {
  const daCo = d.slug && fs.existsSync(path.join(ROOT, d.slug, 'index.html'));
  if (daCo) { console.log(`  [da dang]  ${d.slug}`); continue; }
  if (!d.ngayDang || d.ngayDang > hn) { console.log(`  [cho ${d.ngayDang}]  ${d.slug}`); continue; }
  denHan.push(d);
}

if (!denHan.length) {
  console.log('\nKhong co bai nao den han hom nay.');
  process.exit(0);
}

console.log(`\nDen han: ${denHan.length} bai\n`);

// Kiem tra het truoc, khong ghi gi neu con loi — tranh dang nua voi.
for (const d of denHan) {
  const v = kiemTraBaiNhap(d);
  if (v.length) { console.log(`  X ${d.slug}`); v.forEach((x) => loi.push(`${d.slug}: ${x}`)); }
  else console.log(`  OK ${d.slug}  (${d.ngayDang})`);
  kiemPhuFont(d);   // canh bao thoi, khong chan dang
}

if (loi.length) {
  console.log('\nDUNG LAI — ban nhap chua dat:\n');
  loi.forEach((x) => console.log('  - ' + x));
  process.exit(1);
}

if (THU) {
  console.log('\n[THU] Se dang ' + denHan.length + ' bai: ' + denHan.map((d) => d.slug).join(', '));
  // In canh bao o day luon. Khoi canhBao.forEach o cuoi file nam SAU buoc ghi nen
  // che do --thu khong bao gio chay toi — ma --thu moi la luc can doc canh bao
  // nhat, truoc khi bai len that.
  if (canhBao.length) {
    console.log('\nCanh bao:');
    canhBao.forEach((x) => console.log('  ! ' + x));
  }
  process.exit(0);
}

// ---------- dong bo boilerplate ----------

// Ban nhap dung tu luc tao — co khi vai tuan truoc ngay dang — nen phan khung co the da cu
// so voi site. Bai dat-tiec-sinh-nhat (tao 29-08, dang 08-09) len song voi doan GA nap ngay
// luc 'load' (ban sua 13-09 cho GA doi FCP bo sot no), main.min.js khong defer (sua 05-09)
// va thieu preload font; phat hien 14-09-2026. Lay ca ba tu trang /blog/ cung ngon ngu, vi
// trang do luon duoc sua cung dot voi toan site. CSP: workflow chay csp-hash.mjs --write sau.
//
// Them hai thu (21-09-2026), cung ly do ban nhap soan tu truoc: bai nhom dong len song
// (a) thieu the robots max-snippet ma toan site da co tu 16-09, va (b) nut doi ngon ngu
// VN|EN tro ve bai khung cua tools/tao-bai-nhap.mjs chu khong ve chinh no.
function dongBoKhung(fileBai, fileMau, slug, bac) {
  const s = fs.readFileSync(fileBai, 'utf8');
  const mau = fs.readFileSync(fileMau, 'utf8');
  const nl = eolCua(s);
  const khoiGA = (h) => [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].filter((m) => m[1].includes('loadGA'));
  // Doan GA chep tu /blog/ doc <html data-dln> de gui content_group (22-09-2026). Ban nhap
  // soan truoc ngay do khong co thuoc tinh, con ban sinh tu bai khung thi mang bac P cua khung.
  let t = datBac(s, BAC_DLN[bac]);
  const gaMau = khoiGA(mau);
  const gaBai = khoiGA(t);
  if (gaMau.length === 1 && gaBai.length === 1) t = t.replace(gaBai[0][0], () => gaMau[0][0].replace(/\r?\n/g, nl));
  else canhBao.push(`${path.relative(ROOT, fileBai)}: khong dong bo duoc doan GA (trang mau ${gaMau.length} khoi, bai ${gaBai.length} khoi)`);
  t = t.replace(/(<script src="[^"]*main\.min\.js\?[^"]*")(><\/script>)/g, '$1 defer$2');
  const preload = (mau.match(/<link rel="preload" as="font"[^>]*>/) || [])[0];
  if (preload && !t.includes('rel="preload" as="font"')) {
    t = t.replace(/([ \t]*)(<style id="site-css"|<link rel="stylesheet"|<title>)/, (_, thut, the) => thut + preload + nl + thut + the);
  }
  const robots = (mau.match(/<meta name="robots"[^>]*>/) || [])[0];
  if (robots && !t.includes('<meta name="robots"')) {
    t = t.replace(/([ \t]*)(<meta name="viewport"[^>]*>)/, (_, thut, the) => thut + the + nl + thut + robots);
  }
  t = t.replace(/(<a\s+href=")[^"]*("\s+hreflang="(vi|en)")/g, (_, a, b, l) => a + (l === 'vi' ? `/${slug}/` : `/${slug}-en/`) + b);
  // Khoi "Giai dap nhanh" <section id="faq"> sau </article> la 7 cau hoi cua bai khung (view
  // xe lua), tao-bai-nhap.mjs truoc 21-09-2026 chep nguyen sang. Bai co muc FAQ rieng trong
  // <article> thi khoi do chac chan la cua khung — go.
  const sauBai = t.indexOf('</article>');
  if (sauBai !== -1 && t.includes(`id="faq-${slug}"`)) {
    t = t.slice(0, sauBai) + t.slice(sauBai).replace(/\s*<section id="faq"[\s\S]*?<\/section>/, '');
  }
  if (t !== s) fs.writeFileSync(fileBai, t);
}

// ---------- ghi ----------

const daDang = [];
for (const d of denHan) {
  const tenAnh = d.anh.replace(/\.webp$/, '');
  const kt = kichThuocWebp(path.join(ROOT, d.anh)) || { w: 768, h: 512 };

  chepThuMuc(path.join(HANG_DOI, d.slug), path.join(ROOT, d.slug));
  chepThuMuc(path.join(HANG_DOI, d.slug + '-en'), path.join(ROOT, d.slug + '-en'));
  dongBoKhung(path.join(ROOT, d.slug, 'index.html'), path.join(ROOT, 'blog/index.html'), d.slug, d.bac);
  dongBoKhung(path.join(ROOT, d.slug + '-en', 'index.html'), path.join(ROOT, 'blog-en/index.html'), d.slug, d.bac);
  noiTuTrangLienQuan(d);

  for (const [file, lang] of [['blog/index.html', 'vi'], ['blog-en/index.html', 'en']]) {
    const moi = chenCard(path.join(ROOT, file), d, lang, tenAnh, kt);
    if (moi === null) { console.log('\nLoi khi chen card, dung lai.'); process.exit(1); }
    fs.writeFileSync(path.join(ROOT, file), moi);
  }

  const fSm = path.join(ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(fSm, 'utf8');
  const nl = eolCua(xml);
  if (!xml.includes(`<loc>https://xomleo.vn/${d.slug}/</loc>`)) {
    xml = xml.replace(/(\s*)<\/urlset>/, nl + khoiUrl(d.slug, d.ngayDang, d.uuTien || '0.6', nl) + '</urlset>');
  }
  // /blog/ va /blog-en/ vua co them the bai nen lastmod cua chung cung phai theo ngay dang —
  // Bing xep lich crawl theo lastmod, de ngay cu thi no khong biet trang danh sach da doi.
  for (const ds of ['blog', 'blog-en']) {
    xml = xml.replace(
      new RegExp(`(<loc>https://xomleo\\.vn/${ds}/</loc>\\s*<lastmod>)([^<]*)(</lastmod>)`),
      (m, dau, cu, cuoi) => (cu < d.ngayDang ? dau + d.ngayDang + cuoi : m),
    );
  }
  fs.writeFileSync(fSm, xml);

  daDang.push(d);
  console.log(`\n  + ${d.slug}  va  ${d.slug}-en`);
  console.log(`    card vao /blog/ va /blog-en/, 2 khoi <url> vao sitemap, lastmod 4 URL = ${d.ngayDang}`);
}

canhBao.forEach((x) => console.log('  ! ' + x));

// ---------- kiem lai bang chinh bo audit cua site ----------

console.log('\nChay tools/audit-links.mjs de kiem lai...');
try {
  const out = execFileSync('node', ['tools/audit-links.mjs'], { cwd: ROOT, encoding: 'utf8' });
  const m = out.match(/TỔNG:\s*(\d+)/);
  const tong = m ? Number(m[1]) : -1;
  if (tong !== 0) {
    console.log(out);
    console.log(`\nAUDIT BAO ${tong} LOI — khong commit. Sua ban nhap roi chay lai.`);
    process.exit(1);
  }
  console.log('  audit: TONG 0');
} catch (e) {
  console.log('  Khong chay duoc audit: ' + e.message);
  process.exit(1);
}

const danhSach = daDang.map((d) => d.slug).join(', ');
console.log(`\nXong: dang ${daDang.length} bai — ${danhSach}`);

// Cho workflow lay lam noi dung commit message.
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `so_bai=${daDang.length}\nda_dang=${danhSach}\n`);
}
