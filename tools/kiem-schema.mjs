// Kiem structured data (JSON-LD) toan site truoc va sau moi lan doi trang.
//
// Chay:  node tools/kiem-schema.mjs                  ca site
//        node tools/kiem-schema.mjs hang-doi         chi ban nhap, truoc khi dang
//        node tools/kiem-schema.mjs --chi-loi        an canh bao
//        node tools/kiem-schema.mjs --json kq.json   ghi ket qua ra file
//
// Hai lop kiem:
//  1. Tu vung schema.org — thay Schema Markup Validator: @type co that, thuoc tinh co
//     that, thuoc tinh dung cho loai do, gia tri long nhau dung mien. Tai tu vung tu
//     schema.org, cache 30 ngay trong thu muc tam. Khong tai duoc thi bo qua lop nay
//     (co bao), khong lam fail.
//  2. Luat Google — thay Rich Results Test (tu 2026 cong cu nay bat dang nhap nen khong
//     tu dong hoa duoc): thuoc tinh bat buoc/khuyen nghi theo tai lieu Google cap nhat
//     08-09-2026 cho Local business, Article, Breadcrumb, Organization; anh co that va
//     du kich thuoc; URL noi bo khong 404; FAQ khop noi dung hien thi; khong microdata
//     hay data-vocabulary; khong tu khai danh gia cho chinh quan.
//
// Thoat ma 1 neu co LOI. CANH BAO khong lam fail.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = 'https://xomleo.vn';
const argv = process.argv.slice(2);
const CHI_LOI = argv.includes('--chi-loi');
const iJson = argv.indexOf('--json');
const FILE_JSON = iJson >= 0 ? argv[iJson + 1] : null;
const THU_MUC = argv.filter((a, i) => !a.startsWith('--') && !(iJson >= 0 && i === iJson + 1));

const BO_QUA = new Set(['.git', '.github', '.claude', 'node_modules', 'skills', 'tools', 'css', 'js', 'fonts', 'img', 'uploads', 'hang-doi']);
const NGAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'PublicHolidays'];
const ISO = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]([01]\d|2[0-3]):?[0-5]\d)?)?$/;

