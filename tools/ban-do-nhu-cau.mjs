#!/usr/bin/env node
/**
 * BAN DO NHU CAU (Demand Map) cho xomleo.vn — doc file export Hieu suat cua Google Search Console,
 * gom truy van thanh cum chu de (tools/cum-chu-de.json) va xep moi cum vao mot o:
 *   Core Market      — nhom dang mang luot nhap, vi tri tot: giu vi tri, nang CTR / chuyen doi
 *   High Opportunity — nhu cau ro (hien thi cao) nhung vi tri / CTR chua theo kip: viec nen giao truoc
 *   Fast Growing     — hien thi tang manh so voi ky truoc: theo doi, don dau
 *   Monitoring       — con lai: quan sat tiep
 * (+ "Nhieu": cum khong phai nhu cau cua quan — near me toan cau, quan khac, ten gan giong.)
 *
 * Y tuong tu bai "Demand Map" (SEO Leader dung GSC lam he thong lang nghe website), lam GON cho
 * site nho: ~1.000 truy van / quy -> gom cum bang quy tac co dinh (khong can LLM, khong gui du lieu
 * ra ngoai), y dinh / bac pheu doc thang tu <html data-dln> cua trang dich (tools/bac-dln.mjs).
 *
 * Cach dung:
 *   node tools/ban-do-nhu-cau.mjs --hien-tai <export.zip|thu-muc> [--truoc <export.zip|thu-muc>] [--ra <thu-muc>]
 *   - Export trong GSC: Hieu suat -> Ket qua tim kiem -> chon khoang ngay -> Xuat -> Tai CSV (file .zip).
 *     Muon co cot "Growth" chuan: xuat THEM mot file cho ky ngay truoc (cung do dai, khong chong lan) va truyen --truoc.
 *   - Mac dinh ghi bao cao canh file --hien-tai (ban-do-nhu-cau-<ngay>.html + .json). KHONG ghi vao repo:
 *     repo nay la site GitHub Pages, file nam trong repo se thanh trang cong khai.
 *
 * GIOI HAN DU LIEU (doc truoc khi ket luan):
 *   - File export chi co 1.000 truy van dau; truy van an danh (Google giau) khong co trong file -> tong hien thi
 *     cua cac cum NHO HON tong cua site (bao cao in ti le phu).
 *   - Export chuan KHONG noi truy van <-> trang. "Trang dich" cua cum la trang site NEN dung cho cum (khai trong
 *     cum-chu-de.json); so lieu trang in kem lay tu file Trang (tong moi truy van cua trang do), chi de tham khao.
 *   - Vi tri trung binh cua cum = trung binh co trong so theo hien thi.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const thamSo = (ten) => { const i = process.argv.indexOf(ten); return i > 0 ? process.argv[i + 1] : null; };

// ---------------- Doc zip (khong can thu vien) ----------------
function docZip(file) {
  const b = fs.readFileSync(file);
  let e = b.length - 22;
  while (e >= 0 && b.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error('Khong phai file zip: ' + file);
  const soMuc = b.readUInt16LE(e + 10);
  let p = b.readUInt32LE(e + 16);
  const out = {};
  for (let k = 0; k < soMuc; k++) {
    if (b.readUInt32LE(p) !== 0x02014b50) throw new Error('Zip hong (central directory)');
    const cachNen = b.readUInt16LE(p + 10);
    const coNen = b.readUInt32LE(p + 20);
    const dTen = b.readUInt16LE(p + 28), dPhu = b.readUInt16LE(p + 30), dCm = b.readUInt16LE(p + 32);
    const local = b.readUInt32LE(p + 42);
    const ten = b.toString('utf8', p + 46, p + 46 + dTen);
    const lTen = b.readUInt16LE(local + 26), lPhu = b.readUInt16LE(local + 28);
    const raw = b.subarray(local + 30 + lTen + lPhu, local + 30 + lTen + lPhu + coNen);
    out[ten] = (cachNen === 8 ? zlib.inflateRawSync(raw) : raw).toString('utf8');
    p += 46 + dTen + dPhu + dCm;
  }
  return out;
}
function docNguon(nguon) {
  if (!nguon) return null;
  if (fs.statSync(nguon).isDirectory()) {
    const out = {};
    for (const f of fs.readdirSync(nguon)) if (f.toLowerCase().endsWith('.csv')) out[f] = fs.readFileSync(path.join(nguon, f), 'utf8');
    return out;
  }
  return docZip(nguon);
}

// ---------------- CSV ----------------
function docCsv(s) {
  s = s.replace(/^﻿/, '');
  const hang = []; let o = '', h = [], q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { o += '"'; i++; } else q = false; } else o += c; continue; }
    if (c === '"') q = true;
    else if (c === ',') { h.push(o); o = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; h.push(o); hang.push(h); h = []; o = ''; }
    else o += c;
  }
  if (o || h.length) { h.push(o); hang.push(h); }
  return hang.filter((r) => r.length > 1 || r[0]);
}
const so = (v) => { if (v == null || v === '') return 0; v = String(v).trim().replace('%', ''); if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, ''); return parseFloat(v.replace(',', '.')) || 0; };

// Tim bang theo tieu de cot dau (ten file trong zip la tieng cua giao dien GSC, khong on dinh)
function timBang(files, mauCotDau) {
  for (const [ten, noiDung] of Object.entries(files)) {
    const r = docCsv(noiDung);
    if (r.length && mauCotDau.test(r[0][0])) return { ten, hang: r };
  }
  return null;
}
// Bang chi so: cot dau = khoa; cac cot con lai = nhap/hien thi/CTR/vi tri. Export che do SO SANH co 2 bo cot
// (ky nay + ky truoc) -> tach ra theo chu "truoc / previous" trong tieu de.
function docBangChiSo(bang) {
  const td = bang.hang[0];
  const loai = (t) => (/nh[aấ]p|click/i.test(t) ? 'c' : /hi[eể]n th[iị]|impression/i.test(t) ? 'i' : /ctr/i.test(t) ? 'ctr' : /v[iị] tr[ií]|position/i.test(t) ? 'p' : null);
  const laTruoc = (t) => /tr[uư][oớ]c|previous|prior|earlier/i.test(t);
  const cot = { nay: {}, truoc: {} };
  td.forEach((t, i) => { if (i === 0) return; const l = loai(t); if (!l) return; (laTruoc(t) && td.filter((x) => loai(x) === l).length > 1 ? cot.truoc : cot.nay)[l] = i; });
  const coTruoc = Object.keys(cot.truoc).length >= 2;
  const nay = new Map(), truoc = new Map();
  for (const r of bang.hang.slice(1)) {
    const k = r[0];
    nay.set(k, { c: so(r[cot.nay.c]), i: so(r[cot.nay.i]), p: so(r[cot.nay.p]) });
    if (coTruoc) truoc.set(k, { c: so(r[cot.truoc.c]), i: so(r[cot.truoc.i]), p: so(r[cot.truoc.p]) });
  }
  return { nay, truoc: coTruoc ? truoc : null };
}

// ---------------- Chuan hoa truy van ----------------
const boDau = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();

// ---------------- Bac DLN cua trang dich (doc <html data-dln>) ----------------
const TEN_BAC = { '1-orient': 'O · Định hướng', '2-choose': 'C · Chọn', '3-prove': 'P · Kiểm chứng', '4-rate': 'R · Đánh giá', '5-act': 'A · Hành động', hub: 'Trang tổng', legal: 'Pháp lý' };
function bacCua(url) {
  if (!url) return null;
  const f = path.join(ROOT, url.replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(f)) return { tonTai: false };
  const h = fs.readFileSync(f, 'utf8');
  const m = h.slice(0, 4000).match(/<html\b[^>]*\sdata-dln="([^"]+)"/);
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  return { tonTai: true, bac: m ? m[1] : null, tenBac: m ? (TEN_BAC[m[1]] || m[1]) : 'chưa khai', title };
}
// Truy van >= 5 chu ma >= 80% so chu nam trong tieu de trang dich = lap nguyen tieu de bai (kieu may tu tim)
function lapTieuDe(q, title) {
  if (!title) return false;
  const tu = boDau(q.replace(/"/g, ' ')).split(/[^a-z0-9]+/).filter((w) => w.length > 1);
  if (tu.length < 5) return false;
  const td = new Set(boDau(title).split(/[^a-z0-9]+/));
  return tu.filter((w) => td.has(w)).length / tu.length >= 0.8;
}

// ---------------- Ngon ngu truy van + trang EN tuong ung ----------------
// Co dau tieng Viet -> vi. Khong dau ma co tu tieng Anh pho bien -> en. Con lai (go khong dau) -> vi.
const TU_ANH = /\b(the|of|in|near|best|shop|shops|coffee|cafes?|restaurants?|square|palace|pagoda|lake|hill|garden|field|breakfast|view|places?|things|what|where|how|price|ticket|official|symbol|basement|shopping|entertainment|cable|car|waterfall|tunnel|night|market|church|valley)\b/i;
const laTiengAnh = (q) => !/[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i.test(q) && TU_ANH.test(q);
const DICH_EN = { '/': '/en/', '/menu/': '/menu-en/', '/about/': '/about-en/', '/duong-di/': '/en/directions/', '/blog/': '/blog-en/' };
const banEn = (url) => (url ? DICH_EN[url] || url.replace(/\/$/, '-en/') : null);

// ---------------- CTR ky vong theo vi tri ----------------
function ctrKyVong(duong, vt) {
  const moc = Object.keys(duong).filter((k) => /^\d+$/.test(k)).map(Number).sort((a, b) => a - b);
  if (vt <= moc[0]) return duong[moc[0]];
  for (let i = 1; i < moc.length; i++) {
    if (vt <= moc[i]) { const a = moc[i - 1], b = moc[i]; return duong[a] + (duong[b] - duong[a]) * (vt - a) / (b - a); }
  }
  return duong[moc[moc.length - 1]];
}

// ---------------- Phan tich ----------------
export function phanTich(filesNay, filesTruoc, quyTac) {
  const bQ = timBang(filesNay, /truy v[aấ]n|quer/i);
  if (!bQ) throw new Error('Khong thay bang truy van trong file export (cot dau "Truy vấn phổ biến nhất" / "Top queries")');
  const q = docBangChiSo(bQ);
  let qTruoc = q.truoc;
  if (!qTruoc && filesTruoc) { const b2 = timBang(filesTruoc, /truy v[aấ]n|quer/i); if (b2) qTruoc = docBangChiSo(b2).nay; }
  const bNgay = timBang(filesNay, /^(ng[aà]y|date)$/i);
  const bTrang = timBang(filesNay, /trang|page/i);
  const bLoc = timBang(filesNay, /b[oộ] l[oọ]c|filter/i);

  // Tong cua site (file Ngay = moi truy van, ke ca an danh)
  let tongSite = null, khoangNgay = null;
  if (bNgay) {
    const d = docBangChiSo(bNgay).nay; let c = 0, i = 0; const ds = [...d.keys()].sort();
    for (const v of d.values()) { c += v.c; i += v.i; }
    tongSite = { c, i }; khoangNgay = [ds[0], ds[ds.length - 1]];
  }
  let khoangTruoc = null;
  if (filesTruoc) { const b = timBang(filesTruoc, /^(ng[aà]y|date)$/i); if (b) { const ds = [...docBangChiSo(b).nay.keys()].sort(); khoangTruoc = [ds[0], ds[ds.length - 1]]; } }
  const loc = bLoc ? bLoc.hang.slice(1).map((r) => r.join(': ')) : [];

  // So lieu trang (gop bien the co/khong gach cuoi, bo #muc)
  const trang = new Map();
  if (bTrang) for (const [u, v] of docBangChiSo(bTrang).nay) {
    let k = u.replace(/^https?:\/\/(www\.)?xomleo\.vn/i, '').split('#')[0].split('?')[0] || '/';
    if (!k.endsWith('/') && !/\.[a-z]{2,5}$/i.test(k)) k += '/';
    const t = trang.get(k) || { c: 0, i: 0, pi: 0 }; t.c += v.c; t.i += v.i; t.pi += v.p * v.i; trang.set(k, t);
  }

  // Gom cum
  const TH = quyTac.thuongHieu;
  const cumQ = quyTac.cum.map((c) => ({
    ...c,
    re: new RegExp(c.mau.replace(/\{TH\}/g, TH), 'i'),
    canCoRe: c.canCo ? new RegExp(c.canCo, 'i') : null,
    truRe: c.truKhi ? new RegExp(c.truKhi, 'i') : null,
    ds: [],
  }));
  const chuaPhan = [];
  const ganCum = (truyVan) => { const n = boDau(truyVan); for (const c of cumQ) if (c.re.test(n) && (!c.canCoRe || c.canCoRe.test(n)) && (!c.truRe || !c.truRe.test(n))) return c; return null; };
  for (const [tv, v] of q.nay) {
    const c = ganCum(tv);
    const truoc = qTruoc ? qTruoc.get(tv) : null;
    const dong = { q: tv, ...v, iTruoc: truoc ? truoc.i : 0, cTruoc: truoc ? truoc.c : 0 };
    if (c) c.ds.push(dong); else chuaPhan.push(dong);
  }
  // Truy van chi co o ky truoc (bien mat ky nay) cung tinh vao cum de do Growth
  const chiTruoc = new Map();
  if (qTruoc) for (const [tv, v] of qTruoc) if (!q.nay.has(tv)) { const c = ganCum(tv); if (c) chiTruoc.set(c.key, (chiTruoc.get(c.key) || 0) + v.i); }

  const ng = quyTac.nguong, duong = quyTac.duongCtr;
  const cum = cumQ.filter((c) => c.ds.length).map((c) => {
    const i = c.ds.reduce((s, x) => s + x.i, 0), cl = c.ds.reduce((s, x) => s + x.c, 0);
    const p = c.ds.reduce((s, x) => s + x.p * x.i, 0) / (i || 1);
    const iTruoc = qTruoc ? c.ds.reduce((s, x) => s + x.iTruoc, 0) + (chiTruoc.get(c.key) || 0) : null;
    const tiLeAnh = c.ds.filter((x) => laTiengAnh(x.q)).reduce((s, x) => s + x.i, 0) / (i || 1);
    // Truy van co dau ngoac kep / lap nguyen tieu de bai: kieu cua cong cu theo doi thu hang hoac AI tu tim,
    // hiem khi la khach. Ti le cao -> khong xep vao co hoi.
    const dich = c.dich && tiLeAnh > 0.5 ? banEn(c.dich) : c.dich;
    const bac = bacCua(dich);
    // Nghi tu dong: co ngoac kep, HOAC lap nguyen tieu de (>= 7 chu) o trang 1 ma 0 luot nhap — nguoi that thay
    // dung bai minh go o top 10 thi thinh thoang phai bam. KHONG dung "lap tieu de" mot minh: "quán nướng đà lạt
    // view xe lửa" trung tieu de bai nhung la khach that (27 nhap, CTR 23%) — da bat nham luc thu 12-10-2026.
    const nghi = (x) => x.q.includes('"') || (x.c === 0 && x.p <= 10 && x.q.split(/\s+/).length >= 7 && lapTieuDe(x.q, bac && bac.title));
    const tiLeNgoac = c.ds.filter(nghi).reduce((s, x) => s + x.i, 0) / (i || 1);
    const t = dich ? trang.get(dich) : null;
    return {
      key: c.key, ten: c.ten, loai: c.loai, ngoaiPhamVi: !!c.ngoaiPhamVi, dich, dichVi: c.dich,
      bac, trangDich: t ? { c: t.c, i: t.i, p: +(t.pi / (t.i || 1)).toFixed(1) } : null,
      i, c: cl, ctr: i ? cl / i : 0, p: +p.toFixed(1), soTruyVan: c.ds.length,
      tiLeAnh: +tiLeAnh.toFixed(2), tiLeNgoac: +tiLeNgoac.toFixed(2),
      iTruoc, tang: iTruoc ? (i - iTruoc) / iTruoc : null,
      top: c.ds.sort((a, b) => b.i - a.i).slice(0, 8).map((x) => ({ q: x.q, i: x.i, c: x.c, p: x.p, iTruoc: x.iTruoc })),
    };
  });

  // Xep loai (tinh tren tong khong ke nhieu)
  const that = cum.filter((c) => c.loai !== 'nhieu');
  const tongI = that.reduce((s, c) => s + c.i, 0), tongC = that.reduce((s, c) => s + c.c, 0);
  for (const c of cum) {
    if (c.loai === 'nhieu') { c.o = 'nhieu'; continue; }
    const kyVong = ctrKyVong(duong, c.p);
    c.ctrKyVong = kyVong;
    // Tiem nang = them bao nhieu luot nhap neu len vi tri muc tieu THUC TE trong mot quy: dang o trang 1-2 thi
    // nham top 3; vi tri 20-50 thi nham cuoi trang 1 (10); xa hon nua thi nham trang 2 (20).
    const mucTieu = c.p <= 20 ? Math.min(c.p, ng.viTriMucTieu) : c.p <= 50 ? 10 : 20;
    const ctrMucTieu = Math.max(ctrKyVong(duong, mucTieu), kyVong);
    c.viTriMucTieu = +mucTieu.toFixed(1);
    c.nhapTiemNang = c.loai === 'thuong-hieu' || c.ngoaiPhamVi ? 0 : Math.max(0, Math.round(c.i * ctrMucTieu - c.c));
    // Diem uu tien = luot nhap tiem nang x trong so kinh doanh (khach dat ban > khach doc bai diem tham quan)
    c.trongSo = (ng.trongSo && ng.trongSo[c.loai]) ?? 1;
    c.diem = Math.round(c.nhapTiemNang * c.trongSo);
    c.nghiTuDong = c.tiLeNgoac >= 0.5;
    const core = c.c >= tongC * ng.coreTiLeNhap && c.p <= ng.coreViTriToiDa;
    const coHoi = !c.ngoaiPhamVi && !c.nghiTuDong && c.loai !== 'thuong-hieu' && c.key !== 'hoi-thoai-ai'
      && c.i >= Math.max(ng.coHoiHienThiToiThieu, tongI * ng.coHoiTiLeHienThi)
      && (c.p > ng.coHoiViTriTu || c.ctr < kyVong * ng.coHoiCtrSoVoiKyVong) && c.nhapTiemNang >= ng.coHoiNhapTiemNangToiThieu;
    const tangNhanh = !c.nghiTuDong && c.tang != null && c.tang >= ng.tangNhanhTiLe && c.i >= ng.tangNhanhHienThiToiThieu;
    c.o = core ? 'core' : coHoi ? 'co-hoi' : tangNhanh ? 'tang-nhanh' : 'theo-doi';
  }

  // Opportunity Center
  const viec = [];
  for (const c of cum) {
    if (c.o === 'nhieu' || c.ngoaiPhamVi) continue;
    const coTrang = c.bac && c.bac.tonTai;
    let loaiViec = null, lyDo = '';
    if (c.key === 'hoi-thoai-ai') {
      loaiViec = 'theo-doi-ai';
      lyDo = `${c.soTruyVan} câu hỏi nối tiếp kiểu hội thoại ("có", "menu", "giá", "cho mình vị trí"…) ở vị trí TB ${c.p}: dấu hiệu trang được AI Mode của Google dùng để trả lời. Giữ giá, giờ mở cửa, địa chỉ dạng chữ thường (không chỉ trong ảnh) và khớp nhau giữa các trang.`;
    } else if (c.nghiTuDong) {
      loaiViec = null;
    } else if (c.loai === 'thuong-hieu' && c.p <= 3 && c.ctr < ctrKyVong(duong, c.p) * 0.5 && c.i >= 200) {
      loaiViec = 'kiem-tra-ctr-thuong-hieu';
      lyDo = `Tên quán ở vị trí ${c.p} nhưng CTR ${(c.ctr * 100).toFixed(1)}% — phần lớn khách bấm thẳng vào Hồ sơ Google (Maps: Gọi, Chỉ đường) chứ không vào web. Không phải lỗi web; theo dõi lượt gọi/chỉ đường trong Hồ sơ doanh nghiệp.`;
    } else if (c.o === 'co-hoi' && !coTrang) {
      loaiViec = 'viet-trang-moi'; lyDo = 'Có nhu cầu nhưng site chưa có trang phục vụ cụm này.';
    } else if (c.o === 'co-hoi' && c.p > 8) {
      loaiViec = 'day-len-trang-1'; lyDo = `Vị trí TB ${c.p} (trang 2): củng cố trang đích + thêm liên kết nội bộ có chữ neo mô tả từ các bài cùng cụm.`;
    } else if (c.o === 'co-hoi') {
      loaiViec = 'tang-ctr'; lyDo = `Đã ở trang 1 (vị trí ${c.p}) nhưng CTR ${(c.ctr * 100).toFixed(1)}% < kỳ vọng ~${(ctrKyVong(duong, c.p) * 100).toFixed(1)}%: viết lại title / mô tả cho khớp truy vấn.`;
    } else if (c.o === 'tang-nhanh') {
      loaiViec = 'don-dau'; lyDo = `Hiển thị tăng ${Math.round(c.tang * 100)}% so với kỳ trước: kiểm trang đích còn đúng ý định, bổ sung nội dung trước khi đối thủ chiếm.`;
    } else if (c.o === 'core' && c.loai !== 'thuong-hieu') {
      loaiViec = 'bao-ve'; lyDo = 'Cụm đang mang lượt nhấp: giữ trang đích cập nhật, không đổi URL/tiêu đề tuỳ tiện.';
    }
    if (loaiViec) viec.push({ key: c.key, ten: c.ten, o: c.o, loai: c.loai, loaiViec, lyDo, nhapTiemNang: c.nhapTiemNang, diem: c.diem, viTriMucTieu: c.viTriMucTieu, i: c.i, c: c.c, ctr: c.ctr, p: c.p, dich: c.dich, bac: c.bac, top: c.top.slice(0, 5) });
  }
  const UU_TIEN = { 'viet-trang-moi': 0, 'day-len-trang-1': 1, 'tang-ctr': 2, 'don-dau': 3, 'theo-doi-ai': 4, 'bao-ve': 5, 'kiem-tra-ctr-thuong-hieu': 6 };
  viec.sort((a, b) => b.diem - a.diem || UU_TIEN[a.loaiViec] - UU_TIEN[b.loaiViec] || b.i - a.i);
  // Hai ky co chong ngay khong? (Growth khi do chi la xu huong tham khao)
  let chongNgay = 0;
  if (khoangNgay && khoangTruoc && khoangTruoc[1] >= khoangNgay[0]) chongNgay = Math.round((new Date(khoangTruoc[1]) - new Date(khoangNgay[0])) / 864e5) + 1;

  const tongFileI = [...q.nay.values()].reduce((s, v) => s + v.i, 0), tongFileC = [...q.nay.values()].reduce((s, v) => s + v.c, 0);
  return {
    taoLuc: new Date().toISOString(), khoangNgay, khoangTruoc, chongNgay, loc, coKyTruoc: !!qTruoc,
    tongSite, tongFile: { i: tongFileI, c: tongFileC, soTruyVan: q.nay.size },
    tongThat: { i: tongI, c: tongC },
    cum: cum.sort((a, b) => b.i - a.i), viec,
    chuaPhan: chuaPhan.sort((a, b) => b.i - a.i).slice(0, 40), soChuaPhan: chuaPhan.length,
    hienThiChuaPhan: chuaPhan.reduce((s, x) => s + x.i, 0),
  };
}

// ---------------- Chay tu dong lenh ----------------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const nay = thamSo('--hien-tai');
  if (!nay) { console.error('Thieu --hien-tai <file export .zip hoac thu muc CSV>'); process.exit(2); }
  const truoc = thamSo('--truoc');
  const quyTac = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/cum-chu-de.json'), 'utf8'));
  const kq = phanTich(docNguon(nay), docNguon(truoc), quyTac);
  const raDir = path.resolve(thamSo('--ra') || path.dirname(path.resolve(nay)));
  if ((raDir + path.sep).startsWith(ROOT + path.sep) || raDir === ROOT) {
    console.error('Khong ghi bao cao vao trong repo (se thanh trang cong khai tren GitHub Pages). Dung --ra <thu muc ngoai repo>.');
    process.exit(2);
  }
  const ten = 'ban-do-nhu-cau-' + (kq.khoangNgay ? kq.khoangNgay[1] : new Date().toISOString().slice(0, 10));
  fs.writeFileSync(path.join(raDir, ten + '.json'), JSON.stringify(kq, null, 1));
  const { taoHtml } = await import('./ban-do-nhu-cau-html.mjs');
  const noiDung = taoHtml(kq); // phan than trang (khong doctype/head) — dang len artifact duoc nguyen ban
  const iMain = noiDung.indexOf('<main');
  fs.writeFileSync(path.join(raDir, ten + '.html'), '<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + noiDung.slice(0, iMain) + '</head>\n<body>\n' + noiDung.slice(iMain) + '</body>\n</html>\n');
  if (process.argv.includes('--than-trang')) fs.writeFileSync(path.join(raDir, ten + '.than.html'), noiDung);
  const O = { core: 'Core', 'co-hoi': 'Cơ hội', 'tang-nhanh': 'Tăng nhanh', 'theo-doi': 'Theo dõi', nhieu: 'Nhiễu' };
  console.log(`Ky ${kq.khoangNgay?.join(' -> ')} | site ${kq.tongSite?.c} nhap / ${kq.tongSite?.i} hien thi | file ${kq.tongFile.soTruyVan} truy van ${kq.tongFile.i} hien thi`);
  for (const c of kq.cum) console.log(`${(O[c.o] || c.o).padEnd(10)} ${String(c.i).padStart(6)} ht ${String(c.c).padStart(4)} nhap  vt ${String(c.p).padStart(5)}  ${c.tang == null ? '      ' : ((c.tang >= 0 ? '+' : '') + Math.round(c.tang * 100) + '%').padStart(6)}  ${c.ten}`);
  console.log(`Chua phan cum: ${kq.soChuaPhan} truy van / ${kq.hienThiChuaPhan} hien thi`);
  console.log('Viec (Opportunity Center):'); for (const v of kq.viec) console.log(`  diem ${v.diem} (+${v.nhapTiemNang} nhap neu len vt ${v.viTriMucTieu}) | ${v.loaiViec} | ${v.ten} -> ${v.dich}`);
  console.log('Da ghi', path.join(raDir, ten + '.html'));
}
