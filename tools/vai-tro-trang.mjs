#!/usr/bin/env node
/**
 * VAI TRO TRANG — kiem chuoi "Keyword Intelligence" cua xomleo.vn ma KHONG can file GSC (29-10-2026):
 *   Cum truy van (tools/cum-chu-de.json) -> y dinh (bac DLN cua nguoi tim) -> trang dich (URL + data-dln)
 *   -> CTA that tren trang -> KPI.
 * Y tu bai "SEO Master: khach hang la trong tam, tu khoa la cong cu" (Danh Nolan): moi tu khoa phai dat trong
 * mot cau truc co nghia, va "cung mot thuc the co the co nhieu cach tim, nhung khong phai bien the nao cung can
 * mot URL rieng" -> he thong phai nhan ra vai tro tung trang va su chong lan.
 *
 * Bao 5 thu:
 *   1. Trang trong sitemap chua co cum nao tro toi (trang khong co nhiem vu tim kiem) — tru 'trangKhongCum'.
 *   2. Cum tro toi trang chua co tren main (bai dang trong hang doi, hoac sai URL).
 *   3. Bac y dinh cua cum ('bac') lech bac cua trang dich (<html data-dln>): vd nguoi tim dang SO SANH (C)
 *      ma trang dich la trang HANH DONG (A) -> trang co the dung dau nhung khong tra loi cau nguoi ta hoi.
 *   4. Cum khai 'cta' ma <main> cua trang dich khong co link tuong ung (dat-ban / goi / chi-duong / menu).
 *   5. Hai trang co tieu de / H1 trung >= 5 chu lien tiep (bo ten quan, nam) — dau hieu hai URL cung mot y dinh.
 *
 * Chay:  node tools/vai-tro-trang.mjs            (in bao cao, luon thoat 0 — day la cong cu doc, khong chan CI)
 *        node tools/vai-tro-trang.mjs --json     (in JSON)
 * tools/dang-bai-theo-lich.mjs dung lai chuoiTieuDe/timChongLan/cumCuaTrang de canh bao luc dang bai moi.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const boDau = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
const boThe = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const CHU_BAC = { '1-orient': 'O', '2-choose': 'C', '3-prove': 'P', '4-rate': 'R', '5-act': 'A' };
const TEN_BAC = { O: 'O · Định hướng', C: 'C · Chọn', P: 'P · Kiểm chứng', R: 'R · Chi phí', A: 'A · Hành động' };

export function docQuyTac(root = ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, 'tools/cum-chu-de.json'), 'utf8'));
}

// Trang tieng Viet trong sitemap (ban dich di theo ban Viet nen khong xet rieng)
export function trangSitemap(root = ROOT) {
  const sm = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const urls = [...sm.matchAll(/<loc>https:\/\/xomleo\.vn([^<]*)<\/loc>/g)].map((m) => m[1])
    .filter((u) => !/-en\/$|^\/en\/|^\/(zh|ko|ja|ru|th)\//.test(u));
  return urls.map((url) => docTrang(url, root)).filter(Boolean);
}
export function docTrang(url, root = ROOT) {
  const file = path.join(root, url.replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(file)) return null;
  const h = fs.readFileSync(file, 'utf8');
  const dln = (h.slice(0, 4000).match(/<html\b[^>]*\sdata-dln="([^"]+)"/) || [])[1] || null;
  const i = h.indexOf('<main'), j = h.indexOf('</main>');
  return {
    url, dln, bac: CHU_BAC[dln] || null,
    title: boThe((h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''),
    // Chi lay the <h1 that (co thuoc tinh hoac dong ngay) — tranh chu "<h1>" trong ghi chu CSS/HTML
    h1: boThe((h.match(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/) || [])[1] || ''),
    main: i >= 0 && j > i ? h.slice(i, j) : h,
  };
}

// ---------- Chong lan tieu de ----------
// Bo ten quan + nam + dau cau: "Quán Nướng View Đẹp Đà Lạt 2026 | Xóm Lèo BBQ" -> [quan, nuong, view, dep, da, lat, bbq]
const TEN_QUAN = /tiem nuong (& |va |and )?chill( xom leo)?|xom leo|xomleo|grill (& |and )?chill/g;
export function chuoiTieuDe(s) {
  return boDau(s).replace(TEN_QUAN, ' ').replace(/\b20\d\d\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
}
// Doan chu lien tiep dai nhat chung cua hai day tu, CO it nhat mot dau nam o dau day (chu thu nhat).
// Dau tieu de la cho dat tu khoa chinh: "Quán Nướng View Đẹp Đà Lạt 2026" (trang chu) bi "Trải Nghiệm Quán
// Nướng View Đẹp Đà Lạt" (/about/) lap lai -> hai trang cung nham mot y dinh. Con hai bai khac dia diem dung
// chung mot cum mo ta o giua ("... Đà Lạt – Góc sống ảo ...") thi khong tinh — thu 29-10-2026 bat nham Cổng Trời
// Bali ~ Ga xe lửa khi chua co dieu kien nay.
export function doanChung(a, b) {
  let best = 0, end = 0; const dp = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = b.length; j >= 1; j--) {
      dp[j] = a[i - 1] === b[j - 1] ? dp[j - 1] + 1 : 0;
      if (dp[j] > best && (i - dp[j] === 0 || j - dp[j] === 0)) { best = dp[j]; end = i; }
    }
  }
  return a.slice(end - best, end);
}
export const NGUONG_CHONG = 5;
// So tieu de/H1 cua mot trang (moi hoac co san) voi cac trang khac; tra ve trang trung >= NGUONG_CHONG chu
export function timChongLan(cau, dsTrang, boQuaUrl = null) {
  const cua = cau.filter(Boolean).map(chuoiTieuDe);
  const kq = [];
  for (const t of dsTrang) {
    if (t.url === boQuaUrl) continue;
    let chung = [];
    for (const a of cua) for (const b of [t.title, t.h1].filter(Boolean).map(chuoiTieuDe)) {
      const d = doanChung(a, b); if (d.length > chung.length) chung = d;
    }
    if (chung.length >= NGUONG_CHONG) kq.push({ url: t.url, chung: chung.join(' ') });
  }
  return kq;
}

// ---------- Cum <-> trang ----------
export function cumCuaTrang(url, quyTac) { return quyTac.cum.filter((c) => c.dich === url); }

const CTA = {
  'dat-ban': /href="[^"]*#booking"/,
  goi: /href="tel:/,
  'chi-duong': /href="[^"]*(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|\/duong-di\/)/,
  menu: /href="(https:\/\/xomleo\.vn)?\/menu\/(#[^"]*)?"/,
};
const TEN_CTA = { 'dat-ban': 'đặt bàn (#booking)', goi: 'gọi (tel:)', 'chi-duong': 'chỉ đường', menu: 'xem menu' };

export function kiemVaiTro(root = ROOT) {
  const quyTac = docQuyTac(root);
  const ds = trangSitemap(root);
  const theoUrl = new Map(ds.map((t) => [t.url, t]));
  const boQua = quyTac.trangKhongCum || {};

  const khongCum = ds.filter((t) => !cumCuaTrang(t.url, quyTac).length && !boQua[t.url]).map((t) => ({ url: t.url, bac: t.bac, title: t.title }));
  const dichMat = [], lechBac = [], thieuCta = [];
  for (const c of quyTac.cum) {
    if (!c.dich) continue;
    const t = theoUrl.get(c.dich) || docTrang(c.dich, root);
    if (!t) { dichMat.push({ key: c.key, ten: c.ten, dich: c.dich }); continue; }
    if (c.bac && t.bac && c.bac !== t.bac) lechBac.push({ key: c.key, ten: c.ten, dich: c.dich, bacYDinh: c.bac, bacTrang: t.bac });
    const thieu = (c.cta || []).filter((k) => CTA[k] && !CTA[k].test(t.main));
    if (thieu.length) thieuCta.push({ key: c.key, ten: c.ten, dich: c.dich, thieu });
  }
  const chongLan = [];
  for (let i = 0; i < ds.length; i++) {
    for (const k of timChongLan([ds[i].title, ds[i].h1], ds.slice(i + 1))) chongLan.push({ a: ds[i].url, b: k.url, chung: k.chung });
  }
  return { soTrang: ds.length, soCum: quyTac.cum.length, khongCum, dichMat, lechBac, thieuCta, chongLan };
}

// ---------- Chay tu dong lenh ----------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const kq = kiemVaiTro();
  if (process.argv.includes('--json')) { console.log(JSON.stringify(kq, null, 1)); process.exit(0); }
  console.log(`Vai tro trang: ${kq.soTrang} trang tieng Viet trong sitemap, ${kq.soCum} cum truy van\n`);
  const muc = (ten, ds, dong) => { console.log(`${ten}: ${ds.length}`); ds.forEach((x) => console.log('  - ' + dong(x))); console.log(''); };
  muc('1. Trang chua co cum truy van nao (them cum vao tools/cum-chu-de.json, hoac khai ly do o "trangKhongCum")', kq.khongCum, (x) => `${x.url} [${x.bac || '?'}] ${x.title}`);
  muc('2. Cum tro toi trang chua co tren main', kq.dichMat, (x) => `${x.key} -> ${x.dich} (bai trong hang doi? sai URL?)`);
  muc('3. Bac y dinh cua nguoi tim lech bac trang dich', kq.lechBac, (x) => `${x.key}: nguoi tim ${TEN_BAC[x.bacYDinh]} — trang ${x.dich} la ${TEN_BAC[x.bacTrang]}`);
  muc('4. Trang dich thieu CTA da khai trong <main>', kq.thieuCta, (x) => `${x.key} -> ${x.dich}: thieu ${x.thieu.map((k) => TEN_CTA[k]).join(', ')}`);
  muc(`5. Hai trang trung >= ${NGUONG_CHONG} chu lien tiep trong title/H1`, kq.chongLan, (x) => `${x.a}  ~  ${x.b}  : "${x.chung}"`);
}
