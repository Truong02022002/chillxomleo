// Sao danh gia bai viet (27-10-2026): khoi bam sao cuoi moi bai + diem ban doc + schema sao.
//
// Chay:  node tools/sao-bai.mjs            kiem: moi bai co dung MOT khoi sao, so tren trang va schema
//                                          khop tools/sao/diem.json (thoat 1 neu lech)
//        node tools/sao-bai.mjs --keo      keo tong phieu tu Apps Script (tools/sao/Code.gs) ve diem.json
//        node tools/sao-bai.mjs --write    chen khoi con thieu (ban Viet/Anh), ghi so + schema vao moi bai
//
// Vi sao co: chu site muon sao vang tren ket qua Google nhu cac trang dich vu SEO (plugin kieu kk Star
// Ratings). Diem o day la phieu THAT cua ban doc tren chinh bai do — khong lay diem Google Maps, khong
// tu dien so. Bai co tu NGUONG phieu tro len moi hien diem tren trang va moi khai schema; duoi nguong
// thi trang khong co so nao de Google doc.
//
// Rui ro chu site da duoc bao (27-10-2026): Google khong hien sao cho Article, nen khoi schema la
// CreativeWorkSeries — cung loai voi sao trang chu (b3b137d0) va cac trang dich vu SEO, tuc la gan loai
// cho vua. Neu Search Console bao manual action "structured data": dat NGUONG = Infinity roi chay
// --write (go het schema, van giu nut bam), hoac git revert.
//
// Moi thu tieng cua mot bai chung MOT tong (data-sao = duong dan ban Viet): ban zh/ko/ja/ru/th sinh tu
// ban Viet (tools/dich/dung.mjs) nen khong the mang so rieng. Khoi trong ban Viet/Anh do script nay
// chen; trang dich nhan khoi qua dung.mjs, script nay chi ghi so + schema.
//
// Ca khoi <section class="sao-bai"> bi bo khoi van tay noi dung cua kiem-sitemap.mjs va indexnow.mjs:
// co phieu moi khong phai bai doi noi dung, khong duoc nang lastmod hay bao Bing crawl lai.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHU, khoiSao } from './sao/khoi.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const F_DIEM = path.join(ROOT, 'tools', 'sao', 'diem.json');
const NGUONG = 5;
const BO_QUA = new Set(['.git', '.github', '.claude', 'skills', 'tools', 'hang-doi', 'img', 'css', 'js', 'fonts', 'uploads', 'node_modules']);
// Dau thap phan theo thu tieng. Trang dich nhan "4,7" cua ban Viet qua dung.mjs; --write sua lai.
const PHAY = new Set(['vi', 'ru']);

const args = process.argv.slice(2);
const GHI = args.includes('--write');
const KEO = args.includes('--keo');

const loi = [], canhBao = [];

// ---------- tien ich ----------

const thuocTinh = (the, ten) => (the.match(new RegExp(`\\s${ten}\\s*=\\s*"([^"]*)"`, 'i')) || [])[1];
const RE_LD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

function nutLd(json) {
  let o;
  try { o = JSON.parse(json); } catch { return []; }
  const ds = [];
  (function di(x) {
    if (Array.isArray(x)) return x.forEach(di);
    if (!x || typeof x !== 'object') return;
    if (x['@type']) ds.push(x);
    if (x['@graph']) di(x['@graph']);
  })(o);
  return ds;
}
const laLoai = (n, t) => [].concat(n['@type']).includes(t);

// diem.json = { nguon: URL web app Apps Script ("" = chua trien khai), capNhat, trang: { "/duong-dan/": { n, tb } } }.
// "nguon" la noi DUY NHAT giu dia chi Apps Script: --write chep no vao data-sao-url cua tung khoi, js/main.js
// doc tu do. Chu site dan URL vao day (sua tren GitHub cung duoc), lan chay sao-bai.yml ke tiep tu ap dung.
function docDiem() {
  if (!fs.existsSync(F_DIEM)) return { nguon: '', trang: {} };
  return JSON.parse(fs.readFileSync(F_DIEM, 'utf8'));
}

function hopLe(trang) {
  if (!trang || typeof trang !== 'object' || Array.isArray(trang)) return 'thieu "trang"';
  for (const [k, v] of Object.entries(trang)) {
    if (!/^\/[a-z0-9]+(-[a-z0-9]+)*\/$/.test(k)) return `duong dan la "${k}"`;
    if (!v || !Number.isInteger(v.n) || v.n < 1) return `${k}: n "${v && v.n}"`;
    if (typeof v.tb !== 'number' || v.tb < 1 || v.tb > 5) return `${k}: tb "${v && v.tb}"`;
  }
  return null;
}

