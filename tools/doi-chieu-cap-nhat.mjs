#!/usr/bin/env node
/**
 * DOI CHIEU CAP NHAT GOOGLE cho xomleo.vn — so so lieu Search Console MOT TUAN TRUOC khi Google tung mot dot
 * cap nhat xep hang (core / spam) voi MOT TUAN SAU khi dot do chay xong, dung cach Google huong dan
 * (developers.google.com/search/updates/core-updates, doc lai 11-11-2026):
 *   "We recommend waiting at least a full week after a core update completes before analyzing your site in
 *    Search Console." / "After a week, try comparing this week with a week before the core update started
 *    rolling out" / tut nhe (vi du 2 -> 4): "There's no need to take drastic action" — tranh sua noi dung dang
 *    chay tot / tut manh (vi du 4 -> 29): "Do a deeper assessment."
 *
 * Bao cao tra loi bon cau, theo thu tu nen doc:
 *   1. Khoang ngay co dung luat khong: ky truoc ket thuc truoc ngay bat dau, ky sau bat dau sau ngay xong va du
 *      mot tuan, moi ky du 7 ngay, hai file cung bo loc (loai tim kiem). Sai luat thi dung lai, tru khi
 *      --cho-phep-som (bao cao ghi "xem som — chua ket luan duoc").
 *   2. Tong luot nhap / hien thi doi bao nhieu so voi BIEN DAO DONG THUONG NGAY cua chinh site (tinh tu --ca-ky:
 *      cac cap tuan lien nhau khong dinh dot cap nhat, ngay le, tuan site sua nhieu trang). Bien do tu it cap tuan
 *      nen chi la uoc luong tho.
 *   3. HANG doi bao nhieu, tach khoi NHU CAU: vi tri tinh tren "ro co dinh" — cac truy van co o ca hai ky, trong
 *      so = hien thi ky truoc. Ro nay it bi mua vu lam xe dich hon tong, nhung khong giu co cau thiet bi / quoc
 *      gia ben trong tung truy van (bao cao ghi chu khi ti le dien thoai doi nhieu). Truy van mat han (ky truoc
 *      du nguong, ky sau khong con dong nao) dem rieng. Bang truy van khong co truy van an danh: bao cao ghi ro
 *      ro co dinh phu bao nhieu phan TONG hien thi.
 *   4. NHOM nao doi: cum chu de (tools/cum-chu-de.json, bo cum nhieu), ten quan / khong ten quan, ngon ngu trang
 *      (VI/EN/zh/ko/ja/ru/th), bac DLN, trang theo lan site tu sua (doi chung sach), quoc gia, thiet bi, 5 gia
 *      thuyet ghi truoc (do-luong.md muc 13) — roi moi toi tung truy van, tung trang.
 * Trang ma CHINH SITE vua sua duoc danh dau rieng: ngay doi noi dung lay tu lastmod trong lich su git cua
 * sitemap.xml (chi ban da commit — thay doi chua push thi Google chua thay; tools/kiem-sitemap.mjs giu lastmod =
 * ngay noi dung doi that, bo qua commit ky thuat; CI chan khi lech), ngay diem sao bat len (du 5 phieu) lay tu
 * lich su tools/sao/diem.json. Doc lui them 3 tuan (LUI_TRUOC_KY) truoc ky truoc: Google can vai ngay toi vai tuan de thu thap
 * lai, nen thay doi ngay truoc ky truoc van con ngam vao luc so sanh. Tut trung luc minh sua thi kiem thay doi
 * cua minh truoc khi do cho Google — thang 8-2026 tuan Google tung spam update cung la tuan site gop 19 trang
 * vao 5, nen khong con cach nao biet vi sao tut.
 *
 * Cach dung (quy trinh day du: tools/do-luong.md muc 13):
 *   node tools/doi-chieu-cap-nhat.mjs --dot 2026-11-core --truoc <export tuan truoc> --sau <export tuan sau>
 *        [--ca-ky <export 6 thang qua>] [--nguong 10] [--ra <thu muc ngoai repo>] [--cho-phep-som]
 *   node tools/doi-chieu-cap-nhat.mjs --dot 2026-08-spam --ca-ky <export co san phu dot do>   (chi tong theo ngay)
 *   --dot: key trong tools/dot-cap-nhat-google.json. Dot chua ghi vao file: --bat-dau YYYY-MM-DD [--xong YYYY-MM-DD].
 *   --xong YYYY-MM-DD di cung --dot: ghi de ngay xong (dashboard vua bao xong ma chua kip sua file json).
 *   --nguong: so hien thi toi thieu / 7 ngay O KY TRUOC de xep loai mot truy van, mot trang theo vi tri (mac dinh
 *     10: mot tuan cua site chi ~25 truy van dat muc nay, phu ~2/3 hien thi co truy van — xem do-luong.md muc 13).
 *   --hom-nay YYYY-MM-DD: ngay dung de kiem so lieu con moi (mac dinh: hom nay theo UTC) — de chay thu.
 * Export: Search Console -> Hieu suat -> Ket qua tim kiem -> Ngay -> Tuy chinh -> Xuat -> Tai CSV (.zip).
 * Moi ky MOT file 7 ngay (khong dung che do "So sanh" cua GSC), cung mot ngon ngu giao dien. Bao cao .html + .json
 * ghi canh file --sau (hoac --ca-ky), KHONG ghi vao repo: repo nay la site GitHub Pages, file nam trong repo se
 * thanh trang cong khai (so sanh duong dan da chuan hoa: hoa/thuong, ten 8.3).
 */
import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { docNguon, timBang, docBangChiSo, boDau, bacCua, banEn, taoGanCum, trongRepo } from './ban-do-nhu-cau.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const thamSo = (ten) => { const i = process.argv.indexOf(ten); return i > 0 ? process.argv[i + 1] : null; };

// Bien dao dong tham khao khi khong co --ca-ky (hoac file khong du cap tuan sach): 1 do lech chuan cua muc doi
// tuan-sang-tuan, do 11-11-2026 bang chinh bienDaoDong tren export 16/6–15/9/2026: 4 cap tuan lien nhau khong
// dinh dot cap nhat hay ngay le (tuan site sua nhieu van dung — bo thi chi con 2 cap). Uoc luong THO: it cap, va
// doi theo mua (export 25/4–24/7 khong du cap sach; tinh ca tuan 30/4 thi ra ±61% / ±23% / ±0,6). Co --ca-ky
// 6 thang thi cong cu tu do lai tren so moi.
export const BIEN_THAM_KHAO = { c: 0.169, i: 0.123, p: 0.77, soCap: 4, nguon: 'đo trên export GSC 16/6–15/9/2026' };
export const SO_CAP_TOI_THIEU = 4;
// Tuan site doi noi dung tu chung nay trang tro len (lastmod sitemap) thi bo khoi phep do dao dong thuong.
const NGUONG_TUAN_TU_SUA = 50;
// tools/sao-bai.mjs: diem sao + schema hien len trang khi du NGUONG = 5 phieu.
const NGUONG_SAO = 5;
const MA_DICH = ['zh', 'ko', 'ja', 'ru', 'th'];
// Doc lui truoc ky truoc: Google thu thap lai mat "vai ngay toi vai tuan". 3 tuan bat duoc dot sua lon sat ky
// truoc (21-10, 26-10, 02-11 truoc ky 03–09/11) ma van de /menu/ (sua lan cuoi 07-10) vao nhom doi chung sach.
const LUI_TRUOC_KY = 21;

// ---------------- Ngay (chuoi YYYY-MM-DD, tinh theo UTC de khong lech mui gio) ----------------
const msNgay = (s) => Date.parse(s + 'T00:00:00Z');
export const congNgay = (s, n) => new Date(msNgay(s) + n * 864e5).toISOString().slice(0, 10);
export const soNgayGiua = (a, b) => Math.round((msNgay(b) - msNgay(a)) / 864e5);
// Ngay co that (2026-02-30, 2026-13-01 la sai), dung dinh dang YYYY-MM-DD
const laNgay = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = msNgay(s);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === s;
};
const chongNhau = (a1, a2, b1, b2) => !(a2 < b1 || b2 < a1);

// Ngay le / Tet: khach du lich Da Lat len xuong theo ngay nghi chu khong theo Google — bo khoi phep do dao
// dong thuong. Tet va Gio To theo am lich, ghi tay tung nam (lech mot ngay khong sao: bo ca tuan). Tet lay
// rong (8 ngay truoc mung 1 toi mung 8): khach di som, quan con nghi tu 23 thang Chap (Tet 2027).
const TET = { 2025: '2025-01-29', 2026: '2026-02-17', 2027: '2027-02-06', 2028: '2028-01-26' };
const GIO_TO = { 2025: '2025-04-07', 2026: '2026-04-26', 2027: '2027-04-16', 2028: '2028-04-04' };
export function ngayLe(nam) {
  const ds = [[`${nam}-01-01`, `${nam}-01-01`, 'Tết Dương lịch'], [`${nam}-04-30`, `${nam}-05-01`, '30/4 – 1/5'],
    [`${nam}-09-01`, `${nam}-09-02`, 'Quốc khánh 2/9'], [`${nam}-12-24`, `${nam}-12-25`, 'Giáng sinh'], [`${nam}-12-31`, `${nam}-12-31`, 'Giao thừa dương lịch']];
  if (TET[nam]) ds.push([congNgay(TET[nam], -8), congNgay(TET[nam], 7), 'Tết Nguyên đán']);
  if (GIO_TO[nam]) ds.push([GIO_TO[nam], GIO_TO[nam], 'Giỗ Tổ Hùng Vương']);
  return ds;
}