const mang = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const chuoi = (x) => typeof x === 'string' && x.trim() !== '';
const tenLoai = (t) => String(t).replace(/^https?:\/\/schema\.org\//, '').replace(/^schema:/, '');
const loaiCua = (n) => mang(n && n['@type']).map(tenLoai);
const laThamChieu = (n) => n && typeof n === 'object' && !Array.isArray(n) && n['@id'] && Object.keys(n).every((k) => k === '@id');

// ---------- tu vung schema.org ----------

async function taiTuVung() {
  const cache = path.join(os.tmpdir(), 'schemaorg-current-https.jsonld');
  try {
    if (Date.now() - fs.statSync(cache).mtimeMs < 30 * 864e5) return JSON.parse(fs.readFileSync(cache, 'utf8'));
  } catch {}
  try {
    const r = await fetch('https://schema.org/version/latest/schemaorg-current-https.jsonld');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const txt = await r.text();
    const json = JSON.parse(txt);
    fs.writeFileSync(cache, txt);
    return json;
  } catch {
    return null;
  }
}

function dungTuVung(raw) {
  const lop = new Map();
  const thuocTinh = new Map();
  const thanhVien = new Map();
  const ten = (x) => tenLoai(typeof x === 'string' ? x : x['@id']);
  for (const n of raw['@graph']) {
    if (!String(n['@id']).startsWith('schema:')) continue;
    const types = mang(n['@type']);
    if (types.includes('rdfs:Class')) lop.set(ten(n['@id']), mang(n['rdfs:subClassOf']).map(ten));
    else if (types.includes('rdf:Property')) {
      thuocTinh.set(ten(n['@id']), {
        mien: mang(n['schema:domainIncludes']).map(ten),
        giaTri: mang(n['schema:rangeIncludes']).map(ten),
        thayBang: mang(n['schema:supersededBy']).map(ten),
      });
    } else thanhVien.set(ten(n['@id']), types.map(ten));
  }
  const nho = new Map();
  const toTien = (t) => {
    if (nho.has(t)) return nho.get(t);
    const s = new Set([t]);
    nho.set(t, s);
    for (const c of lop.get(t) || []) for (const x of toTien(c)) s.add(x);
    return s;
  };
  return { lop, thuocTinh, thanhVien, toTien };
}

// Khong co tu vung thi van nhan dien duoc cac ho loai Google dung.
const HO_DU_PHONG = {
  LocalBusiness: ['LocalBusiness', 'FoodEstablishment', 'Restaurant', 'CafeOrCoffeeShop', 'BarOrPub', 'Bakery', 'FastFoodRestaurant'],
  FoodEstablishment: ['FoodEstablishment', 'Restaurant', 'CafeOrCoffeeShop', 'BarOrPub', 'Bakery', 'FastFoodRestaurant'],
  Article: ['Article', 'NewsArticle', 'BlogPosting', 'TechArticle', 'Report', 'ScholarlyArticle'],
  WebPage: ['WebPage', 'AboutPage', 'CollectionPage', 'ContactPage', 'FAQPage', 'ItemPage', 'ProfilePage', 'SearchResultsPage', 'CheckoutPage', 'MedicalWebPage', 'QAPage', 'RealEstateListing'],
  Person: ['Person', 'Patient'],
  Organization: ['Organization', 'LocalBusiness', 'Restaurant', 'Corporation', 'NGO'],
};

// ---------- doc file ----------

function duyet(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (BO_QUA.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) duyet(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function kichThuocAnh(f) {
  const b = fs.readFileSync(f);
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const dang = b.toString('ascii', 12, 16);
    if (dang === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (dang === 'VP8L') { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }; }
    if (dang === 'VP8X') return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
  }
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  if (b.toString('ascii', 0, 3) === 'GIF') return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  return null;
}

const giaiMa = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#0*39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&amp;/g, '&');
const boMa = (html) => html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '');
// The inline khong tao khoang trang khi hien thi, nen XOA the chu khong thay bang dau cach.
const chuHienThi = (html) => giaiMa(boMa(html).replace(/<[^>]+>/g, ''));
const gon = (s) => giaiMa(String(s)).replace(/<[^>]+>/g, '').replace(/\s+/g, '').toLowerCase();

// ---------- chay ----------

const rawTV = await taiTuVung();
const TV = rawTV ? dungTuVung(rawTV) : null;
const toTien = (t) => (TV ? TV.toTien(t) : new Set([t]));
const laHo = (types, goc) => types.some((t) => (TV ? TV.toTien(t).has(goc) : (HO_DU_PHONG[goc] || [goc]).includes(t)));

const GOC_URL = [ROOT, ...THU_MUC.map((d) => path.resolve(ROOT, d))];

// GitHub Pages phan biet hoa thuong, Windows thi khong: existsSync tren may Windows se cho qua
// URL "Anh.webp" trong khi site that tra 404. Doi chieu tung doan voi ten that trong thu muc.
const nhoThuMuc = new Map();
function coDungHoa(goc, rel) {
  let dir = goc;
  for (const doan of rel.split('/').filter(Boolean)) {
    let ds = nhoThuMuc.get(dir);
    if (!ds) {
      try { ds = new Set(fs.readdirSync(dir)); } catch { return false; }
      nhoThuMuc.set(dir, ds);
    }
    if (!ds.has(doan)) return false;
    dir = path.join(dir, doan);
  }
  return true;
}

function timFile(u) {
  let p;
  try { p = decodeURIComponent(new URL(u).pathname); } catch { return null; }
  const rel = p.replace(/^\//, '');
  for (const g of GOC_URL) {
    const f = path.join(g, rel);
    if (rel === '' || rel.endsWith('/')) { if (coDungHoa(g, rel + 'index.html')) return { file: path.join(f, 'index.html') }; }
    else if (coDungHoa(g, rel) && fs.statSync(f).isFile()) return { file: f };
    else if (coDungHoa(g, rel + '/index.html')) return { file: path.join(f, 'index.html'), thieuGach: true };
  }
  return null;
}

const robots = fs.existsSync(path.join(ROOT, 'robots.txt')) ? fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8') : '';
const disallow = [...robots.matchAll(/^Disallow:\s*(\S+)/gm)].map((m) => m[1]);

const files = (THU_MUC.length ? THU_MUC.flatMap((d) => duyet(path.resolve(ROOT, d))) : duyet(ROOT)).sort();
const ketQua = [];
const tinhNang = {};
const loaiKhongHoTro = {};
const idLoaiToanSite = new Map();
const thamChieuToanSite = [];
let tongKhoi = 0;

const LOAI_KHONG_RICH = {
  FAQPage: 'Google da ngung hien FAQ rich result (07-05-2026); schema van hop le, van giup hieu trang',
  Menu: 'khong phai rich result cua Google',
  WebPage: 'khong phai rich result; dung de noi graph',
  WebSite: 'dung cho ten trang web (site name), khong co item trong Rich Results Test',
  ReserveAction: 'khong con tinh nang Google tuong ung',
};

for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const goc = GOC_URL.slice(1).find((g) => f.startsWith(g + path.sep));
  const relUrl = path.relative(goc || ROOT, path.dirname(f)).replace(/\\/g, '/');
  const urlTrang = f.endsWith('index.html') ? `${SITE}/${relUrl ? relUrl + '/' : ''}` : `${SITE}/${path.basename(f)}`;
  const html = fs.readFileSync(f, 'utf8');
  const bao = (muc, ma, tin) => ketQua.push({ trang: rel, muc, ma, tin });

  const laStub = /http-equiv=["']refresh["']/i.test(html);
  const noindex = /<meta[^>]+name=["'](robots|googlebot)["'][^>]+content=["'][^"']*(noindex|none)/i.test(html);
  const canonical = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i) || [''])[0].match(/href=["']([^"']+)["']/)?.[1];
  const h1 = (boMa(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
  const navBc = (html.match(/<nav\b[^>]*aria-label=["']Breadcrumb["'][^>]*>([\s\S]*?)<\/nav>/i) || [])[1];
  const coNavBreadcrumb = Boolean(navBc);
  // Nhan breadcrumb dang hien — bo cac <li aria-hidden> chi chua dau phan cach
  const nhanNav = navBc ? [...navBc.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi)]
    .filter((m) => !/aria-hidden=["']true["']/i.test(m[1])).map((m) => chuHienThi(m[2]).trim()) : [];

  // Muc 196, 197
  if (/data-vocabulary\.org/i.test(html)) bao('LOI', 'data-vocabulary', 'con markup data-vocabulary.org — Google da ngung ho tro');
  if (/\sitem(scope|type|prop)\b/i.test(html)) bao('CANH_BAO', 'microdata', 'co Microdata — site dung JSON-LD, nen chuyen het ve JSON-LD');
  if (/\s(vocab|typeof)=["']/i.test(html)) bao('CANH_BAO', 'rdfa', 'co RDFa — nen chuyen ve JSON-LD');

  const khoi = [...html.matchAll(/<script\b[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)];
  const hienThi = chuHienThi(html);
  if (/"@context"\s*:|"@type"\s*:/.test(hienThi)) bao('LOI', 'json-lo-ra', 'JSON-LD nam ngoai the <script>, hien ra man hinh cho khach');
  if (!khoi.length) continue;
  tongKhoi += khoi.length;
  if (noindex) bao('CANH_BAO', 'noindex', 'trang noindex nhung co JSON-LD — Google khong dung');
  if (disallow.some((d) => new URL(urlTrang).pathname.startsWith(d))) bao('CANH_BAO', 'robots-chan', 'robots.txt chan trang co JSON-LD');

  const nutTrang = [];
  const theoId = new Map();
  khoi.forEach((m, i) => {
    let json;
    try { json = JSON.parse(m[1]); } catch (e) { bao('LOI', 'json-hong', `khoi ${i + 1}: JSON khong parse duoc — ${e.message}`); return; }
    for (const goc of mang(json)) {
      const ctx = goc && goc['@context'];
      if (!ctx || !JSON.stringify(ctx).includes('schema.org')) bao('LOI', 'context', `khoi ${i + 1}: thieu @context schema.org`);
    }
    const di = (v, duong) => {
      if (Array.isArray(v)) return v.forEach((x, k) => di(x, `${duong}[${k}]`));
      if (!v || typeof v !== 'object') return;
      nutTrang.push({ n: v, duong });
      if (v['@id'] && !laThamChieu(v)) {
        (theoId.get(v['@id']) || theoId.set(v['@id'], []).get(v['@id'])).push(v);
        if (v['@type']) {
          const s = idLoaiToanSite.get(v['@id']) || idLoaiToanSite.set(v['@id'], new Map()).get(v['@id']);
          const k = loaiCua(v).sort().join('+');
          s.set(k, (s.get(k) || new Set()).add(rel));
        }
      }
      for (const [k, x] of Object.entries(v)) if (k !== '@context') di(x, duong ? `${duong}.${k}` : k);
    };
    di(json, `khoi${i + 1}`);
  });

  // Chuoi ban: the HTML, thuc the chua giai ma, gia tri rong/undefined
  for (const { n, duong } of nutTrang) {
    for (const [k, v] of Object.entries(n)) {
      for (const s of mang(v)) {
        if (typeof s !== 'string') continue;
        if (s.trim() === '') bao('LOI', 'rong', `${duong}.${k} rong`);
        else if (/^(undefined|null|NaN|\[object Object\])$/.test(s) || /\{\{|\$\{/.test(s)) bao('LOI', 'rac', `${duong}.${k} = "${s}"`);
        if (k !== 'urlTemplate' && /<\/?[a-z][a-z0-9]*\b[^>]*>/i.test(s)) bao('LOI', 'the-html', `${duong}.${k} chua the HTML: "${s.slice(0, 80)}"`);
        if (/&(amp|nbsp|quot|lt|gt|#\d+|#x[0-9a-f]+);/i.test(s)) bao('CANH_BAO', 'thuc-the', `${duong}.${k} chua thuc the HTML chua giai ma: "${s.slice(0, 80)}"`);
        if (s.startsWith('http://xomleo.vn')) bao('CANH_BAO', 'http', `${duong}.${k} dung http:// cho URL noi bo`);
        if (s.startsWith(SITE) && k !== '@id') {
          const t = timFile(s);
          if (!t) bao('LOI', 'url-404', `${duong}.${k} ${s} khong co trong repo (404)`);
          else if (t.thieuGach) bao('CANH_BAO', 'url-301', `${duong}.${k} ${s} thieu dau / cuoi — GitHub Pages chuyen huong 301`);
        }
      }
    }
    if (laThamChieu(n)) thamChieuToanSite.push({ id: n['@id'], trang: rel, coTrenTrang: theoId.has(n['@id']) });
  }

  // Lop 1: tu vung schema.org
  if (TV) {
    for (const { n, duong } of nutTrang) {
      const types = loaiCua(n);
      if (!types.length) continue;
      for (const t of types) if (!TV.lop.has(t)) bao('LOI', 'tv-loai', `${duong}: @type "${t}" khong co trong schema.org`);
      const tien = new Set(types.flatMap((t) => [...toTien(t)]));
      for (const [k, v] of Object.entries(n)) {
        if (k.startsWith('@')) continue;
        const tt = TV.thuocTinh.get(k);
        if (!tt) { bao('LOI', 'tv-thuoc-tinh', `${duong}: thuoc tinh "${k}" khong co trong schema.org`); continue; }
        if (tt.mien.length && !tt.mien.some((d) => tien.has(d))) bao('LOI', 'tv-mien', `${duong}: "${k}" khong dung cho ${types.join('+')} (chi cho ${tt.mien.join(', ')})`);
        if (tt.thayBang.length) bao('THONG_TIN', 'tv-cu', `${duong}: "${k}" da duoc thay bang "${tt.thayBang.join(', ')}" (van hop le)`);
        const chiEnum = tt.giaTri.length && tt.giaTri.every((r) => TV.toTien(r).has('Enumeration'));
        for (const x of mang(v)) {
          if (x && typeof x === 'object' && x['@type']) {
            const lx = loaiCua(x);
            const ok = tt.giaTri.some((r) => ['Text', 'URL', 'Thing'].includes(r)) || lx.some((t) => tt.giaTri.some((r) => toTien(t).has(r)));
            if (!ok) bao('CANH_BAO', 'tv-gia-tri', `${duong}.${k}: kieu ${lx.join('+')} khong nam trong mien gia tri (${tt.giaTri.join(', ')})`);
          } else if (typeof x === 'string' && chiEnum) {
            const ma = tenLoai(x);
            const hop = TV.thanhVien.get(ma);
            if (!hop || !hop.some((t) => tt.giaTri.some((r) => toTien(t).has(r)))) bao('LOI', 'tv-enum', `${duong}.${k}: "${x}" khong phai gia tri hop le cua ${tt.giaTri.join(', ')}`);
          }
        }
      }
    }
  }

  // Lop 2: luat Google
  const tinh = (ten, loi, cb) => {
    const t = tinhNang[ten] || (tinhNang[ten] = { item: 0, hopLe: 0, coCanhBao: 0, trang: new Set() });
    t.item++; t.trang.add(rel);
    if (!loi.length) t.hopLe++;
    if (cb.length) t.coCanhBao++;
  };
  const kiemAnh = (u, nhan, { minPx = 0, minCanh = 0 }, loi, cb) => {
    if (!chuoi(u)) { loi.push(`${nhan} khong co URL`); return; }
    if (!/^https?:\/\//.test(u)) { loi.push(`${nhan} "${u}" khong phai URL day du`); return; }
    if (!u.startsWith(SITE)) return;
    const t = timFile(u);
    if (!t) { loi.push(`${nhan} ${u} khong ton tai (404)`); return; }
    const kt = kichThuocAnh(t.file);
    if (!kt) { cb.push(`${nhan} ${u}: khong doc duoc kich thuoc`); return; }
    if (minPx && kt.w * kt.h < minPx) loi.push(`${nhan} ${u} chi ${kt.w}x${kt.h} = ${kt.w * kt.h} px (Google: toi thieu ${minPx})`);
    if (minCanh && Math.min(kt.w, kt.h) < minCanh) loi.push(`${nhan} ${u} chi ${kt.w}x${kt.h} (Google: toi thieu ${minCanh}x${minCanh})`);
  };
  const urlAnh = (v) => mang(v).map((x) => (typeof x === 'string' ? x : x && (x.url || x.contentUrl || x['@id'])));
  const giai = (x) => (laThamChieu(x) ? (theoId.get(x['@id']) || [])[0] || x : x);

  let soArticle = 0, soBreadcrumb = 0;
  for (const { n, duong } of nutTrang) {
    const types = loaiCua(n);
    // Trang chuyen huong: Google theo chuyen huong va bo qua schema o day — chi kiem cu phap + tu vung
    if (laStub || !types.length || laThamChieu(n)) continue;
    for (const t of types) if (LOAI_KHONG_RICH[t]) loaiKhongHoTro[t] = (loaiKhongHoTro[t] || 0) + 1;

    if (laHo(types, 'LocalBusiness') && (n.address || n.geo || n.openingHoursSpecification || n.telephone)) {
      const loi = [], cb = [];
      if (!chuoi(n.name)) loi.push('thieu name (bat buoc)');
      const a = n.address;
      if (!a) loi.push('thieu address (bat buoc)');
      else if (typeof a === 'string') cb.push('address la chuoi — nen la PostalAddress tach truong');
      else {
        for (const k of ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry']) if (!a[k]) cb.push(`address thieu ${k}`);
        if (a.addressCountry && !/^[A-Z]{2}$/.test(String(a.addressCountry))) cb.push(`addressCountry "${a.addressCountry}" nen la ma ISO 3166-1 alpha-2`);
      }
      if (!n.geo) cb.push('thieu geo');
      else for (const k of ['latitude', 'longitude']) {
        const s = String(n.geo[k] ?? '');
        const soLe = (s.split('.')[1] || '').length;
        if (!s || Number.isNaN(Number(s))) loi.push(`geo.${k} khong phai so`);
        else if (soLe < 5) loi.push(`geo.${k} = ${s} chi co ${soLe} chu so thap phan (Google: toi thieu 5)`);
      }
      if (!n.telephone) cb.push('thieu telephone');
      else if (!/^\+\d/.test(String(n.telephone).trim())) cb.push(`telephone "${n.telephone}" thieu ma quoc gia`);
      if (!n.url) cb.push('thieu url');
      if (!n.image) cb.push('thieu image');
      else urlAnh(n.image).forEach((u) => kiemAnh(u, 'image', {}, loi, cb));
      if (!n.priceRange) cb.push('thieu priceRange');
      else if ([...String(n.priceRange)].length >= 100) cb.push('priceRange tu 100 ky tu tro len — Google khong hien');
      if (laHo(types, 'FoodEstablishment')) {
        if (!n.servesCuisine) cb.push('thieu servesCuisine');
        if (!n.menu && !n.hasMenu) cb.push('thieu menu');
      }
      const ohs = mang(n.openingHoursSpecification);
      if (!ohs.length && !n.openingHours) cb.push('thieu openingHoursSpecification');
      for (const o of ohs) {
        for (const k of ['opens', 'closes']) if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(o[k] ?? ''))) loi.push(`openingHoursSpecification.${k} "${o[k]}" sai dinh dang hh:mm[:ss]`);
        const ngay = mang(o.dayOfWeek);
        if (!ngay.length) loi.push('openingHoursSpecification thieu dayOfWeek');
        for (const d of ngay) if (!NGAY.includes(tenLoai(d))) loi.push(`dayOfWeek "${d}" khong hop le`);
      }
      if (n.aggregateRating || n.review) loi.push('tu khai aggregateRating/review cho chinh quan — Google chi cho phep khi site danh gia doanh nghiep KHAC; rui ro manual action');
      loi.forEach((x) => bao('LOI', 'g-local', `${duong} (${types.join('+')}): ${x}`));
      cb.forEach((x) => bao('CANH_BAO', 'g-local', `${duong} (${types.join('+')}): ${x}`));
      tinh('Local business', loi, cb);
    }

    if (laHo(types, 'Article') && !laHo(types, 'SocialMediaPosting')) {
      soArticle++;
      const loi = [], cb = [];
      if (!chuoi(n.headline)) cb.push('thieu headline');
      const anh = urlAnh(n.image);
      if (!anh.length) cb.push('thieu image');
      anh.forEach((u) => kiemAnh(u, 'image', { minPx: 50000 }, loi, cb));
      for (const k of ['datePublished', 'dateModified']) {
        if (!n[k]) cb.push(`thieu ${k}`);
        else if (!ISO.test(n[k])) loi.push(`${k} "${n[k]}" khong dung ISO 8601`);
        else if (/T\d/.test(n[k]) && !/(Z|[+-]\d\d:?\d\d)$/.test(n[k])) cb.push(`${k} "${n[k]}" co gio nhung thieu mui gio`);
      }
      if (ISO.test(n.datePublished || '') && ISO.test(n.dateModified || '') && n.dateModified < n.datePublished) cb.push('dateModified truoc datePublished');
      const tacGia = mang(n.author);
      if (!tacGia.length) cb.push('thieu author');
      for (const a0 of tacGia) {
        if (typeof a0 === 'string') { cb.push(`author "${a0}" la chuoi — nen la Person/Organization`); continue; }
        const a = giai(a0);
        if (!chuoi(a.name)) { loi.push('author thieu name'); continue; }
        if (/^(by|bởi|viết bởi|written by)\s/i.test(a.name) || /https?:\/\//.test(a.name)) cb.push(`author.name "${a.name}" chua tien to hoac URL`);
        if (!a.url && !a.sameAs) cb.push('author thieu url/sameAs');
        if (!laHo(loaiCua(a), 'Person') && !laHo(loaiCua(a), 'Organization')) cb.push('author nen la Person hoac Organization');
      }
      if (canonical && n.url && n.url !== canonical) cb.push(`url ${n.url} khac canonical ${canonical}`);
      loi.forEach((x) => bao('LOI', 'g-article', `${duong}: ${x}`));
      cb.forEach((x) => bao('CANH_BAO', 'g-article', `${duong}: ${x}`));
      tinh('Article', loi, cb);
    }

    if (types.includes('BreadcrumbList')) {
      soBreadcrumb++;
      const loi = [], cb = [];
      const ds = mang(n.itemListElement);
      if (!ds.length) loi.push('itemListElement rong (bat buoc)');
      ds.forEach((li, i) => {
        const cuoi = i === ds.length - 1;
        if (!li || typeof li !== 'object') { loi.push(`phan tu ${i + 1} khong phai ListItem`); return; }
        if (!Number.isInteger(li.position)) (/^\d+$/.test(String(li.position)) ? cb : loi).push(`ListItem ${i + 1}: position "${li.position}" khong phai so nguyen`);
        else if (li.position !== i + 1) cb.push(`ListItem ${i + 1}: position = ${li.position}, khong lien tuc tu 1`);
        const item = li.item && typeof li.item === 'object' ? li.item['@id'] || li.item.url : li.item;
        const ten = li.name ?? (li.item && typeof li.item === 'object' ? li.item.name : undefined);
        if (!chuoi(ten)) loi.push(`ListItem ${i + 1}: thieu name`);
        if (!item && !cuoi) loi.push(`ListItem ${i + 1}: thieu item (chi muc cuoi moi duoc bo)`);
        if (item && !/^https?:\/\//.test(item)) loi.push(`ListItem ${i + 1}: item "${item}" khong phai URL day du`);
      });
      // Google: name la "ten breadcrumb hien cho nguoi dung" — so voi nav dang hien, khong so voi h1
      if (!coNavBreadcrumb) cb.push('co BreadcrumbList nhung trang khong hien breadcrumb');
      else if (nhanNav.length !== ds.length) cb.push(`BreadcrumbList co ${ds.length} muc, breadcrumb dang hien co ${nhanNav.length}`);
      else ds.forEach((li, i) => {
        const ten = li && (li.name ?? (li.item && typeof li.item === 'object' ? li.item.name : undefined));
        if (chuoi(ten) && gon(ten) !== gon(nhanNav[i])) cb.push(`muc ${i + 1} "${ten.slice(0, 60)}" khac nhan dang hien "${nhanNav[i].slice(0, 60)}"`);
      });
      loi.forEach((x) => bao('LOI', 'g-breadcrumb', `${duong}: ${x}`));
      cb.forEach((x) => bao('CANH_BAO', 'g-breadcrumb', `${duong}: ${x}`));
      tinh('Breadcrumb', loi, cb);
    }

    if (n.logo) {
      const loi = [], cb = [];
      urlAnh(n.logo).forEach((u) => kiemAnh(u, 'logo', { minCanh: 112 }, loi, cb));
      loi.forEach((x) => bao('LOI', 'g-logo', `${duong}: ${x}`));
      cb.forEach((x) => bao('CANH_BAO', 'g-logo', `${duong}: ${x}`));
      if (laHo(types, 'Organization')) tinh('Organization (logo)', loi, cb);
    }

    if (types.includes('FAQPage') && !laStub) {
      for (const q of mang(n.mainEntity)) {
        const hoi = q && q.name, dap = q && q.acceptedAnswer && mang(q.acceptedAnswer)[0]?.text;
        if (!chuoi(hoi) || !chuoi(dap)) { bao('LOI', 'faq', `${duong}: Question thieu name hoac acceptedAnswer.text`); continue; }
        if (!gon(hienThi).includes(gon(hoi))) bao('LOI', 'faq-an', `${duong}: cau hoi khong hien tren trang: "${hoi.slice(0, 70)}"`);
        else if (!gon(hienThi).includes(gon(dap))) bao('LOI', 'faq-an', `${duong}: cau tra loi khong khop noi dung hien thi: "${hoi.slice(0, 70)}"`);
      }
    }

    if (laHo(types, 'WebPage') && !types.includes('FAQPage') && h1 && chuoi(n.name) && (n['@id'] === urlTrang || n.url === urlTrang) && gon(n.name) !== gon(h1)) {
      bao('CANH_BAO', 'webpage-h1', `${duong}: WebPage.name "${n.name.slice(0, 60)}" khac h1 "${chuHienThi(h1).trim().slice(0, 60)}"`);
    }
  }

  if (soArticle > 1) bao('CANH_BAO', 'trung', `${soArticle} node Article tren mot trang`);
  if (soBreadcrumb > 1) bao('CANH_BAO', 'trung', `${soBreadcrumb} BreadcrumbList tren mot trang`);
  if (coNavBreadcrumb && !soBreadcrumb && !laStub) bao('CANH_BAO', 'g-breadcrumb', 'trang hien breadcrumb nhung khong khai BreadcrumbList');

  // Cung @id khai hai lan tren mot trang voi gia tri khac nhau
  for (const [id, ds] of theoId) {
    if (ds.length < 2) continue;
    const khac = new Set();
    for (const a of ds) for (const b of ds) for (const k of Object.keys(a)) {
      if (k in b && typeof a[k] !== 'object' && a[k] !== b[k]) khac.add(k);
    }
    if (khac.size) bao('CANH_BAO', 'id-mau-thuan', `@id ${id} khai ${ds.length} lan, lech o: ${[...khac].join(', ')}`);
  }
  if (laStub) bao('THONG_TIN', 'stub', 'trang chuyen huong co JSON-LD — Google theo chuyen huong, bo qua schema o day');
}

// Toan site
for (const [id, m] of idLoaiToanSite) {
  if (m.size > 1) ketQua.push({ trang: '(toan site)', muc: 'CANH_BAO', ma: 'id-nhieu-loai', tin: `@id ${id} mang nhieu @type: ${[...m].map(([k, s]) => `${k} (${s.size} trang)`).join(' | ')}` });
}
const daKhai = new Set(idLoaiToanSite.keys());
// Kiem rieng ban nhap thi node khai o trang that (vd #website o trang chu) van tinh la da khai
if (THU_MUC.length) for (const f of duyet(ROOT)) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/<script\b[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    let j;
    try { j = JSON.parse(m[1]); } catch { continue; }
    const di = (v) => {
      if (Array.isArray(v)) return v.forEach(di);
      if (!v || typeof v !== 'object') return;
      if (v['@id'] && !laThamChieu(v)) daKhai.add(v['@id']);
      Object.values(v).forEach(di);
    };
    di(j);
  }
}
for (const t of thamChieuToanSite) if (!t.coTrenTrang && !daKhai.has(t.id)) {
  ketQua.push({ trang: t.trang, muc: 'CANH_BAO', ma: 'id-treo', tin: `tham chieu @id ${t.id} khong duoc khai o dau tren site` });
}

// ---------- in ----------

const loc = ketQua.filter((k) => k.muc === 'LOI' || (!CHI_LOI && k.muc === 'CANH_BAO'));
const theoTrang = new Map();
for (const k of loc) (theoTrang.get(k.trang) || theoTrang.set(k.trang, []).get(k.trang)).push(k);
for (const [trang, ds] of theoTrang) {
  console.log(`\n${trang}`);
  const dem = new Map();
  for (const k of ds) { const key = `${k.muc}|${k.ma}|${k.tin}`; dem.set(key, (dem.get(key) || 0) + 1); }
  for (const [key, n] of dem) { const [muc, ma, tin] = key.split('|'); console.log(`  ${muc === 'LOI' ? 'LOI     ' : 'CANH BAO'} [${ma}] ${tin}${n > 1 ? ` (x${n})` : ''}`); }
}

const soLoi = ketQua.filter((k) => k.muc === 'LOI').length;
const soCB = ketQua.filter((k) => k.muc === 'CANH_BAO').length;
console.log('\n==== TONG KET ====');
console.log(`${files.length} file HTML, ${tongKhoi} khoi JSON-LD`);
console.log(TV ? `Tu vung schema.org: ${TV.lop.size} loai, ${TV.thuocTinh.size} thuoc tinh` : 'Tu vung schema.org: KHONG TAI DUOC — bo qua lop kiem tu vung');
console.log('\nTinh nang Google (tuong duong Rich Results Test):');
for (const [ten, t] of Object.entries(tinhNang)) console.log(`  ${ten.padEnd(22)} ${t.item} item tren ${t.trang.size} trang — hop le ${t.hopLe}, khong hop le ${t.item - t.hopLe}, co canh bao ${t.coCanhBao}`);
console.log('\nLoai khong tao rich result (khong phai loi):');
for (const [t, n] of Object.entries(loaiKhongHoTro)) console.log(`  ${t.padEnd(22)} ${n} node — ${LOAI_KHONG_RICH[t]}`);
const theoMa = {};
for (const k of ketQua) if (k.muc !== 'THONG_TIN') theoMa[`${k.muc} ${k.ma}`] = (theoMa[`${k.muc} ${k.ma}`] || 0) + 1;
console.log('\nTheo ma:');
for (const [k, n] of Object.entries(theoMa).sort()) console.log(`  ${k.padEnd(28)} ${n}`);
console.log(`\nLOI: ${soLoi}   CANH BAO: ${soCB}`);
if (FILE_JSON) fs.writeFileSync(FILE_JSON, JSON.stringify({ tinhNang: Object.fromEntries(Object.entries(tinhNang).map(([k, v]) => [k, { ...v, trang: [...v.trang] }])), ketQua }, null, 1));
process.exit(soLoi ? 1 : 0);