// ---------- keo ----------

if (KEO) {
  const cu = docDiem();
  if (!cu.nguon) {
    console.log('"nguon" trong tools/sao/diem.json con trong (chua trien khai Apps Script) — khong keo.');
  } else {
    const res = await fetch(cu.nguon);
    const j = await res.json().catch(() => null);
    const sai = res.ok ? hopLe(j && j.trang) : `HTTP ${res.status}`;
    if (sai) { console.error(`Apps Script tra du lieu khong hop le (${sai}) — giu nguyen diem.json.`); process.exit(1); }
    // Sheet bi xoa / doi SHEET_ID thi doGet tra rong: dung xoa sach diem cua ca site vi mot loi cai dat.
    if (!Object.keys(j.trang).length && Object.keys(cu.trang).length) {
      console.error('Apps Script tra 0 bai trong khi diem.json dang co diem — nghi Sheet loi, giu nguyen diem.json.');
      process.exit(1);
    }
    const moi = Object.fromEntries(Object.keys(j.trang).sort().map((k) => [k, { n: j.trang[k].n, tb: j.trang[k].tb }]));
    if (JSON.stringify(moi) === JSON.stringify(cu.trang)) console.log(`Keo xong: ${Object.keys(moi).length} bai co phieu, khong doi.`);
    else {
      fs.writeFileSync(F_DIEM, JSON.stringify({ nguon: cu.nguon, capNhat: new Date().toISOString().slice(0, 10), trang: moi }, null, 2) + '\n');
      console.log(`Keo xong: ${Object.keys(moi).length} bai co phieu, da ghi tools/sao/diem.json.`);
    }
  }
}

// ---------- trang bai ----------

function dsTrangBai() {
  const ds = [];
  const di = (thuMuc, sau) => {
    for (const e of fs.readdirSync(thuMuc, { withFileTypes: true })) {
      if (!e.isDirectory() || BO_QUA.has(e.name) || e.name.startsWith('.')) continue;
      const p = path.join(thuMuc, e.name);
      const f = path.join(p, 'index.html');
      if (fs.existsSync(f)) {
        const html = fs.readFileSync(f, 'utf8');
        const laBai = [...html.matchAll(RE_LD)].some((m) => nutLd(m[1]).some((n) => laLoai(n, 'Article')));
        if (laBai && !/http-equiv="refresh"/i.test(html)) ds.push({ f, rel: path.relative(ROOT, f).split(path.sep).join('/'), html });
      }
      if (sau) di(p, false); // trang dich: /zh/<slug>/
    }
  };
  di(ROOT, true);
  return ds;
}

