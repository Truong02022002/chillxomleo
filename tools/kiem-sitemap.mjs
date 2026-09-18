// Doi soat sitemap.xml voi URL chuan cua site (muc 266-268 cua cam nang GSC).
//
// Chay:  node tools/kiem-sitemap.mjs              kiem, thoat 1 neu co LOI
//        node tools/kiem-sitemap.mjs --sua        ghi lai lastmod cho dung thuc te
//        node tools/kiem-sitemap.mjs --json kq.json
//
// Ba lop kiem:
//  1. Moi <loc> phai la URL canonical dang song: file co that, khong noindex, khong
//     chuyen huong, va trang tu tro canonical ve chinh no. Day la dieu kien GSC doi
//     o muc "Sitemap duoc doi soat voi URL chuan".
//  2. Chieu nguoc lai: trang nao dang duoc phep index va tu-canonical ma vang mat
//     trong sitemap thi la trang mo coi. CHU Y 36 trang cua site co canonical tro
//     sang trang khac (co y, gop bai trung chu de) va cac stub chuyen huong — hai
//     nhom nay KHONG phai mo coi, dung dua vao sitemap.
//  3. lastmod phai dung. Google bo qua lastmod cua ca site neu thay no khong dang
//     tin. Ngay dung = lan cuoi NOI DUNG doi, do bang dau van tay title + description
//     + chu trong body (bo nav, footer, script, style) qua lich su git — giong cach
//     tools/indexnow.mjs loc, vi commit ky thuat (nhet CSS, cache-bust, doi header)
//     dong toi ~123 file ma khong doi mot chu nao.
//
// Lop 3 can lich su git day du. Checkout nong (fetch-depth 1) thi bo qua lop nay
// kem mot dong bao, khong lam fail.
//
// Lech lastmod la LOI khi chay kiem thuong, nhung chi la ghi chu khi chay --sua
// (vi luc do no da duoc va ngay trong cung lan chay do). Nho vay CI chan cung duoc
// ma luong dang bai tu dong van khong bi ket: no chay --sua truoc khi commit.
//
// Thoat ma 1 neu co LOI. CANH BAO khong lam fail.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import cp from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://xomleo.vn';
const F_SITEMAP = path.join(ROOT, 'sitemap.xml');

// hang-doi/ nam trong .gitignore — ban nhap chi song o may va o nhanh noi-dung,
// khong bao gio len GitHub Pages, nen khong tinh la trang cua site.
const BO_QUA_THU_MUC = new Set([
  '.git', '.github', '.claude', 'skills', 'tools', 'hang-doi',
  'img', 'css', 'js', 'fonts', 'uploads',
]);

const args = process.argv.slice(2);
const SUA = args.includes('--sua');
const fJson = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;

const HOM_NAY = new Date().toISOString().slice(0, 10);

const loi = [];
const canhBao = [];
const bao = (ds, muc, chiTiet) => ds.push({ muc, chiTiet });

// ---------- tien ich ----------

const giaiMa = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&');

const boGach = (u) => u.replace(/\/$/, '');

function urlCuaFile(rel) {
  if (rel === 'index.html') return SITE + '/';
  if (rel.endsWith('/index.html')) return SITE + '/' + rel.slice(0, -'index.html'.length);
  return SITE + '/' + rel;
}

function fileCuaUrl(u) {
  let p = u.replace(SITE, '');
  try { p = decodeURIComponent(p); } catch { /* URL da o dang thuong */ }
  p = p.replace(/^\//, '').replace(/\/$/, '');
  if (p === '') return 'index.html';
  return p.endsWith('.html') ? p : p + '/index.html';
}

function duyet(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (BO_QUA_THU_MUC.has(e.name)) continue;
      duyet(p, out);
    } else if (e.name.endsWith('.html')) {
      out.push(path.relative(ROOT, p).split(path.sep).join('/'));
    }
  }
  return out;
}