// ---------------- Doc mot file export ----------------
export function chuanTrang(u) {
  let k = String(u).replace(/^https?:\/\/(www\.)?xomleo\.vn/i, '').split('#')[0].split('?')[0] || '/';
  try { k = decodeURIComponent(k); } catch { /* URL da o dang thuong */ }
  if (!k.startsWith('/')) k = '/' + k;
  if (!k.endsWith('/') && !/\.[a-z0-9]{2,5}$/i.test(k)) k += '/';
  return k;
}
const RE_BANG = {
  ngay: /^(ng[aà]y|date)$/i,
  truyVan: /truy v[aấ]n|quer/i,
  trang: /trang|page/i,
  quocGia: /qu[oố]c gia|countr/i,
  thietBi: /thi[eế]t b[iị]|device/i,
  hinhThuc: /h[iì]nh th[uứ]c|appearance/i,
  loc: /b[oộ] l[oọ]c|filter/i,
};
// GSC tieng Viet dich "Mobile" thanh "Sơ đồ trang web dành cho điện thoại di động" — doc theo tu khoa
export const tenThietBi = (s) => (/b[aả]ng|tablet/i.test(s) ? 'Máy tính bảng' : /di [dđ][oộ]ng|mobile/i.test(s) ? 'Điện thoại' : /m[aá]y t[ií]nh|desktop|computer/i.test(s) ? 'Máy tính' : s);
// Bo loc: giao dien Viet va Anh ghi ten khac nhau cho cung mot bo loc
const TEN_LOC = [[/lo[aạ]i t[iì]m ki[eế]m|search type/i, 'loai'], [/qu[oố]c gia|countr/i, 'quocgia'], [/thi[eế]t b[iị]|device/i, 'thietbi'],
  [/^(trang|page)$/i, 'trang'], [/truy v[aấ]n|c[uụ]m t[uừ]|quer/i, 'truyvan'], [/h[iì]nh th[uứ]c|appearance/i, 'hinhthuc']];
const chuanLoc = ([a, b]) => {
  const kk = (TEN_LOC.find(([re]) => re.test(a)) || [null, boDau(a)])[1];
  return `${kk}=${kk === 'thietbi' ? tenThietBi(b) : boDau(b).replace(/\s+/g, '')}`;
};
export function docExport(nguon, nhan) {
  if (!nguon || !fs.existsSync(nguon)) throw new Error(`${nhan}: khong thay file "${nguon}"`);
  const files = docNguon(nguon);
  const doc = (re) => { const b = timBang(files, re); return b ? docBangChiSo(b) : null; };
  const bNgay = timBang(files, RE_BANG.ngay);
  const ngay = bNgay ? docBangChiSo(bNgay) : null;
  if (!ngay) throw new Error(`${nhan}: khong co bang Ngay ("Sơ đồ.csv" / "Dates.csv") — phai la file Xuat -> Tai CSV cua bao cao Hieu suat`);
  if (ngay.truoc) throw new Error(`${nhan}: file xuat o che do "So sanh" (hai bo cot). Xuat lai moi ky mot file rieng.`);
  const ds = [...ngay.nay.keys()].filter(laNgay).sort();
  if (!ds.length) throw new Error(`${nhan}: bang Ngay khong co dong nao`);
  const bLoc = timBang(files, RE_BANG.loc);
  const loc = bLoc ? bLoc.hang.slice(1).filter((r) => r[0]).map((r) => [r[0].trim(), (r[1] || '').trim()]) : [];
  const q = doc(RE_BANG.truyVan), t = doc(RE_BANG.trang), qg = doc(RE_BANG.quocGia), tb = doc(RE_BANG.thietBi), ht = doc(RE_BANG.hinhThuc);
  // Trang: gop bien the co / khong gach cuoi, #muc, ?tham-so (GSC tach rieng, site coi la mot)
  const trang = new Map();
  if (t) for (const [u, v] of t.nay) {
    const k = chuanTrang(u); const o = trang.get(k) || { c: 0, i: 0, pi: 0 };
    o.c += v.c; o.i += v.i; o.pi += v.p * v.i; trang.set(k, o);
  }
  for (const o of trang.values()) o.p = o.i ? o.pi / o.i : null;
  return {
    nhan, tu: ds[0], den: ds[ds.length - 1], soNgay: soNgayGiua(ds[0], ds[ds.length - 1]) + 1, soNgayCoSo: ds.length,
    giaoDien: /date/i.test(bNgay.hang[0][0]) ? 'en' : 'vi',
    ngay: ngay.nay, loc, locKhongNgay: loc.filter(([k]) => !/^(ng[aà]y|date)$/i.test(k)),
    loaiTimKiem: (loc.find(([k]) => /lo[aạ]i t[iì]m ki[eế]m|search type/i.test(k)) || [null, 'Web'])[1],
    q: q && q.nay.size ? q.nay : null, trang: t && trang.size ? trang : null,
    quocGia: qg ? qg.nay : null, thietBi: tb ? tb.nay : null, hinhThuc: ht ? ht.nay : null,
  };
}

// ---------------- Xep loai thay doi vi tri ----------------
// Quy uoc cua site (khong phai so cua Google), neo vao hai vi du Google dua ra: 2 -> 4 la tut nhe, 4 -> 29 la tut manh.
//   on-dinh  : |doi| < max(1; 15% vi tri TOT HON cua hai ky) — doi xung: len hay tut cung mot nguong
//   tut-nhe  : van o trang 1 (<= 10) va tut < 5 bac        (2 -> 4)   -> khong sua gi
//   tut-manh : dang o trang 1–2 (<= 20) va tut >= 10 bac    (4 -> 29)  -> danh gia sau
//   tut-vua  : con lai (roi xuong trang 2, hoac tut 5–9 bac)          -> theo doi them, xem SERP that
//   len-*    : doi xung. mat = ky truoc du nguong, ky sau khong con hien thi; moi = nguoc lai.
// Dai "tut nhe" (duoi 5 bac, con trong top 10) rong hon vi du 2 -> 4 cua Google; nhom ten quan co nguong rieng.
export function phanLoai(pT, pS) {
  if (pT == null && pS == null) return null;
  if (pT == null) return 'moi';
  if (pS == null) return 'mat';
  const d = pS - pT;
  if (Math.abs(d) < Math.max(1, 0.15 * Math.min(pT, pS))) return 'on-dinh';
  if (d > 0) {
    if (pT <= 20 && d >= 10) return 'tut-manh';
    if (pS <= 10 && d < 5) return 'tut-nhe';
    return 'tut-vua';
  }
  if (pS <= 20 && -d >= 10) return 'len-manh';
  if (pT <= 10 && -d < 5) return 'len-nhe';
  return 'len-vua';
}

// So mot dong (truy van / trang) giua hai ky. k = he so quy doi ky truoc ve do dai ky sau (7/7 = 1).
// Chi xep loai theo VI TRI khi KY TRUOC du nguong: ky truoc chi vai hien thi thi vi tri cua no chu yeu la nhieu
// (truy van mua Giang sinh 2 hien thi o vi tri 3 roi 30 hien thi o vi tri 20 khong phai "tut manh") -> 'moi'
// (moi noi / tang tu rat it). Ky truoc du nguong ma ky sau con it thi VAN xep loai — tut sau thi hien thi sap
// theo (4 -> 29 thi gan nhu khong ai con thay) — va ghi "it so". phuThem: hien thi tang manh ma vi tri TB xau
// di — thuong la phu them truy van / nguoi tim moi o vi tri thap, khong phai tut hang.
function soSanhDong(a, b, k, nguongT, nguongS) {
  const iTGoc = a ? a.i : 0, iS = b ? b.i : 0;
  const pT = a && a.i > 0 ? a.p : null, pS = b && b.i > 0 ? b.p : null;
  let loai = null;
  if (iTGoc >= nguongT) loai = phanLoai(pT, pS);
  else if (iS >= nguongS) loai = 'moi';
  const iT = iTGoc * k;
  return {
    cT: a ? a.c * k : 0, iT, iTGoc, pT, cS: b ? b.c : 0, iS, pS, loai,
    tuIt: loai === 'moi' && pT != null,
    itSoLieu: !!loai && loai !== 'moi' && loai !== 'mat' && iS < 5,
    phuThem: pT != null && pS != null && pS > pT && iT > 0 && iS >= 1.5 * iT,
  };
}
// Vi tri tren ro co dinh: chi cac dong co o ca hai ky, trong so = hien thi ky truoc
function roCoDinh(rows) {
  let w = 0, sT = 0, sS = 0, n = 0, iT = 0, iS = 0;
  for (const r of rows) if (r.pT != null && r.pS != null && r.iTGoc > 0) { w += r.iTGoc; sT += r.iTGoc * r.pT; sS += r.iTGoc * r.pS; n++; iT += r.iT; iS += r.iS; }
  return w ? { w, n, pT: sT / w, pS: sS / w, d: (sS - sT) / w, iT, iS } : null;
}
function gopNhom(rows, nguongT) {
  const g = { soDong: rows.length, cT: 0, iT: 0, cS: 0, iS: 0, iTGoc: 0, iMatGoc: 0, dem: {} };
  let piT = 0, wT = 0, piS = 0, wS = 0;
  for (const r of rows) {
    g.cT += r.cT; g.iT += r.iT; g.cS += r.cS; g.iS += r.iS; g.iTGoc += r.iTGoc;
    if (r.pT != null) { piT += r.pT * r.iTGoc; wT += r.iTGoc; }
    if (r.pS != null) { piS += r.pS * r.iS; wS += r.iS; }
    // Chi tinh "mat" o dong ky truoc DU NGUONG: dong 1–3 hien thi tuan nao cung mat 30–80% vi nhieu lay mau
    if (r.loai === 'mat') g.iMatGoc += r.iTGoc;
    if (r.loai) g.dem[r.loai] = (g.dem[r.loai] || 0) + 1;
  }
  g.pT = wT ? piT / wT : null; g.pS = wS ? piS / wS : null; // vi tri TB thuong (tron ca truy van moi / mat)
  g.dc = g.cT ? (g.cS - g.cT) / g.cT : null; g.di = g.iT ? (g.iS - g.iT) / g.iT : null;
  g.ro = roCoDinh(rows);
  g.tiLeMat = g.iTGoc ? g.iMatGoc / g.iTGoc : 0;
  g.loai = g.ro && g.ro.w >= nguongT ? phanLoai(g.ro.pT, g.ro.pS) : null;
  g.matNhieu = g.iTGoc >= nguongT && g.tiLeMat >= 0.3;
  return g;
}
const tong = (mapNgay, tu, den) => {
  let c = 0, i = 0, pi = 0, n = 0;
  for (const [d, v] of mapNgay) if (laNgay(d) && d >= tu && d <= den) { c += v.c; i += v.i; pi += v.p * v.i; n++; }
  return { c, i, p: i ? pi / i : null, ctr: i ? c / i : null, soNgay: n };
};