// Tra ve html moi, hoac { thieu } neu trang dich chua co khoi (cho dung.mjs).
function apDung(html, rel, diem) {
  const lang = ((html.match(/<html\b[^>]*\blang="([^"]+)"/) || [])[1] || '').slice(0, 2);
  const links = html.match(/<link\b[^>]*>/gi) || [];
  const canonical = links.map((t) => (thuocTinh(t, 'rel') === 'canonical' ? thuocTinh(t, 'href') : null)).find(Boolean);
  const hrefVi = links.map((t) => (thuocTinh(t, 'hreflang') === 'vi' ? thuocTinh(t, 'href') : null)).find(Boolean);
  const nguon = lang === 'vi' ? canonical : hrefVi;
  if (!canonical || !nguon) { loi.push(`${rel}: thieu canonical hoac hreflang="vi"`); return html; }
  const key = new URL(nguon).pathname;
  const v = diem.trang[key];
  const du = !!v && v.n >= NGUONG;
  const nl = html.includes('\r\n') ? '\r\n' : '\n';

  let so = (html.match(/<section class="sao-bai"/g) || []).length;
  if (so > 1) { loi.push(`${rel}: co ${so} khoi sao`); return html; }
  if (!so) {
    if (!CHU[lang]) return { thieu: true };
    // Truoc khoi "Nguon tham khao" (cuoi than bai); bai khong co thi truoc "Bai viet lien quan",
    // khong nua thi ngay truoc </article>.
    const asides = [...html.matchAll(/<aside\b[^>]*aria-label="([^"]*)"/g)];
    const neo = asides.find((m) => /^(Nguồn tham khảo|References|Sources)/i.test(m[1]))
      || asides.find((m) => /^(Bài viết liên quan|Related)/i.test(m[1]));
    let viTri = neo ? neo.index : html.lastIndexOf('</article>');
    if (viTri < 0) { loi.push(`${rel}: khong tim duoc cho chen khoi sao`); return html; }
    // Chen o dau dong (truoc khoang thut le) de the phia sau giu nguyen thut le.
    const dauDong = html.lastIndexOf('\n', viTri - 1) + 1;
    if (/^[ \t]*$/.test(html.slice(dauDong, viTri))) viTri = dauDong;
    html = html.slice(0, viTri) + khoiSao(lang, key).replace(/\n/g, nl) + nl + html.slice(viTri);
  }

  const tb = du ? v.tb.toFixed(1) : '';
  html = html
    .replace(/<section class="sao-bai"[^>]*>/, `<section class="sao-bai" data-sao="${key}"${diem.nguon ? ` data-sao-url="${diem.nguon}"` : ''}${du ? '' : ' hidden'}>`)
    .replace(/<p class="sao-bai-tong"[^>]*>/, `<p class="sao-bai-tong"${du ? '' : ' hidden'}>`)
    .replace(/(<span translate="no" data-sao-diem>)[^<]*(<\/span>)/, `$1${PHAY.has(lang) ? tb.replace('.', ',') : tb}$2`)
    .replace(/(<span translate="no" data-sao-luot>)[^<]*(<\/span>)/, `$1${du ? v.n : ''}$2`);

  // Schema: go khoi #danh-gia cu (neu co), du phieu thi chen lai ngay sau khoi Article.
  html = html.replace(/(\r?\n)?<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, _, json) =>
    (nutLd(json).some((n) => laLoai(n, 'CreativeWorkSeries') && /#danh-gia$/.test(n['@id'] || '')) ? '' : m));
  if (du) {
    const khoiArticle = [...html.matchAll(RE_LD)].find((m) => nutLd(m[1]).some((n) => laLoai(n, 'Article')));
    const headline = nutLd(khoiArticle[1]).find((n) => laLoai(n, 'Article')).headline;
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWorkSeries',
      '@id': `${canonical}#danh-gia`,
      name: headline,
      url: canonical,
      aggregateRating: { '@type': 'AggregateRating', ratingValue: tb, bestRating: '5', worstRating: '1', ratingCount: String(v.n) },
    };
    const cuoi = khoiArticle.index + khoiArticle[0].length;
    html = html.slice(0, cuoi) + nl + `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>`.replace(/\n/g, nl) + html.slice(cuoi);
  }
  return html;
}

// ---------- chay ----------

const diem = docDiem();
{
  const sai = hopLe(diem.trang)
    || (diem.nguon && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(diem.nguon) ? `"nguon" phai la URL web app dang https://script.google.com/macros/s/…/exec` : null);
  if (sai) { console.error(`tools/sao/diem.json khong hop le: ${sai}`); process.exit(1); }
}
const bai = dsTrangBai();
const keyBai = new Set();
let chen = 0, sua = 0, thieu = 0;
for (const t of bai) {
  const coKhoi = t.html.includes('<section class="sao-bai"');
  const moi = apDung(t.html, t.rel, diem);
  if (typeof moi === 'object') { thieu++; canhBao.push(`${t.rel}: trang dich chua co khoi sao — chay tools/dich/dung.mjs`); continue; }
  const m = moi.match(/<section class="sao-bai" data-sao="([^"]+)"/);
  if (m) keyBai.add(m[1]);
  if (moi === t.html) continue;
  if (!coKhoi) chen++; else sua++;
  if (GHI) fs.writeFileSync(t.f, moi);
  else loi.push(`${t.rel}: ${coKhoi ? 'so / schema sao lech tools/sao/diem.json' : 'chua co khoi sao'}`);
}
for (const k of Object.keys(diem.trang)) if (!keyBai.has(k)) canhBao.push(`diem.json co ${k} nhung khong bai nao mang data-sao do`);

const du = Object.values(diem.trang).filter((v) => v.n >= NGUONG).length;
console.log(`${bai.length} trang bai, ${Object.keys(diem.trang).length} bai co phieu, ${du} bai du ${NGUONG} phieu (hien diem + schema).`);
if (GHI) console.log(`Da chen ${chen} khoi, sua ${sua} trang.`);
canhBao.forEach((x) => console.log('CANH_BAO ' + x));
loi.forEach((x) => console.log('LOI ' + x));
if (loi.length) {
  if (!GHI) console.log('Sua: node tools/sao-bai.mjs --write');
  process.exit(1);
}