function docTrang(html) {
  const the = (re) => (html.match(re) || [])[1] || null;
  const canon = the(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
    || the(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  const robots = [...html.matchAll(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/gi)]
    .map((m) => m[1].toLowerCase()).join(' ');
  const refresh = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]*content=["']([^"']*)["']/i);
  return {
    canon: canon ? canon.trim() : null,
    robots,
    noindex: /noindex/.test(robots),
    chuyenHuong: refresh ? (refresh[1].match(/url=([^;]+)/i) || [, ''])[1].trim()
      : (/location\.(replace|href)\s*=/.test(html) ? '(js)' : null),
    hreflang: [...html.matchAll(/<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["']/gi)]
      .map((m) => [m[1], m[2].trim()]),
  };
}

// Dau van tay noi dung: chi phan chu nguoi doc thay, bo boilerplate.
function vanTay(html) {
  const title = giaiMa((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
  const desc = giaiMa((html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
  const vung = (html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html)
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|template|svg)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ');
  const chu = giaiMa(vung.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha1').update(title + '\u0000' + desc + '\u0000' + chu).digest('hex').slice(0, 12);
}

const git = (a) => cp.execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function coLichSuDayDu() {
  try {
    if (git(['rev-parse', '--is-shallow-repository']).trim() === 'true') return false;
    return git(['rev-list', '--count', 'HEAD']).trim() > 1;
  } catch { return false; }
}

// Ngay commit gan nhat lam DOI noi dung file, khong tinh commit ky thuat.
function ngayDoiNoiDung(rel) {
  let log;
  try {
    log = git(['log', '-40', '--format=%H%x09%ad', '--date=short', '--', rel])
      .trim().split('\n').filter(Boolean).map((x) => x.split('\t'));
  } catch { return null; }
  if (!log.length) return null; // file chua vao git (bai vua dang) — de nguyen lastmod
  const bamTai = (sha) => { try { return vanTay(git(['show', sha + ':' + rel])); } catch { return null; } };
  const hienTai = bamTai(log[0][0]);
  if (!hienTai) return null;

  // Ban tren dia khac ban da commit => noi dung vua doi, chua commit. Ngay dung la
  // HOM NAY chu khong phai ngay commit cu. Thieu nhanh nay thi luong dang bai tu dong
  // se bi --sua HA NGUOC lastmod cua /blog/ va /blog-en/: hai trang do vua duoc chen
  // the card cua bai moi nhung thay doi con nam trong cay lam viec.
  const tren_dia = vanTay(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  if (tren_dia !== hienTai) return HOM_NAY;

  for (let i = 1; i < log.length; i++) {
    if (bamTai(log[i][0]) !== hienTai) return log[i - 1][1];
  }
  return log[log.length - 1][1]; // khong doi trong 40 commit gan nhat
}

// ---------- doc sitemap va site ----------

if (!fs.existsSync(F_SITEMAP)) {
  console.error('LOI: khong thay sitemap.xml');
  process.exit(1);
}
const xmlGoc = fs.readFileSync(F_SITEMAP, 'utf8');
const mucSitemap = [...xmlGoc.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
  const khoi = m[1];
  return {
    loc: (khoi.match(/<loc>([^<]+)<\/loc>/) || [, ''])[1].trim(),
    lastmod: (khoi.match(/<lastmod>([^<]+)<\/lastmod>/) || [, null])[1],
  };
});

const files = duyet(ROOT);
const trang = new Map(); // url khong dau gach cuoi -> thong tin
for (const rel of files) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  trang.set(boGach(urlCuaFile(rel)), { rel, ...docTrang(html) });
}

const trongSitemap = new Set(mucSitemap.map((m) => boGach(m.loc)));

// ---------- lop 1: moi <loc> la URL chuan dang song ----------

const daGap = new Set();
for (const m of mucSitemap) {
  const k = boGach(m.loc);
  if (daGap.has(k)) bao(loi, 'loc trung lap trong sitemap', m.loc);
  daGap.add(k);

  if (!m.loc.startsWith(SITE)) { bao(loi, 'loc khong thuoc ten mien chinh', m.loc); continue; }

  const t = trang.get(k);
  if (!t) { bao(loi, 'loc tro toi trang khong ton tai (se la 404)', `${m.loc}  ->  ${fileCuaUrl(m.loc)}`); continue; }
  if (t.noindex) bao(loi, 'sitemap chua trang noindex', `${m.loc}  (robots: ${t.robots})`);
  if (t.chuyenHuong) bao(loi, 'sitemap chua trang chuyen huong', `${m.loc}  ->  ${t.chuyenHuong}`);
  if (!t.canon) bao(loi, 'trang trong sitemap khong khai canonical', m.loc);
  else if (boGach(t.canon) !== k) bao(loi, 'trang trong sitemap khong tu-canonical', `${m.loc}  canonical=${t.canon}`);

  if (!m.lastmod) bao(canhBao, 'muc sitemap thieu lastmod', m.loc);
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(m.lastmod)) bao(loi, 'lastmod sai dinh dang W3C', `${m.loc}  ${m.lastmod}`);
  else if (m.lastmod > HOM_NAY) bao(loi, 'lastmod o tuong lai', `${m.loc}  ${m.lastmod}`);
}

if (mucSitemap.length > 50000) bao(loi, 'sitemap vuot 50.000 URL, phai tach file', String(mucSitemap.length));
if (Buffer.byteLength(xmlGoc) > 50 * 1024 * 1024) bao(loi, 'sitemap vuot 50MB chua nen', String(Buffer.byteLength(xmlGoc)));

const robotsTxt = path.join(ROOT, 'robots.txt');
if (fs.existsSync(robotsTxt) && !fs.readFileSync(robotsTxt, 'utf8').includes('sitemap.xml')) {
  bao(canhBao, 'robots.txt khong khai dong Sitemap:', 'robots.txt');
}

// ---------- lop 2: trang mo coi, canonical va hreflang ----------

for (const [url, t] of trang) {
  const urlDay = urlCuaFile(t.rel);   // giu dau gach cuoi de dan thang vao GSC URL Inspection
  if (t.noindex || t.chuyenHuong) continue;         // co y khong index / stub chuyen huong
  if (!t.canon) { bao(loi, 'trang duoc phep index nhung khong khai canonical', urlDay); continue; }
  const dich = boGach(t.canon);

  if (dich !== url) {
    // Canonical tro sang trang khac — co y gop bai. Chi can dich con song va duoc index.
    const d = trang.get(dich);
    if (!d) bao(loi, 'canonical tro toi trang khong ton tai', `${urlDay}  ->  ${t.canon}`);
    else if (d.noindex) bao(loi, 'canonical tro toi trang noindex', `${urlDay}  ->  ${t.canon}`);
    else if (d.canon && boGach(d.canon) !== dich) bao(loi, 'canonical noi chuoi (A->B->C)', `${urlDay}  ->  ${t.canon}  ->  ${d.canon}`);
    else if (!trongSitemap.has(dich)) bao(canhBao, 'canonical tro toi trang vang mat trong sitemap', `${urlDay}  ->  ${t.canon}`);
    continue;
  }

  if (!trongSitemap.has(url)) bao(loi, 'trang tu-canonical, duoc phep index nhung vang mat trong sitemap', urlDay);

  for (const [lang, href] of t.hreflang) {
    const h = boGach(href);
    if (!trang.has(h)) { bao(loi, 'hreflang tro toi trang khong ton tai', `${urlDay}  ${lang}  ->  ${href}`); continue; }
    if (h === url) continue;
    if (!trang.get(h).hreflang.some(([, hr]) => boGach(hr) === url)) {
      bao(loi, 'hreflang khong tro nguoc lai', `${urlDay}  ${lang}  ->  ${href}`);
    }
  }
  if (t.hreflang.length && !t.hreflang.some(([l]) => l === 'x-default')) {
    bao(canhBao, 'cum hreflang thieu x-default', urlDay);
  }
}

// ---------- lop 3: lastmod dung thuc te ----------

const lechLastmod = [];
const daySu = coLichSuDayDu();
if (!daySu) {
  console.log('! Bo qua lop kiem lastmod: repo khong co lich su git day du (checkout nong).');
} else {
  for (const m of mucSitemap) {
    const rel = trang.get(boGach(m.loc))?.rel;
    if (!rel || !m.lastmod) continue;
    const that = ngayDoiNoiDung(rel);
    if (!that || that === m.lastmod) continue;
    lechLastmod.push({ loc: m.loc, ghi: m.lastmod, that });
    // Voi --sua thi lech duoc va ngay ben duoi nen chi la thong tin, khong phai loi.
    bao(SUA ? canhBao : loi,
      that > m.lastmod ? 'lastmod cu hon lan doi noi dung that' : 'lastmod moi hon lan doi noi dung that',
      `${m.loc}  sitemap=${m.lastmod}  that=${that}`);
  }
}

// ---------- sua ----------

if (SUA && lechLastmod.length) {
  let xml = xmlGoc;
  for (const x of lechLastmod) {
    const re = new RegExp(`(<loc>${x.loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>\\s*<lastmod>)[^<]*(</lastmod>)`);
    if (!re.test(xml)) { bao(loi, 'khong tim thay khoi de sua lastmod', x.loc); continue; }
    xml = xml.replace(re, `$1${x.that}$2`);
  }
  fs.writeFileSync(F_SITEMAP, xml);
  console.log(`\nDa ghi lai lastmod cho ${lechLastmod.length} URL trong sitemap.xml`);
} else if (SUA) {
  console.log('\nKhong co lastmod nao lech — sitemap.xml giu nguyen.');
}

// ---------- ket qua ----------

const nhom = (ds) => {
  const g = new Map();
  for (const x of ds) { if (!g.has(x.muc)) g.set(x.muc, []); g.get(x.muc).push(x.chiTiet); }
  return g;
};
for (const [ten, ds] of [['LOI', loi], ['CANH BAO', canhBao]]) {
  if (!ds.length) continue;
  console.log(`\n==== ${ten}: ${ds.length} ====`);
  for (const [muc, ct] of nhom(ds)) {
    console.log(`\n  ${muc}  (${ct.length})`);
    ct.slice(0, 25).forEach((x) => console.log('    ' + x));
    if (ct.length > 25) console.log(`    ... con ${ct.length - 25} muc nua`);
  }
}

console.log('\n==== TONG KET ====');
console.log(`sitemap.xml: ${mucSitemap.length} URL | HTML cua site: ${files.length} file`);
console.log(`Trang tu-canonical duoc index: ${[...trang.values()].filter((t) => !t.noindex && !t.chuyenHuong && t.canon && boGach(t.canon) === boGach(urlCuaFile(t.rel))).length}`);
console.log(`Trang canonical sang trang khac (gop bai, co y): ${[...trang.values()].filter((t) => !t.noindex && !t.chuyenHuong && t.canon && boGach(t.canon) !== boGach(urlCuaFile(t.rel))).length}`);
console.log(`Stub chuyen huong: ${[...trang.values()].filter((t) => t.chuyenHuong).length} | noindex: ${[...trang.values()].filter((t) => t.noindex).length}`);
console.log(`\nLOI: ${loi.length}   CANH BAO: ${canhBao.length}`);
if (!SUA && lechLastmod.length) {
  console.log(`\n-> ${lechLastmod.length} URL co lastmod khong khop lan doi noi dung that.`);
  console.log('   SUA BANG MOT LENH:  node tools/kiem-sitemap.mjs --sua');
  console.log('   roi commit sitemap.xml va push. Lan chay sau se xanh.');
  console.log('   Vi sao chan cung: de lech lau ngay thi Google coi lastmod cua CA SITE');
  console.log('   la khong dang tin va bo qua het, ke ca cho trang that su vua doi.');
}

if (fJson) fs.writeFileSync(fJson, JSON.stringify({ loi, canhBao, lechLastmod }, null, 2));
process.exit(loi.length ? 1 : 0);