// ---------------- Bien dao dong thuong ngay (tu export dai) ----------------
// Khoi 7 ngay tinh nguoc tu ngay cuoi. Luon bo khoi: (1) chong len bat ky dot nao (tu ngay bat dau toi xong + 7;
// dot chua xong thi tu bat dau tro di), (2) co ngay le / Tet. Khoi site doi noi dung tu NGUONG_TUAN_TU_SUA trang
// tro len (lastmod sitemap — chi day du tu 18-09-2026) bo them NEU con du SO_CAP_TOI_THIEU cap; site sua gan nhu
// tuan nao cung co (export 3 thang thuong chi con 2–3 cap neu bo het), khi do giu lai va ghi ro trong bang.
// Bien = do lech chuan muc doi giua hai tuan LIEN NHAU con lai. Hai tuan cach xa nhau thuong lech nhieu hon (mua
// vu troi dan) nen day la can duoi; voi 4–10 cap thi chinh do lech chuan cung sai so lon — uoc luong tho.
export function bienDaoDong(mapNgay, dsDot, { tuSuaTheoNgay = null } = {}) {
  const ds = [...mapNgay.keys()].filter(laNgay).sort();
  if (ds.length < 21) return null;
  const vungDot = dsDot.map((d) => [d.batDau, d.xong ? congNgay(d.xong, 7) : '9999-12-31', d.ten]);
  const le = [];
  for (let y = +ds[0].slice(0, 4); y <= +ds[ds.length - 1].slice(0, 4); y++) le.push(...ngayLe(y));
  const khoi = [];
  for (let den = ds[ds.length - 1]; congNgay(den, -6) >= ds[0]; den = congNgay(den, -7)) {
    const tu = congNgay(den, -6), lyDo = [];
    const dot = vungDot.filter(([a, b]) => chongNhau(tu, den, a, b)).map((x) => x[2]);
    if (dot.length) lyDo.push('đợt ' + dot.join(', '));
    const l = le.filter(([a, b]) => chongNhau(tu, den, a, b)).map((x) => x[2]);
    if (l.length) lyDo.push([...new Set(l)].join(', '));
    let tuSua = null;
    if (tuSuaTheoNgay) { tuSua = 0; for (let d = tu; d <= den; d = congNgay(d, 1)) tuSua += tuSuaTheoNgay.get(d) || 0; }
    khoi.unshift({ tu, den, ...tong(mapNgay, tu, den), ngoai: lyDo.length > 0, suaNhieu: tuSua != null && tuSua >= NGUONG_TUAN_TU_SUA, lyDo, tuSua });
  }
  const capTu = (boSua) => {
    const bo = (x) => x.ngoai || (boSua && x.suaNhieu);
    const doi = [];
    for (let n = 1; n < khoi.length; n++) {
      const a = khoi[n - 1], b = khoi[n];
      if (bo(a) || bo(b) || !a.c || !a.i) continue;
      doi.push({ c: (b.c - a.c) / a.c, i: (b.i - a.i) / a.i, p: b.p - a.p });
    }
    return doi;
  };
  let doi = capTu(true), boTuSua = true;
  if (doi.length < SO_CAP_TOI_THIEU) { const rong = capTu(false); if (rong.length > doi.length) { doi = rong; boTuSua = false; } }
  for (const x of khoi) {
    if (x.suaNhieu) x.lyDo.push(`site đổi nội dung ${x.tuSua} lượt trang${boTuSua ? '' : ' (vẫn dùng: bỏ thì không đủ cặp tuần)'}`);
    x.dinh = x.ngoai || (boTuSua && x.suaNhieu);
  }
  const sd = (xs) => { const m = xs.reduce((s, x) => s + x, 0) / xs.length; return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); };
  const du = doi.length >= SO_CAP_TOI_THIEU;
  return { khoi, soCap: doi.length, boTuSua, c: du ? sd(doi.map((x) => x.c)) : null, i: du ? sd(doi.map((x) => x.i)) : null, p: du ? sd(doi.map((x) => x.p)) : null };
}

// ---------------- Ngon ngu trang, thi truong quoc gia ----------------
export const ngonNguCua = (u) => { const m = u.match(/^\/(zh|ko|ja|ru|th)\//); if (m) return m[1]; return u.startsWith('/en/') || /-en\/$/.test(u) ? 'en' : 'vi'; };
const THI_TRUONG = [[/viet ?nam/, 'vi'], [/han quoc|korea/, 'ko'], [/nhat ban|japan/, 'ja'],
  [/trung quoc|china|dai loan|taiwan|hong ?kong|ma ?cao|macao|macau/, 'zh'], [/^nga$|russia|belarus|kazakhstan|kyrgyz/, 'ru'], [/thai ?lan|thailand/, 'th']];
export const thiTruongCua = (ten) => { const n = boDau(ten); for (const [re, k] of THI_TRUONG) if (re.test(n)) return k; return 'khac'; };

// ---------------- 5 gia thuyet ghi truoc (do-luong.md muc 13) ----------------
// Ghi TRUOC khi co so lieu de luc doc bao cao khong "tim ra" nguyen nhan theo y minh.
// H1, H3 chi tinh ban VI + EN de khong trung trang voi H2 (ban dich). H4 (mua vu) va H5 (site tu sua) CO THE
// trung trang voi H1/H2/H3 — doc cot Trang truoc khi cong don ket luan.
const VI_EN = (t) => t.ngonNgu === 'vi' || t.ngonNgu === 'en';
export const GIA_THUYET = [
  { key: 'H1', ten: 'Bài cẩm nang du lịch (bậc O), bản VI + EN', vi: 'Chủ đề xa nghề của quán; nếu tụt, xem bài có dữ kiện riêng (quãng đường thật, giờ tàu, ảnh tự chụp) hay chỉ kể lại điều trang khác đã có.', loc: (t) => t.bac === '1-orient' && VI_EN(t) },
  { key: 'H2', ten: 'Bản dịch tự động zh / ko / ja / ru / th', vi: 'Nội dung nhân bản theo quy mô; nếu tụt riêng nhóm này mà bản VI giữ hạng, xem chất lượng bản dịch trước khi đụng bản gốc. Bản dịch mới vào sitemap 21-10-2026: kỳ trước chúng mới 2–3 tuần tuổi.', loc: (t) => MA_DICH.includes(t.ngonNgu) },
  { key: 'H3', ten: 'Trang của quán (bậc C, P, R, A), bản VI + EN', vi: 'Trang chủ, menu, đường đi, bài chọn quán. Nếu tụt cùng truy vấn tên quán: nghi kỹ thuật, lập chỉ mục hoặc Hồ sơ Google trước, core update sau.', loc: (t) => ['2-choose', '3-prove', '4-rate', '5-act'].includes(t.bac) && VI_EN(t) },
  { key: 'H4', ten: 'Trang mùa vụ (Giáng sinh, Tết)', vi: 'Hiển thị lên xuống theo mùa; đọc vị trí trên rổ cố định, đừng đọc lượt hiển thị.', loc: (t) => /giang-sinh|mo-cua-tet/.test(t.duong) },
  { key: 'H5', ten: 'Trang site tự sửa trong cửa sổ', vi: 'Biến động có thể do chính thay đổi của mình — kiểm lại thay đổi trước khi đổ cho Google.', loc: (t) => t.tuSua },
];

// ---------------- Lich su doi noi dung (git) ----------------
const git = (a) => cp.execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
// URL -> cac ngay noi dung doi that trong [tu, den], doc lastmod cua MOI phien ban sitemap.xml DA COMMIT tu ngay
// tu toi nay. Ban tren dia chua commit thi KHONG doc (Google chua thay) — chi ghi chu. lastmod tam dung duoc tu
// 28-08-2026, chac chan tu 18-09-2026 (truoc do con URL ghi sai; CI chan lech tu ngay nay).
// sao: URL -> ngay diem sao bat len (lan dau du NGUONG_SAO phieu, commit cua sao-bai.yml). Doi nay KHONG nang
// lastmod (van tay kiem-sitemap bo khoi sao), nen doc rieng lich su tools/sao/diem.json; ban dich zh/ko/ja/ru/th
// nhan diem cua ban Viet.
export function lichSuDoiNoiDung(tu, den) {
  const out = { coGit: true, map: new Map(), sao: new Map(), commits: [], chuaCommit: false, tu, den };
  let shas = [];
  try { shas = git(['log', `--since=${tu}T00:00:00`, '--format=%H', '--', 'sitemap.xml']).trim().split('\n').filter(Boolean); }
  catch { out.coGit = false; return out; }
  for (const s of shas) {
    let xml = '';
    try { xml = git(['show', `${s}:sitemap.xml`]); } catch { continue; }
    for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
      const loc = (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1], lm = (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
      if (!loc || !lm) continue;
      const d = lm.trim().slice(0, 10);
      if (d < tu || d > den) continue;
      const p = chuanTrang(loc.trim());
      if (!out.map.has(p)) out.map.set(p, new Set());
      out.map.get(p).add(d);
    }
  }
  try { out.chuaCommit = git(['status', '--porcelain', '--', 'sitemap.xml']).trim() !== ''; } catch { /* bo qua */ }
  // URL dang co trong sitemap (ban da commit): trang con chay that. Stub chuyen huong / trang canonical sang
  // trang khac van con file index.html nhung khong co trong sitemap — khong dung lam doi chung.
  try { out.urlHienTai = new Set([...git(['show', 'HEAD:sitemap.xml']).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => chuanTrang(m[1].trim()))); } catch { out.urlHienTai = null; }
  try {
    const daDu = new Set();
    for (const dong of git(['log', '--reverse', '--format=%H %ad', '--date=short', '--', 'tools/sao/diem.json']).trim().split('\n').filter(Boolean)) {
      const [sha, ngay] = dong.split(' ');
      let j; try { j = JSON.parse(git(['show', `${sha}:tools/sao/diem.json`])); } catch { continue; }
      for (const [u, v] of Object.entries(j.trang || {})) {
        if (!v || !(v.n >= NGUONG_SAO) || daDu.has(u)) continue;
        daDu.add(u);
        if (ngay < tu || ngay > den) continue;
        const laVi = ngonNguCua(u) === 'vi';
        for (const p of [u, ...(laVi ? MA_DICH.map((m) => `/${m}${u}`) : [])]) out.sao.set(p, ngay);
      }
    }
  } catch { /* chua co he sao */ }
  try {
    out.commits = git(['log', `--since=${tu}T00:00:00`, `--until=${den}T23:59:59`, '--format=%ad%x09%h%x09%s', '--date=short', '--', '*.html'])
      .trim().split('\n').filter(Boolean).map((x) => { const [ngay, sha, ...s] = x.split('\t'); return { ngay, sha, tieuDe: s.join(' ') }; });
  } catch { /* khong co lich su: bo qua */ }
  return out;
}
const demTheoNgay = (map) => { const m = new Map(); for (const ds of map.values()) for (const d of ds) m.set(d, (m.get(d) || 0) + 1); return m; };

const giaiMa = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

// ---------------- Phan tich ----------------
export function phanTichDoiChieu({ truoc, sau, caKy, dot, dsDot, quyTac, nguong = 10, homNay, lichSu }) {
  const kq = { dot, nguong, homNay, loiChan: [], canhBao: [], thongTin: [], ketLuan: [] };
  const loi = (s) => kq.loiChan.push(s), cb = (s) => kq.canhBao.push(s), tt = (s) => kq.thongTin.push(s);
  const pt = (x) => (x == null || !isFinite(x) ? '—' : (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x * 100).toFixed(Math.abs(x) < 0.1 ? 1 : 0).replace('.', ',') + '%');
  const ptTron = (x) => pt(x).replace(/^[+−]/, '');
  const vt = (p) => (p == null ? '—' : p.toFixed(1).replace('.', ','));
  const ngayVn = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  const coHaiKy = !!(truoc && sau);
  kq.cheDo = coHaiKy ? 'hai-ky' : 'ca-ky';

  // ---- 1. Khoang ngay ----
  let kyT = null, kyS = null;
  if (coHaiKy) {
    kyT = { tu: truoc.tu, den: truoc.den, soNgay: truoc.soNgay };
    kyS = { tu: sau.tu, den: sau.den, soNgay: sau.soNgay };
  } else if (caKy) {
    kyT = { tu: congNgay(dot.batDau, -7), den: congNgay(dot.batDau, -1), soNgay: 7 };
    kyS = dot.xong ? { tu: congNgay(dot.xong, 1), den: congNgay(dot.xong, 7), soNgay: 7 } : null;
    if (kyT.tu < caKy.tu) loi(`File --ca-ky bắt đầu ${caKy.tu}, không phủ tuần trước đợt (${kyT.tu} → ${kyT.den}).`);
    if (kyS && kyS.den > caKy.den) loi(`File --ca-ky dừng ở ${caKy.den}, chưa phủ tuần sau khi đợt xong (${kyS.tu} → ${kyS.den}).`);
  }
  kq.kyT = kyT; kq.kyS = kyS;
  if (kyT && kyT.den >= dot.batDau) loi(`Kỳ trước (${kyT.tu} → ${kyT.den}) chạm vào đợt cập nhật (bắt đầu ${dot.batDau}). Lấy 7 ngày kết thúc trước ${dot.batDau}.`);
  if (kyT && kyT.den < congNgay(dot.batDau, -1)) cb(`Kỳ trước kết thúc ${soNgayGiua(kyT.den, dot.batDau) - 1} ngày trước khi đợt bắt đầu — Google so với tuần ngay trước đợt; cách càng xa, mùa vụ càng xen vào.`);
  if (!dot.xong) loi(`Đợt "${dot.ten}" chưa xong (dashboard chưa báo hoàn tất). Google khuyên chờ đợt chạy xong rồi thêm ít nhất một tuần mới phân tích.`);
  else if (kyS) {
    if (kyS.tu <= dot.xong) loi(`Kỳ sau (${kyS.tu} → ${kyS.den}) bắt đầu trước hoặc đúng ngày đợt xong (${dot.xong}) — kỳ sau phải bắt đầu từ ${congNgay(dot.xong, 1)}.`);
    if (kyS.den < congNgay(dot.xong, 7)) loi(`Kỳ sau kết thúc ${kyS.den}, chưa đủ một tuần sau ngày xong ${dot.xong} (sớm nhất: hết ngày ${congNgay(dot.xong, 7)}).`);
  }
  if (kyS && homNay && kyS.den > congNgay(homNay, -3)) cb('Kỳ sau chạm 2–3 ngày gần nhất: Search Console thường chưa đủ số của mấy ngày đó. Xuất lại khi kỳ sau đã qua ít nhất 3 ngày.');
  // Trung dot khac: tinh ca 7 ngay sau khi dot do xong (Google khuyen cho mot tuan sau khi xong)
  const dotChong = new Set();
  for (const d of dsDot) {
    if (d.key === dot.key) continue;
    const het = d.xong ? congNgay(d.xong, 7) : '9999-12-31';
    for (const [ten, ky] of [['Kỳ trước', kyT], ['Kỳ sau', kyS]]) {
      if (!ky || !chongNhau(ky.tu, ky.den, d.batDau, het)) continue;
      dotChong.add(d.ten);
      cb(`${ten} trùng đợt "${d.ten}" (${d.batDau} → ${d.xong ? `${d.xong}, tính cả 7 ngày sau khi xong` : 'chưa xong'}): hai đợt chồng nhau, không tách được tác động của từng đợt.`);
    }
  }
  kq.dotChong = [...dotChong];
  let k = 1;
  if (coHaiKy) {
    for (const [ten, ky] of [['Kỳ trước', kyT], ['Kỳ sau', kyS]]) if (ky.soNgay < 7) loi(`${ten} chỉ có ${ky.soNgay} ngày (${ky.tu} → ${ky.den}) — Google so trọn một tuần; xuất đủ 7 ngày.`);
    if (kyT.soNgay !== kyS.soNgay) { k = kyS.soNgay / kyT.soNgay; cb(`Hai kỳ dài khác nhau (${kyT.soNgay} và ${kyS.soNgay} ngày): số kỳ trước đã quy đổi theo ngày. Nên lấy đúng 7 ngày mỗi kỳ.`); }
    else if (kyT.soNgay !== 7) cb(`Mỗi kỳ ${kyT.soNgay} ngày; Google so từng tuần (7 ngày).`);
    for (const x of [truoc, sau]) if (x.soNgayCoSo < x.soNgay) cb(`${x.nhan}: bảng Ngày thiếu ${x.soNgay - x.soNgayCoSo} ngày.`);
    if (truoc.giaoDien !== sau.giaoDien) cb('Hai file xuất từ giao diện Search Console khác tiếng (một Việt, một Anh): tên quốc gia không khớp nhau. Nên xuất cả hai bằng cùng một ngôn ngữ giao diện.');
    const khoa = (x) => JSON.stringify(x.locKhongNgay.map(chuanLoc).sort());
    if (khoa(truoc) !== khoa(sau)) loi(`Hai file lọc khác nhau — kỳ trước: ${truoc.locKhongNgay.map((r) => r.join(': ')).join('; ') || 'không lọc'}; kỳ sau: ${sau.locKhongNgay.map((r) => r.join(': ')).join('; ') || 'không lọc'}.`);
    if (!/^web$/i.test(sau.loaiTimKiem)) tt(`Loại tìm kiếm: ${sau.loaiTimKiem}. Google khuyên xem riêng từng loại (Web, Hình ảnh, Video, Tin tức).`);
    for (const x of [truoc, sau]) if (x.q && x.q.size >= 1000) cb(`${x.nhan}: bảng truy vấn chạm trần 1.000 dòng — truy vấn nhỏ "mất hiển thị" có thể chỉ là bị cắt khỏi file.`);
    if (!truoc.q || !sau.q) cb('Thiếu bảng truy vấn (hoặc bảng rỗng) ở một trong hai file — bỏ phần cụm chủ đề và truy vấn.');
    if (!truoc.trang || !sau.trang) cb('Thiếu bảng trang (hoặc bảng rỗng) ở một trong hai file — bỏ phần trang, ngôn ngữ, bậc DLN, giả thuyết.');
  }
  kq.loaiTimKiem = coHaiKy ? sau.loaiTimKiem : caKy ? caKy.loaiTimKiem : 'Web';

  // ---- 2. Tong + bien dao dong ----
  const nguonNgayT = coHaiKy ? truoc.ngay : caKy ? caKy.ngay : null;
  const nguonNgayS = coHaiKy ? sau.ngay : caKy ? caKy.ngay : null;
  if (kyT && nguonNgayT) kq.tongT = tong(nguonNgayT, kyT.tu, kyT.den);
  if (kyS && nguonNgayS) kq.tongS = tong(nguonNgayS, kyS.tu, kyS.den);
  if (!coHaiKy && kq.tongT && kq.tongS) {
    // --ca-ky: file thieu ngay thi tong it di, khong phai tut — quy doi theo so ngay co so lieu
    if (kq.tongS.soNgay < 7) loi(`Kỳ sau mới có ${kq.tongS.soNgay}/7 ngày số liệu trong file --ca-ky — xuất lại khi đủ.`);
    if (kq.tongT.soNgay < 7) cb(`Kỳ trước chỉ có ${kq.tongT.soNgay}/7 ngày số liệu trong file --ca-ky: số kỳ trước đã quy đổi theo ngày.`);
    if (kq.tongT.soNgay && kq.tongS.soNgay && kq.tongT.soNgay !== kq.tongS.soNgay) k = kq.tongS.soNgay / kq.tongT.soNgay;
  }
  kq.heSoQuyDoi = k;
  if (kq.tongT && kq.tongS && kq.tongT.soNgay && kq.tongS.soNgay) {
    const T = kq.tongT, S = kq.tongS;
    kq.doi = {
      c: T.c ? (S.c - T.c * k) / (T.c * k) : null, i: T.i ? (S.i - T.i * k) / (T.i * k) : null,
      ctr: S.ctr != null && T.ctr != null ? S.ctr - T.ctr : null, p: S.p != null && T.p != null ? S.p - T.p : null,
    };
  }
  const tuSuaTheoNgay = lichSu && lichSu.coGit ? demTheoNgay(lichSu.map) : null;
  kq.bien = caKy ? bienDaoDong(caKy.ngay, dsDot, { tuSuaTheoNgay }) : null;
  const coBien = !!(kq.bien && kq.bien.c != null);
  const bien = coBien ? { c: kq.bien.c, i: kq.bien.i, p: kq.bien.p, soCap: kq.bien.soCap, thamKhao: false } : { ...BIEN_THAM_KHAO, thamKhao: true };
  kq.bienDung = bien;
  if (caKy && !coBien) cb(`File --ca-ky chỉ có ${kq.bien ? kq.bien.soCap : 0} cặp tuần liền nhau không dính đợt cập nhật hay ngày lễ — cần ít nhất ${SO_CAP_TOI_THIEU}; đang dùng biên tham khảo ${BIEN_THAM_KHAO.nguon}. Xuất file 6 tháng qua để đo lại trên số mới.`);
  else if (!caKy) tt(`Không có file --ca-ky: dùng biên dao động tham khảo ${BIEN_THAM_KHAO.nguon} (${BIEN_THAM_KHAO.soCap} cặp tuần — ước lượng thô, đổi theo mùa). Thêm file 6 tháng qua để đo lại.`);
  if (coBien && !kq.bien.boTuSua && kq.bien.khoi.some((x) => x.suaNhieu)) tt(`Dao động thường đo cả trên tuần site sửa từ ${NGUONG_TUAN_TU_SUA} trang trở lên (bỏ đi thì không đủ ${SO_CAP_TOI_THIEU} cặp tuần) — biên có thể rộng hơn dao động tự nhiên.`);
  if (coBien) for (const [x, ten] of [['c', 'nhấp'], ['i', 'hiển thị']]) {
    const ti = kq.bien[x] / BIEN_THAM_KHAO[x];
    if (ti > 2 || ti < 0.5) tt(`Dao động thường của lượt ${ten} đo trên file --ca-ky (±${ptTron(kq.bien[x])}) lệch xa biên tham khảo (±${ptTron(BIEN_THAM_KHAO[x])}): dao động của site đổi theo mùa — báo cáo dùng số đo trên file mới.`);
  }
  const muc = (x, s) => (x == null || s == null ? null : Math.abs(x) <= s ? 'trong' : Math.abs(x) <= 2 * s ? 'de-y' : 'vuot');
  if (kq.doi) kq.mucDoi = { c: muc(kq.doi.c, bien.c), i: muc(kq.doi.i, bien.i) };

  // ---- Lich su site tu sua ----
  // cuaSo: tu dau ky truoc toi het ky sau — thay doi trong khoang nay tron thang vao so sanh (H5).
  // truocKy: LUI_TRUOC_KY ngay ngay truoc ky truoc — Google can vai ngay toi vai tuan de thu thap lai ("Crawling can take
  // anywhere from a few days to a few weeks"), nen thay doi luc do co the con dang ngam vao ca hai ky.
  const cuaSo = kyT ? { tu: kyT.tu, den: kyS ? kyS.den : (dot.xong ? congNgay(dot.xong, 7) : (homNay || kyT.den)) } : null;
  const truocKy = kyT ? { tu: congNgay(kyT.tu, -LUI_TRUOC_KY), den: congNgay(kyT.tu, -1) } : null;
  kq.cuaSo = cuaSo; kq.truocKy = truocKy;
  const ngayDoi = (u, kh) => (lichSu && kh ? [...(lichSu.map.get(u) || [])].filter((d) => d >= kh.tu && d <= kh.den).sort() : []);
  const saoCua = (u, kh) => { const d = lichSu && lichSu.sao ? lichSu.sao.get(u) : null; return d && kh && d >= kh.tu && d <= kh.den ? d : null; };
  if (lichSu) {
    const trongKh = (c, kh) => kh && c.ngay >= kh.tu && c.ngay <= kh.den;
    kq.lichSu = { coGit: lichSu.coGit, commits: lichSu.commits.filter((c) => trongKh(c, cuaSo)), commitsTruoc: lichSu.commits.filter((c) => trongKh(c, truocKy)) };
    if (!lichSu.coGit) cb('Không đọc được lịch sử git — không đánh dấu được trang site tự sửa.');
    if (lichSu.chuaCommit) tt('sitemap.xml trên máy có lastmod chưa commit — không tính là site tự sửa (Google chưa thấy).');
    if (truocKy && truocKy.tu < '2026-09-18') tt('Ngày đổi nội dung lấy từ lastmod của sitemap — tạm dùng được từ 28-08-2026, chắc chắn từ 18-09-2026; trước đó xem danh sách commit.');
  }

  // ---- 3 + 4. Truy van, cum, ten quan ----
  const nguongT = kyT ? nguong * kyT.soNgay / 7 : nguong, nguongS = kyS ? nguong * kyS.soNgay / 7 : nguong;
  kq.nguongT = nguongT; kq.nguongS = nguongS;
  const rutGon = (r) => ({ q: r.q, duong: r.duong, cT: r.cT, iT: r.iT, iTGoc: r.iTGoc, pT: r.pT, cS: r.cS, iS: r.iS, pS: r.pS, loai: r.loai, itSoLieu: r.itSoLieu, tuIt: r.tuIt, phuThem: r.phuThem, tenCum: r.tenCum, title: r.title, ngonNgu: r.ngonNgu, tenBac: r.tenBac, doiNoiDung: r.doiNoiDung, doiTruocKy: r.doiTruocKy, saoBat: r.saoBat, tuSua: r.tuSua, cumDich: r.cumDich, tonTai: r.tonTai, trongSitemap: r.trongSitemap });
  const cong = (rows, f) => rows.reduce((s, r) => s + f(r), 0);
  if (coHaiKy && truoc.q && sau.q) {
    const { cumQ, ganCum } = taoGanCum(quyTac);
    const reTH = new RegExp(quyTac.thuongHieu, 'i');
    const tv = [];
    for (const q of new Set([...truoc.q.keys(), ...sau.q.keys()])) {
      const c = ganCum(q);
      const r = soSanhDong(truoc.q.get(q), sau.q.get(q), k, nguongT, nguongS);
      r.q = q; r.cum = c ? c.key : null; r.tenCum = c ? c.ten : 'Chưa phân cụm';
      r.nhom = c && c.loai === 'nhieu' ? 'nhieu' : (c ? c.loai === 'thuong-hieu' : reTH.test(boDau(q))) ? 'ten-quan' : 'khong-ten-quan';
      tv.push(r);
    }
    const that = tv.filter((r) => r.nhom !== 'nhieu');
    kq.roSite = roCoDinh(that);
    const g = gopNhom(that, nguongT); kq.tiLeMatSite = g.tiLeMat; kq.iTGocSite = g.iTGoc;
    // Phan bo hien thi: bang truy van chi co truy van Google cho xuat (khong co truy van an danh, toi da 1.000 dong)
    kq.phanBo = {
      bangT: cong(tv, (r) => r.iT), bangS: cong(tv, (r) => r.iS),
      roT: kq.roSite ? kq.roSite.iT : 0, roS: kq.roSite ? kq.roSite.iS : 0,
      moiS: cong(that, (r) => (r.pT == null ? r.iS : 0)), matT: cong(that, (r) => (r.pS == null ? r.iT : 0)),
    };
    if (kq.tongT && kq.tongS) {
      Object.assign(kq.phanBo, { tongT: kq.tongT.i * k, tongS: kq.tongS.i });
      kq.phanBo.anT = Math.max(0, kq.phanBo.tongT - kq.phanBo.bangT);
      kq.phanBo.anS = Math.max(0, kq.phanBo.tongS - kq.phanBo.bangS);
    }
    kq.soTruyVan = { truoc: truoc.q.size, sau: sau.q.size };
    const theoCum = new Map();
    for (const r of tv) { const key = r.cum || '_chua-phan'; if (!theoCum.has(key)) theoCum.set(key, []); theoCum.get(key).push(r); }
    kq.cum = [...theoCum].map(([key, rows]) => {
      const c = cumQ.find((x) => x.key === key);
      const top = [...rows].sort((a, b) => (b.iTGoc + b.iS) - (a.iTGoc + a.iS)).slice(0, 8).map(rutGon);
      // kieu = loai cum trong cum-chu-de.json (nhieu, thuong-hieu…). KHONG dat ten "loai": gopNhom tra ve "loai" =
      // xep loai vi tri va se ghi de, lam cum nhieu lot vao ket luan.
      return { key, ten: c ? c.ten : 'Chưa phân cụm', kieu: c ? c.loai : null, dich: c ? c.dich : null, ...gopNhom(rows, nguongT), top };
    }).sort((a, b) => (b.iT + b.iS) - (a.iT + a.iS));
    kq.tenQuan = ['ten-quan', 'khong-ten-quan', 'nhieu'].map((n) => ({ key: n, ten: { 'ten-quan': 'Có tên quán', 'khong-ten-quan': 'Không có tên quán', nhieu: 'Nhiễu (quán khác, quán chị em, tên gần giống) — không tính vào kết luận' }[n], ...gopNhom(tv.filter((r) => r.nhom === n), nguongT) }));
    kq.truyVan = tv.filter((r) => r.loai && r.nhom !== 'nhieu').sort((a, b) => (b.iTGoc + b.iS) - (a.iTGoc + a.iS)).map(rutGon);
  }

  // ---- Trang, ngon ngu, bac DLN, gia thuyet, doi chung theo lan site tu sua ----
  if (coHaiKy && truoc.trang && sau.trang) {
    const dichVe = new Map();
    for (const c of quyTac.cum) if (c.dich && c.loai !== 'nhieu') for (const u of [c.dich, banEn(c.dich)]) { if (!dichVe.has(u)) dichVe.set(u, []); dichVe.get(u).push(c.ten); }
    const rows = [];
    for (const u of new Set([...truoc.trang.keys(), ...sau.trang.keys()])) {
      const r = soSanhDong(truoc.trang.get(u), sau.trang.get(u), k, nguongT, nguongS);
      const b = bacCua(u);
      Object.assign(r, { duong: u, ngonNgu: ngonNguCua(u), tonTai: !!b.tonTai, bac: b.bac || null, tenBac: b.tenBac || null, title: giaiMa(b.title),
        doiNoiDung: ngayDoi(u, cuaSo), doiTruocKy: ngayDoi(u, truocKy), saoBat: saoCua(u, cuaSo) });
      r.tuSua = r.doiNoiDung.length > 0 || !!r.saoBat;
      r.trongSitemap = lichSu && lichSu.urlHienTai && lichSu.urlHienTai.size ? lichSu.urlHienTai.has(u) : null;
      const goc = u.replace(/^\/(zh|ko|ja|ru|th)\//, '/');
      r.cumDich = dichVe.get(u) || (goc !== u && dichVe.get(goc) ? dichVe.get(goc).map((x) => x + ' (bản dịch)') : []);
      rows.push(r);
    }
    kq.roTrang = roCoDinh(rows);
    const TEN_NN = { vi: 'Tiếng Việt', en: 'Tiếng Anh', zh: 'Tiếng Trung (zh)', ko: 'Tiếng Hàn (ko)', ja: 'Tiếng Nhật (ja)', ru: 'Tiếng Nga (ru)', th: 'Tiếng Thái (th)' };
    kq.ngonNgu = Object.keys(TEN_NN).map((n) => ({ key: n, ten: TEN_NN[n], ...gopNhom(rows.filter((r) => r.ngonNgu === n), nguongT) })).filter((g) => g.soDong);
    const BAC = ['1-orient', '2-choose', '3-prove', '4-rate', '5-act', 'hub', 'legal', null];
    kq.bacDln = BAC.map((b) => ({ key: b || 'khong', ten: b ? (rows.find((r) => r.bac === b) || {}).tenBac || b : 'Chưa khai bậc / không còn trên site', ...gopNhom(rows.filter((r) => (r.bac || null) === b), nguongT) })).filter((g) => g.soDong);
    const canXem = (r) => (r.loai === 'tut-manh' && !r.phuThem) || (r.loai === 'mat' && r.pT != null && r.pT <= 20);
    kq.giaThuyet = GIA_THUYET.map((h) => { const ds = rows.filter(h.loc); return { key: h.key, ten: h.ten, vi: h.vi, ...gopNhom(ds, nguongT), canXem: ds.filter(canXem).length }; });
    // Doi chung: trang khong doi gi tu 3 tuan truoc ky truoc toi het ky sau la nhom sach nhat — no tut cung cac
    // nhom khac thi nghieng ve Google / mua; chi nhom vua doi tut thi xem lai thay doi cua minh.
    if (truocKy) {
      // URL khong co trong sitemap (da gop / chuyen huong / canonical sang trang khac) khong co lastmod nhung KHONG
      // sach: hien thi tu giam dan khi Google gom ve trang moi — tach rieng. Stub chuyen huong van con file
      // index.html (tonTai = true) nen phai xet theo sitemap; khong doc duoc git thi moi lui ve tonTai.
      const conChay = (r) => (r.trongSitemap == null ? r.tonTai : r.trongSitemap);
      const conTren = rows.filter(conChay);
      const sach = conTren.filter((r) => !r.tuSua && !r.doiTruocKy.length), doiTruoc = conTren.filter((r) => !r.tuSua && r.doiTruocKy.length);
      const doiTrong = conTren.filter((r) => r.tuSua), khongCon = rows.filter((r) => !conChay(r));
      kq.doiChung = [
        { key: 'sach', ten: `Không đổi nội dung từ ${ngayVn(truocKy.tu)} tới hết kỳ sau (đối chứng sạch nhất)`, ...gopNhom(sach, nguongT) },
        { key: 'doi-truoc', ten: `Đổi trong 3 tuần trước kỳ trước (${ngayVn(truocKy.tu)} – ${ngayVn(truocKy.den)}), không đổi sau đó`, ...gopNhom(doiTruoc, nguongT) },
        { key: 'doi-trong', ten: 'Đổi trong cửa sổ so sánh (nội dung hoặc điểm sao)', ...gopNhom(doiTrong, nguongT) },
        { key: 'khong-con', ten: 'URL không có trong sitemap (đã gộp / chuyển hướng / canonical sang trang khác) — tự giảm dần, không phải đối chứng', ...gopNhom(khongCon, nguongT) },
      ].filter((x) => x.soDong);
      // Ky truoc khong sach: phan lon hien thi ky truoc nam o trang vua doi / vua tao ngay truoc do
      const iTT = cong(rows, (r) => r.iTGoc), coDoiTruoc = rows.filter((r) => r.doiTruocKy.length);
      const tiLe = iTT ? cong(coDoiTruoc, (r) => r.iTGoc) / iTT : 0;
      const soUrl = lichSu ? [...lichSu.map.values()].filter((ds) => [...ds].some((d) => d >= truocKy.tu && d <= truocKy.den)).length : 0;
      const ngayNhieu = lichSu ? [...demTheoNgay(lichSu.map)].filter(([d, so]) => d >= truocKy.tu && d <= truocKy.den && so >= 20).sort() : [];
      kq.kyTruocBan = { tu: truocKy.tu, den: truocKy.den, soUrl, soTrangCoSo: coDoiTruoc.length, tiLeHienThi: tiLe, ngayNhieu: ngayNhieu.map(([d, so]) => ({ d, so })) };
      if (tiLe >= 0.3) {
        kq.kyTruocBan.chu = `Kỳ trước chưa sạch: trong 3 tuần trước đó (${ngayVn(truocKy.tu)} – ${ngayVn(truocKy.den)}) site đổi nội dung ${soUrl} URL${ngayNhieu.length ? ` (${ngayNhieu.map(([d, so]) => `${ngayVn(d)}: ${so}`).join(', ')})` : ''}; các trang này giữ ${ptTron(tiLe)} hiển thị kỳ trước. Google cần vài ngày tới vài tuần để thu thập lại, nên phần đổi của nhóm này không tách được khỏi tác động của đợt (như tiền lệ tháng 8). Đọc nhóm "Không đổi nội dung" và truy vấn tên quán trước.`;
        cb(kq.kyTruocBan.chu);
      }
    }
    kq.trang = rows.filter((r) => r.loai || r.tuSua).sort((a, b) => (b.iTGoc + b.iS) - (a.iTGoc + a.iS)).map(rutGon);
  }

  // ---- Quoc gia, thiet bi, hinh thuc ----
  if (coHaiKy) {
    const soMap = (mT, mS, ten) => {
      if (!mT || !mS) return null;
      // Gop khoa theo ten chuan (thiet bi: "Mobile" va "Sơ đồ trang web dành cho điện thoại di động" la mot)
      const gop = (m) => { if (!ten) return m; const o = new Map(); for (const [key, v] of m) { const kk = ten(key); const x = o.get(kk) || { c: 0, i: 0, pi: 0 }; x.c += v.c; x.i += v.i; x.pi += (v.p || 0) * v.i; o.set(kk, x); } for (const x of o.values()) x.p = x.i ? x.pi / x.i : null; return o; };
      const a2 = gop(mT), b2 = gop(mS);
      return [...new Set([...a2.keys(), ...b2.keys()])].map((key) => {
        const a = a2.get(key), b = b2.get(key);
        return { key, ten: key, cT: a ? a.c * k : 0, iT: a ? a.i * k : 0, pT: a && a.i ? a.p : null, cS: b ? b.c : 0, iS: b ? b.i : 0, pS: b && b.i ? b.p : null };
      }).sort((x, y) => (y.iT + y.iS) - (x.iT + x.iS));
    };
    const qg = soMap(truoc.quocGia, sau.quocGia);
    if (qg) {
      kq.quocGia = qg.slice(0, 15);
      const TEN_TT = { vi: 'Việt Nam', en: 'Nước khác (đọc bản EN)', khac: 'Nước khác (đọc bản EN)', ko: 'Hàn Quốc', ja: 'Nhật Bản', zh: 'Trung Quốc, Đài Loan, Hồng Kông, Ma Cao', ru: 'Nga và nước nói tiếng Nga', th: 'Thái Lan' };
      const gop = new Map();
      for (const r of qg) {
        const key = thiTruongCua(r.key);
        const o = gop.get(key) || { key, ten: TEN_TT[key], cT: 0, iT: 0, cS: 0, iS: 0, piT: 0, piS: 0 };
        o.cT += r.cT; o.iT += r.iT; o.cS += r.cS; o.iS += r.iS; o.piT += (r.pT || 0) * r.iT; o.piS += (r.pS || 0) * r.iS; gop.set(key, o);
      }
      kq.thiTruong = [...gop.values()].map((o) => ({ ...o, pT: o.iT ? o.piT / o.iT : null, pS: o.iS ? o.piS / o.iS : null })).sort((x, y) => (y.iT + y.iS) - (x.iT + x.iS));
    }
    kq.thietBi = soMap(truoc.thietBi, sau.thietBi, tenThietBi);
    if (kq.thietBi) {
      // Ro co dinh khong giu co cau thiet bi: may tinh thuong dung thap hon dien thoai vai bac
      const dt = kq.thietBi.find((x) => x.ten === 'Điện thoại'), mt = kq.thietBi.find((x) => x.ten === 'Máy tính');
      const iT = cong(kq.thietBi, (x) => x.iT), iS = cong(kq.thietBi, (x) => x.iS);
      if (dt && iT && iS) {
        kq.coCauThietBi = { dtT: dt.iT / iT, dtS: dt.iS / iS, pDt: dt.pT, pMt: mt ? mt.pT : null };
        kq.coCauThietBi.doi = kq.coCauThietBi.dtS - kq.coCauThietBi.dtT;
      }
    }
    const ht = soMap(truoc.hinhThuc, sau.hinhThuc);
    kq.hinhThuc = ht && ht.length ? ht : null;
  }

  // ---- Bieu do theo ngay (tu --ca-ky) ----
  if (caKy) {
    const dsNgay = [...caKy.ngay.keys()].filter(laNgay).sort();
    const tu = dsNgay[0], den = dsNgay[dsNgay.length - 1];
    kq.ngay = [];
    for (let d = tu; d <= den; d = congNgay(d, 1)) { const v = caKy.ngay.get(d); kq.ngay.push(v ? { d, c: v.c, i: v.i, p: v.i ? v.p : null } : { d, c: null, i: null, p: null }); }
    kq.dotTrongKy = dsDot.filter((d) => chongNhau(tu, den, d.batDau, d.xong || den)).map((d) => ({ key: d.key, ten: d.ten, loai: d.loai, batDau: d.batDau, xong: d.xong }));
    if (lichSu) kq.ngayDoi = [...demTheoNgay(lichSu.map)].filter(([d]) => d >= tu && d <= den).map(([d, so]) => ({ d, so })).sort((a, b) => (a.d < b.d ? -1 : 1));
    kq.caKy = { tu, den };
  }

  // ---- Ket luan ----
  const L = (m, chu) => kq.ketLuan.push({ muc: m, chu });
  const hang = (d) => (Math.abs(d) < 0.05 ? 'giữ nguyên' : (d > 0 ? 'tụt ' : 'lên ') + Math.abs(d).toFixed(1).replace('.', ',') + ' bậc');
  const so = (n) => Math.round(n).toLocaleString('vi-VN');
  if (kq.loiChan.length) L('xau', `Chưa đủ điều kiện kết luận (${kq.loiChan.length} điều kiện chưa đạt — xem đầu báo cáo). Số dưới đây chỉ để xem sớm: chưa sửa gì tới hết 7 ngày sau khi đợt xong.`);
  if (kq.dotChong.length) L('canh-bao', `Kỳ so sánh trùng đợt khác (${kq.dotChong.join(', ')}): không tách được tác động của từng đợt — đừng sửa theo báo cáo này.`);
  if (kq.kyTruocBan && kq.kyTruocBan.chu) L('canh-bao', `Kỳ trước chưa sạch: ${ptTron(kq.kyTruocBan.tiLeHienThi)} hiển thị kỳ trước nằm ở trang site đổi nội dung trong 3 tuần trước đó (cảnh báo đầu trang). Đọc nhóm "Không đổi nội dung" (bảng Trang theo lần site tự sửa) và truy vấn tên quán trước.`);
  const MUC = { trong: 'nằm trong dao động thường của site — chưa nói lên gì', 'de-y': 'lớn hơn dao động thường nhưng chưa tới 2 lần — chưa chắc', vuot: 'lớn hơn 2 lần dao động đo được — đáng xem, chưa biết do đâu' };
  const ghiBien = bien.thamKhao ? ` (biên tham khảo ${bien.nguon}, ${bien.soCap} cặp tuần — ước lượng thô)` : ` (đo trên file --ca-ky, ${bien.soCap} cặp tuần — ước lượng thô)`;
  if (kq.doi && kq.mucDoi) {
    for (const [x, ten] of [['c', 'Lượt nhấp'], ['i', 'Lượt hiển thị']]) {
      const m = kq.mucDoi[x]; if (!m) continue;
      L(m === 'trong' ? 'trung' : kq.doi[x] > 0 ? (m === 'vuot' ? 'tot' : 'trung') : 'canh-bao',
        `${ten} ${pt(kq.doi[x])} so với kỳ trước; dao động thường của site ±${ptTron(bien[x])}/tuần${x === 'c' ? ghiBien : ''}: ${MUC[m]}.`);
    }
  }
  if (!kq.roSite && kq.doi && kq.doi.p != null && bien.p) {
    // Chi co tong theo ngay: vi tri TB ca site tron ca truy van moi / mat, nen chi la tin hieu tho
    const m = muc(kq.doi.p, bien.p);
    L(m === 'trong' ? 'trung' : kq.doi.p > 0 ? 'canh-bao' : 'tot',
      `Vị trí trung bình cả site ${vt(kq.tongT.p)} → ${vt(kq.tongS.p)} (${hang(kq.doi.p)}; dao động thường ±${bien.p.toFixed(1).replace('.', ',')}): ${MUC[m]}. Con số này trộn cả truy vấn mới / mất — xuất thêm hai file tuần để đọc vị trí trên rổ truy vấn cố định.`);
  }
  if (kq.cheDo === 'ca-ky' && kq.lichSu && (kq.lichSu.commits.length || kq.lichSu.commitsTruoc.length)) {
    L('canh-bao', `${kq.lichSu.commits.length} commit sửa trang trong cửa sổ ${kq.cuaSo.tu} → ${kq.cuaSo.den}, ${kq.lichSu.commitsTruoc.length} commit trong 3 tuần trước đó: biến động có thể do chính site — xem danh sách commit trước khi đổ cho Google.`);
  }
  const matNhieuSite = kq.tiLeMatSite != null && kq.tiLeMatSite >= 0.15;
  if (kq.roSite) {
    const r = kq.roSite, l = phanLoai(r.pT, r.pS);
    // Phu tinh tren TONG hien thi ca site (bang Ngay, gom truy van an danh), khong tren rieng bang truy van
    const phu = kq.tongT && kq.tongT.i ? r.w / kq.tongT.i : null;
    const ccTb = kq.coCauThietBi && Math.abs(kq.coCauThietBi.doi) > 0.05
      ? ` Tỉ lệ hiển thị trên điện thoại ${ptTron(kq.coCauThietBi.dtT)} → ${ptTron(kq.coCauThietBi.dtS)}${kq.coCauThietBi.pMt != null ? ` (máy tính đứng ${vt(kq.coCauThietBi.pMt)}, điện thoại ${vt(kq.coCauThietBi.pDt)})` : ''}: một phần xê dịch của rổ có thể do cơ cấu thiết bị, không phải hạng — đọc bảng Thiết bị.` : '';
    L(Math.abs(r.d) < 0.5 ? (matNhieuSite ? 'trung' : 'tot') : l === 'tut-manh' || l === 'tut-vua' ? 'xau' : l && l.startsWith('len') ? 'tot' : 'trung',
      `Hạng trên ${r.n} truy vấn có ở cả hai kỳ (rổ cố định, phủ ${phu == null ? '—' : ptTron(phu)} tổng hiển thị kỳ trước): ${vt(r.pT)} → ${vt(r.pS)}, ${hang(r.d)}${Math.abs(r.d) < 0.5 ? ' — gần như không đổi' : l === 'tut-nhe' ? ' — tụt nhẹ kiểu 2 → 4: không sửa' : ''}${matNhieuSite ? ' (chưa tính phần hiển thị nằm ở truy vấn đã mất, xem dòng dưới)' : ''}.${ccTb}`);
    if (kq.mucDoi && kq.mucDoi.i && kq.mucDoi.i !== 'trong' && Math.abs(r.d) < 0.5 && !matNhieuSite && kq.phanBo) {
      // Hien thi doi ma hang giu: chi nghieng ve "nhu cau" khi chinh truy van cu cung doi cung chieu, cung co.
      // Bang truy van thieu truy van an danh — phan do khong doc duoc hang, khong ket luan thay.
      const pb = kq.phanBo, dTong = kq.doi.i, dRo = pb.roT ? (pb.roS - pb.roT) / pb.roT : null;
      const tiMoi = pb.bangS ? pb.moiS / pb.bangS : 0;
      const anDanh = pb.tongT && pb.tongS ? ` Phần truy vấn ẩn danh / ngoài bảng: ${so(pb.anT)} → ${so(pb.anS)} hiển thị (${ptTron(pb.anT / pb.tongT)} → ${ptTron(pb.anS / pb.tongS)} tổng) — phần đó không đọc được hạng.` : '';
      if (dRo != null && Math.sign(dRo) === Math.sign(dTong) && Math.abs(dRo) >= Math.abs(dTong) / 2) L('trung', `Hiển thị ${pt(dTong)} mà hạng giữ nguyên, và chính các truy vấn cũ cũng đổi cùng chiều (${pt(dRo)}) → nhiều khả năng nhu cầu tìm kiếm đổi (mùa du lịch, thời tiết, sự kiện).${anDanh}`);
      else if (dTong > 0 && tiMoi >= 0.2) L('trung', `Hiển thị tăng chủ yếu ở truy vấn mới (${ptTron(tiMoi)} hiển thị kỳ sau nằm ở truy vấn kỳ trước chưa có), hạng truy vấn cũ giữ nguyên — thường là trang mới / bản dịch đang được lập chỉ mục; xem nhóm "Mới nổi".${anDanh}`);
      else L('trung', `Hiển thị ${pt(dTong)} mà hạng truy vấn cũ giữ nguyên; phần đổi nằm ngoài rổ cố định (truy vấn mới, mất, ẩn danh) — chưa kết luận được nguyên nhân.${anDanh}`);
    }
  }
  if (matNhieuSite) L('canh-bao', `${ptTron(kq.tiLeMatSite)} hiển thị kỳ trước nằm ở truy vấn đủ ngưỡng mà kỳ sau không còn dòng nào — tụt rất sâu, ra khỏi chỉ mục hoặc hết mùa; xem mục "Cần đánh giá sâu" và "Mất hiển thị".`);
  if (kq.tenQuan) {
    // Ten quan: nguoi da biet quan. Site phai dung dau cho chinh ten minh — nguong chat hon dai "tut nhe" chung.
    const th = kq.tenQuan.find((g) => g.key === 'ten-quan');
    if (th && th.iTGoc >= nguongT) {
      const d = th.ro ? th.ro.d : null;
      if (th.loai === 'tut-manh' || th.loai === 'tut-vua' || th.matNhieu) L('xau', `Tụt cả truy vấn có tên quán${th.ro ? ` (${vt(th.ro.pT)} → ${vt(th.ro.pS)})` : ''} — hiếm khi do core update. Kiểm trong Search Console: Thao tác thủ công, Vấn đề bảo mật, báo cáo Trang (lập chỉ mục), Thống kê thu thập dữ liệu; kiểm Hồ sơ doanh nghiệp trên Google.`);
      else if (th.ro && (d >= 1 || th.ro.pS > 3)) L('canh-bao', `Truy vấn có tên quán ${vt(th.ro.pT)} → ${vt(th.ro.pS)} (${hang(d)}): site không còn đứng đầu cho chính tên mình. Tìm tên quán trên Google xem ai đứng trên (trang review, mạng xã hội, quán khác) và kiểm Hồ sơ doanh nghiệp; core update hiếm khi làm việc này.`);
      else if (th.ro) L(th.ro.pS <= 2 ? 'tot' : 'trung', `Truy vấn có tên quán: ${vt(th.ro.pT)} → ${vt(th.ro.pS)}, ${hang(d)}${th.ro.pS <= 2 ? ' — người đã biết quán vẫn thấy quán ở đầu trang' : ''}.`);
      if (th.ro && Math.abs(d) < 1 && th.dc != null && bien.c && th.dc < -2 * bien.c && th.cT >= 10) L('trung', `Lượt nhấp truy vấn tên quán ${pt(th.dc)} (hơn 2 lần dao động thường) dù hạng giữ: ít người tìm tên quán hơn (mùa, mạng xã hội) hoặc khung Hồ sơ doanh nghiệp nhận bớt lượt nhấp — xem Hồ sơ doanh nghiệp → Hiệu suất cùng hai kỳ.`);
    }
  }
  const nhomTut = [];
  const dsNhom = [['Cụm', (kq.cum || []).filter((c) => c.kieu !== 'nhieu' && c.key !== '_chua-phan'), 'truy vấn'], ['Ngôn ngữ', kq.ngonNgu || [], 'trang'], ['Bậc', kq.bacDln || [], 'trang']];
  for (const [ten, ds, donVi] of dsNhom) {
    for (const g of ds) if (g.loai === 'tut-manh' || g.loai === 'tut-vua' || g.matNhieu) nhomTut.push(`${ten.toLowerCase()} "${g.ten}" (${g.ro ? 'hạng ' + hang(g.ro.d) : ''}${g.matNhieu ? `${g.ro ? ', ' : ''}${ptTron(g.tiLeMat)} hiển thị kỳ trước nằm ở ${donVi} đã mất` : ''})`);
  }
  // Chi ke ten loai nhom THUC CO so (thieu bang truy van thi khong noi "khong cum nao tut")
  const tenNhomXet = dsNhom.filter(([, ds]) => ds.some((g) => g.loai)).map(([ten]) => ({ 'Cụm': 'cụm chủ đề', 'Ngôn ngữ': 'ngôn ngữ trang', 'Bậc': 'bậc DLN' }[ten]));
  if (nhomTut.length) L('canh-bao', `Nhóm tụt rõ: ${nhomTut.join('; ')}.`);
  else if (tenNhomXet.length) L('tot', `Không ${tenNhomXet.join(', ')} nào tụt rõ.`);
  else if (kq.cum || kq.ngonNgu) L('trung', `Không nhóm nào đủ số để xếp loại (cần ít nhất ${so(nguongT)} hiển thị kỳ trước trên rổ cố định của nhóm).`);
  if (kq.truyVan || kq.trang) {
    const chuThe = [kq.truyVan && 'truy vấn', kq.trang && 'trang'].filter(Boolean);
    const tv = kq.truyVan || [], tr = kq.trang || [];
    const tm = tv.filter((r) => r.loai === 'tut-manh' && !r.phuThem).length;
    const tmTrang = tr.filter((r) => r.loai === 'tut-manh' && !r.phuThem && !r.tuSua).length;
    const mat12 = (r) => r.loai === 'mat' && r.pT != null && r.pT <= 20;
    const matQ = tv.filter(mat12).length, matT = tr.filter((r) => mat12(r) && !r.tuSua).length;
    const tuSua = tr.filter((r) => r.tuSua && r.loai && (r.loai.startsWith('tut') || r.loai === 'mat')).length;
    const nhe = tv.filter((r) => r.loai === 'tut-nhe').length + tr.filter((r) => r.loai === 'tut-nhe').length;
    const phan = [tm + tmTrang ? `${tm} truy vấn và ${tmTrang} trang tụt mạnh (kiểu 4 → 29)` : '', matQ + matT ? `${matQ} truy vấn và ${matT} trang đang ở trang 1–2 thì mất hẳn hiển thị (kiểm bằng Kiểm tra URL: còn được lập chỉ mục không)` : ''].filter(Boolean);
    if (phan.length) L('xau', `${phan.join('; ')} — cần đánh giá sâu, mục "Cần đánh giá sâu".`);
    else L('tot', `Không ${chuThe.join(', không ')} nào tụt mạnh (kiểu 4 → 29) hay mất hẳn hiển thị khi đang ở trang 1–2.`);
    if (tuSua) L('canh-bao', `${tuSua} trang tụt trùng lúc chính site sửa (nội dung hoặc điểm sao) — kiểm thay đổi của mình trước.`);
    if (nhe) L('trung', `${nhe} truy vấn / trang tụt nhẹ (kiểu 2 → 4): không sửa — Google khuyên tránh đụng nội dung đang chạy tốt.`);
  }
  return kq;
}

// ---------------- Chay tu dong lenh ----------------
async function chay() {
  const dsDot = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/dot-cap-nhat-google.json'), 'utf8')).dot;
  const keyDot = thamSo('--dot');
  let dot = keyDot ? dsDot.find((d) => d.key === keyDot) : null;
  if (keyDot && !dot) throw new Error(`Khong co dot "${keyDot}" trong tools/dot-cap-nhat-google.json. Co: ${dsDot.map((d) => d.key).join(', ')}`);
  const xong = thamSo('--xong');
  if (xong && !laNgay(xong)) throw new Error('--xong phai la ngay that, dang YYYY-MM-DD');
  if (!dot) {
    const bd = thamSo('--bat-dau');
    if (!bd || !laNgay(bd)) throw new Error('Thieu --dot <key> (xem tools/dot-cap-nhat-google.json) hoac --bat-dau YYYY-MM-DD [--xong YYYY-MM-DD]');
    dot = { key: 'tu-khai', ten: 'Đợt cập nhật (tự khai ngày)', loai: 'khac', batDau: bd, xong: xong || null };
  } else if (xong) {
    // --xong ghi de (vd: dashboard vua bao xong ma chua kip sua file json)
    dot = { ...dot, xong };
  }
  if (dot.xong && dot.xong < dot.batDau) throw new Error(`Ngay xong ${dot.xong} truoc ngay bat dau ${dot.batDau}`);
  const fT = thamSo('--truoc'), fS = thamSo('--sau'), fK = thamSo('--ca-ky');
  if (!!fT !== !!fS) throw new Error('--truoc va --sau phai di cung nhau');
  if (!fT && !fK) throw new Error('Can --truoc + --sau (hai tuan, moi tuan mot file) hoac --ca-ky (file 6 thang qua)');
  const nguong = Number(thamSo('--nguong') || 10);
  if (!(nguong > 0)) throw new Error('--nguong phai la so duong');
  const homNay = thamSo('--hom-nay') || new Date().toISOString().slice(0, 10);
  if (!laNgay(homNay)) throw new Error('--hom-nay phai la ngay that, dang YYYY-MM-DD');
  const choPhepSom = process.argv.includes('--cho-phep-som');

  // Chan ghi vao repo TRUOC khi doc file (bao cao chua so GSC theo truy van, trang)
  const raDir = path.resolve(thamSo('--ra') || path.dirname(path.resolve(fS || fK)));
  if (trongRepo(ROOT, raDir)) throw new Error('Khong ghi bao cao vao trong repo (se thanh trang cong khai tren GitHub Pages). Dung --ra <thu muc ngoai repo>.');

  const quyTac = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/cum-chu-de.json'), 'utf8'));
  const truoc = fT ? docExport(fT, 'Kỳ trước') : null;
  const sau = fS ? docExport(fS, 'Kỳ sau') : null;
  const caKy = fK ? docExport(fK, 'Cả kỳ') : null;

  // Cua so doc lich su git: LUI_TRUOC_KY ngay truoc ky truoc toi het ky sau, va ca file --ca-ky (tuan site sua nhieu
  // trang bi bo khoi phep do dao dong thuong)
  const tuT = truoc ? truoc.tu : congNgay(dot.batDau, -7);
  const moc = [congNgay(tuT, -LUI_TRUOC_KY), caKy && caKy.tu].filter(Boolean).sort();
  const het = [sau && sau.den, caKy && caKy.den, dot.xong ? congNgay(dot.xong, 7) : homNay].filter(Boolean).sort();
  const lichSu = lichSuDoiNoiDung(moc[0], het[het.length - 1]);
  // Danh sach dot dung cho phep do: --xong ghi de phai ap vao; dot tu khai (--bat-dau) cung phai co mat de tuan
  // cua chinh no bi bo khoi dao dong thuong va duoc to tren bieu do (bo muc json trung ngay bat dau).
  const dsDotDung = keyDot ? dsDot.map((d) => (d.key === dot.key ? dot : d)) : [...dsDot.filter((d) => d.batDau !== dot.batDau), dot];

  const kq = phanTichDoiChieu({ truoc, sau, caKy, dot, dsDot: dsDotDung, quyTac, nguong, homNay, lichSu });
  kq.taoLuc = new Date().toISOString();
  kq.xemSom = kq.loiChan.length > 0;
  kq.tep = { truoc: fT && path.basename(fT), sau: fS && path.basename(fS), caKy: fK && path.basename(fK) };

  if (kq.loiChan.length && !choPhepSom) {
    console.error('CHUA DU DIEU KIEN DOI CHIEU:');
    for (const s of kq.loiChan) console.error('  - ' + s);
    console.error('Muon xem som (bao cao ghi "chua ket luan duoc"): them --cho-phep-som');
    process.exit(2);
  }
  fs.mkdirSync(raDir, { recursive: true });
  const ten = `doi-chieu-${dot.key}-${(kq.kyS && kq.kyS.den) || (kq.caKy && kq.caKy.den) || homNay}${kq.xemSom ? '-xem-som' : ''}`;
  fs.writeFileSync(path.join(raDir, ten + '.json'), JSON.stringify(kq, null, 1));
  const { taoHtml } = await import('./doi-chieu-cap-nhat-html.mjs');
  fs.writeFileSync(path.join(raDir, ten + '.html'), taoHtml(kq));

  const KY = { tot: '+', trung: '·', 'canh-bao': '!', xau: 'X' };
  console.log(`${dot.ten} (${dot.batDau} -> ${dot.xong || 'chua xong'})${kq.xemSom ? '  [XEM SOM — chua ket luan duoc]' : ''}`);
  if (kq.kyT) console.log(`Ky truoc ${kq.kyT.tu} -> ${kq.kyT.den}${kq.kyS ? ` | ky sau ${kq.kyS.tu} -> ${kq.kyS.den}` : ''}`);
  for (const s of kq.loiChan) console.log('  [chua dat] ' + s);
  for (const s of kq.canhBao) console.log('  [canh bao] ' + s);
  for (const s of kq.thongTin) console.log('  [ghi chu] ' + s);
  for (const x of kq.ketLuan) console.log(`  ${KY[x.muc] || '·'} ${x.chu}`);
  if (kq.lichSu && kq.lichSu.commits.length) console.log(`  Commit sua trang trong cua so: ${kq.lichSu.commits.length}`);
  console.log('Da ghi', path.join(raDir, ten + '.html'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await chay(); } catch (e) { console.error('LOI: ' + e.message); process.exit(2); }
}
