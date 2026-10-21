// Tách một trang HTML tiếng Việt thành các "đoạn" cần dịch, kèm vị trí trong mã nguồn để
// tools/dich/dung.mjs ghép bản dịch trở lại mà KHÔNG đụng tới phần còn lại (CSS nhúng, script,
// thuộc tính, khoảng trắng giữ nguyên từng byte). Tách và ghép dùng chung file này — đổi luật
// tách ở đây là đổi id của đoạn, bản dịch cũ trong kho sẽ thành "thiếu".
//
// Một đoạn chữ = một dải liên tiếp gồm chữ + thẻ nội dòng (a, strong, span, br, img…) nằm giữa
// hai thẻ khối. Thẻ nội dòng được thay bằng mã <a1>…</a1>, <br2/> để người dịch đảo được thứ tự
// từ mà không chạm vào thuộc tính; lúc ghép, mã được đổi lại thành đúng thẻ gốc.
import crypto from 'node:crypto';
import { parse } from './html.mjs';

// Thẻ nội dòng có cặp mở/đóng: chữ bên trong được dịch cùng câu chứa nó.
const NOI_DONG = new Set(('a abbr b bdi bdo cite data del dfn em i ins kbd label mark q s samp small span strong sub sup time u var button output').split(' '));
// Thẻ nội dòng "đặc": giữ nguyên cả khối (kể cả bên trong), người dịch chỉ thấy <img3/>.
const DAC = new Set(('br wbr img picture svg input video audio iframe canvas math object embed meter progress').split(' '));
// Không bao giờ dịch bên trong.
const BO_QUA = new Set(('script style template textarea code pre iframe object svg math').split(' '));

// Thuộc tính chứa chữ người đọc thấy / trình đọc màn hình đọc.
export const THUOC_TINH_DICH = new Set(['alt', 'title', 'aria-label', 'placeholder', 'data-nhung-title', 'data-alt', 'data-sec', 'data-fb-word', 'data-category', 'data-tooltip', 'aria-description', 'aria-roledescription', 'label']);
export const META_DICH = new Set(['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description', 'og:image:alt', 'twitter:image:alt']);

const CO_CHU = /\p{L}/u;
const KHOANG_TRANG = /[\t\n\f\r ]+/g;
// Giá kiểu "209.000đ", "250k" không có chữ nào để dịch.
const coChuThat = (s) => CO_CHU.test(s.replace(/\d[\d.,]*\s?(?:đ|K|k|VND|VNĐ)(?!\p{L})/gu, ''));

export const maDoan = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
export const chuanKhoangTrang = (s) => s.replace(KHOANG_TRANG, ' ').trim();
export const boMa = (s) => chuanKhoangTrang(s.replace(/<\/?[a-z][a-z0-9]*?\d+\/?>/g, (m) => (/^<br\d+\/>$/.test(m) ? ' ' : '')));

const ten = (n) => n.tagName || n.nodeName;
const laPhanTu = (n) => !!n.tagName;
const tt = (n, ten) => (n.attrs || []).find((a) => a.name === ten)?.value;

// Khối không dịch gì cả, kể cả thuộc tính: translate="no" và bộ chọn ngôn ngữ (dung.mjs thay
// nguyên khối bộ chọn bằng bản dựng riêng cho từng trang).
export function laBoChon(n) {
  return /(^|\s)(lang-switcher|chon-ngon-ngu|cnn-luoi)(\s|$)/.test(tt(n, 'class') || '');
}
function camHan(n) {
  return laPhanTu(n) && (tt(n, 'translate') === 'no' || laBoChon(n));
}
function boQua(n) {
  if (!laPhanTu(n)) return false;
  return BO_QUA.has(ten(n)) || camHan(n);
}

// Phần tử nội dòng mà cả cây con cũng nội dòng (hoặc đặc).
const thuanCache = new WeakMap();
function thuanNoiDong(n) {
  if (!laPhanTu(n)) return true;
  if (thuanCache.has(n)) return thuanCache.get(n);
  const t = ten(n);
  let ok;
  if (DAC.has(t)) ok = true;
  else if (!NOI_DONG.has(t) || boQua(n)) ok = false;
  else ok = (n.childNodes || []).every((c) => c.nodeName === '#comment' || !laPhanTu(c) ? true : thuanNoiDong(c));
  thuanCache.set(n, ok);
  return ok;
}

function coChu(n) {
  if (n.nodeName === '#text') return CO_CHU.test(n.value);
  if (!laPhanTu(n) || DAC.has(ten(n))) return false;
  return (n.childNodes || []).some(coChu);
}

const viTri = (n) => n.sourceCodeLocation;
const batDau = (n) => viTri(n)?.startOffset;
const ketThuc = (n) => viTri(n)?.endOffset;

// Dựng chuỗi có mã từ một dãy nút; ghi lại thẻ gốc của từng mã.
function dungChuoi(nodes, the) {
  let s = '';
  for (const n of nodes) {
    if (n.nodeName === '#text') s += n.value;
    else if (n.nodeName === '#comment') continue;
    else if (laPhanTu(n)) {
      const i = the.length + 1;
      const t = ten(n);
      const loc = viTri(n);
      if (DAC.has(t) || !loc?.startTag) {
        the.push({ i, ten: t, dac: true, node: n, bd: loc.startOffset, kt: loc.endOffset });
        s += `<${t}${i}/>`;
      } else {
        const muc = { i, ten: t, dac: false, node: n, bd: loc.startOffset, kt: loc.endOffset, the: [loc.startTag.startOffset, loc.startTag.endOffset], dong: loc.endTag ? `</${t}>` : '' };
        the.push(muc);
        s += `<${t}${i}>` + dungChuoi(n.childNodes || [], the) + `</${t}${i}>`;
      }
    }
  }
  return s;
}

function taoDoanChu(nodes, src, ds) {
  // Bóc lớp: dải chỉ gồm MỘT thẻ nội dòng bọc hết chữ → dịch phần bên trong cho gọn.
  for (;;) {
    const that = nodes.filter((n) => !(n.nodeName === '#text' && !n.value.trim()) && n.nodeName !== '#comment');
    if (that.length === 1 && laPhanTu(that[0]) && NOI_DONG.has(ten(that[0])) && viTri(that[0])?.startTag && viTri(that[0])?.endTag) {
      nodes = that[0].childNodes || [];
      continue;
    }
    break;
  }
  if (!nodes.some(coChu)) return;
  const the = [];
  const tho = dungChuoi(nodes, the);
  const nguon = chuanKhoangTrang(tho);
  if (!coChuThat(boMa(nguon))) return;
  // Vùng thay = từ ký tự không trắng đầu tiên tới ký tự không trắng cuối cùng của dải.
  let dau = nodes.find((n) => n.nodeName !== '#comment' && !(n.nodeName === '#text' && !n.value.trim()));
  let cuoi = [...nodes].reverse().find((n) => n.nodeName !== '#comment' && !(n.nodeName === '#text' && !n.value.trim()));
  let bd = batDau(dau), kt = ketThuc(cuoi);
  if (dau.nodeName === '#text') { const m = /^[\t\n\f\r ]*/.exec(src.slice(bd, kt)); bd += m[0].length; }
  if (cuoi.nodeName === '#text') { const m = /[\t\n\f\r ]*$/.exec(src.slice(bd, kt)); kt -= m[0].length; }
  ds.push({ loai: 'chu', id: maDoan(nguon), nguon, bd, kt, the });
}

function duyetKhoi(el, src, ds) {
  let dai = [];
  const xa = () => { if (dai.length) taoDoanChu(dai, src, ds); dai = []; };
  const con = el.nodeName === 'template' ? [] : (el.childNodes || []);
  for (const c of con) {
    if (c.nodeName === '#text' || c.nodeName === '#comment') { dai.push(c); continue; }
    if (!laPhanTu(c)) continue;
    if (boQua(c) && !DAC.has(ten(c))) { xa(); continue; }
    if (thuanNoiDong(c) && viTri(c)) { dai.push(c); continue; }
    xa();
    duyetKhoi(c, src, ds);
  }
  xa();
}

function duyetThuocTinh(n, ds) {
  if (laPhanTu(n)) {
    if (ten(n) === 'script' || ten(n) === 'style' || ten(n) === 'template' || camHan(n)) return;
    const loc = viTri(n)?.startTag?.attrs || {};
    for (const a of n.attrs || []) {
      let dich = THUOC_TINH_DICH.has(a.name);
      if (a.name === 'content' && ten(n) === 'meta') dich = META_DICH.has(tt(n, 'name') || tt(n, 'property') || '');
      if (a.name === 'label' && ten(n) !== 'optgroup' && ten(n) !== 'track') dich = false;
      if (!dich || !loc[a.name]) continue;
      const nguon = chuanKhoangTrang(a.value);
      if (!coChuThat(nguon) || /^(https?:|mailto:|tel:|\/)/.test(nguon)) continue;
      ds.push({ loai: 'tt', id: maDoan(nguon), nguon, ten: a.name, node: n, bd: loc[a.name].startOffset, kt: loc[a.name].endOffset });
    }
  }
  for (const c of n.childNodes || []) duyetThuocTinh(c, ds);
  if (n.content) duyetThuocTinh(n.content, ds);
}

// ---------- JSON-LD ----------
// Khoá có chữ cần dịch. Tên quán, địa chỉ bưu chính, URL, ngày giờ… giữ nguyên.
export const KHOA_LD_DICH = new Set(['name', 'description', 'headline', 'alternativeHeadline', 'text', 'caption', 'abstract', 'articleSection', 'keywords', 'jobTitle', 'servesCuisine', 'disambiguatingDescription', 'slogan', 'about', 'category', 'knowsAbout', 'educationalLevel', 'award', 'termsOfService', 'genre', 'recipeCategory', 'recipeCuisine', 'menuAddOn']);
// Chuỗi đúng bằng một trong các tên riêng này thì không gửi đi dịch.
export const GIU_NGUYEN = new Set(['Tiệm Nướng & Chill Xóm Lèo', 'Tiệm Nướng & Chill Xóm Lèo - Đà Lạt', 'Xóm Lèo', 'Xóm Lèo Đà Lạt', 'Trạm Dừng Chill', 'Vietnamese BBQ']);

export function chuoiLd(obj, cb, khoa = '', cha = null) {
  if (typeof obj === 'string') { cb(obj, khoa, cha); return; }
  if (Array.isArray(obj)) { obj.forEach((v) => chuoiLd(v, cb, khoa, cha)); return; }
  if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) chuoiLd(v, cb, k, obj);
}

export const nenDichLd = (s, khoa) => KHOA_LD_DICH.has(khoa) && CO_CHU.test(s) && !GIU_NGUYEN.has(s.trim()) && !/^https?:/.test(s);

// ---------- JSON-LD lấy chữ từ đoạn hiển thị ----------
// FAQ trong JSON-LD phải khớp từng chữ với chữ hiển thị (tools/kiem-schema.mjs, luật "faq-an"). Bản
// Việt hay viết "❓ Câu hỏi?<br> → Trả lời" trong MỘT đoạn, hoặc câu trả lời hiển thị dài hơn bản
// JSON-LD một câu "Xem thêm …". Nên chuỗi JSON-LD được lấy từ PHẦN tương ứng của bản dịch đoạn hiển thị:
// cả đoạn, một khúc giữa hai <brN/>, hoặc nội dung một cặp mã <spanN>…</spanN>.
const RE_MA_DON = /<[a-z][a-z0-9]*?\d+\/>|<\/?[a-z][a-z0-9]*?\d+>/g;
// Bỏ ký hiệu trang trí ở hai đầu ("❓ ", "→ ", "+" của nút mở FAQ) — KHÔNG bỏ ngoặc/nháy của câu.
const sach = (s) => boMa(s).replace(/^[\s\p{Extended_Pictographic}️→•·+\-–—]+/u, '').replace(/[\s\p{Extended_Pictographic}️→•·+\-–—]+$/u, '').trim();
function khuc(s, a, b) {
  let tu = a ? s.indexOf(a) : 0;
  if (tu < 0) return null;
  if (a) tu += a.length;
  const den = b ? s.indexOf(b, tu) : s.length;
  return den < 0 ? null : s.slice(tu, den);
}
function trongCap(s, ma) {
  const a = s.indexOf(`<${ma}>`), b = s.indexOf(`</${ma}>`);
  return a < 0 || b < a ? null : s.slice(a + ma.length + 2, b);
}
export function layPhan(s, k) {
  if (k[0] === 'ca') return s;
  if (k[0] === 'br') return khuc(s, k[1], k[2]);
  return trongCap(s, k[1]);
}
function ungVien(nguon) {
  const ds = [['ca']];
  const brs = (nguon.match(/<br\d+\/>/g) || []);
  if (brs.length) { const moc = [null, ...brs, null]; for (let i = 0; i < moc.length - 1; i++) ds.push(['br', moc[i], moc[i + 1]]); }
  for (const m of nguon.matchAll(/<([a-z][a-z0-9]*?\d+)>/g)) ds.push(['the', m[1]]);
  return ds;
}
// Trả về hàm tra(chuỗiViệt) → { id, k } | null cho các đoạn chữ của MỘT trang.
export function taoTraLd(doanTrang) {
  const dung = new Map(), dau = [];
  for (const d of doanTrang) {
    if (d.loai !== 'chu') continue;
    for (const k of ungVien(d.nguon)) {
      const p = layPhan(d.nguon, k);
      if (p == null) continue;
      // Chữ hiển thị hay có &nbsp; (số điện thoại "0764 527 336"), JSON-LD thì dấu cách thường.
      const vi = sach(p).replace(/ /g, ' ');
      if (!vi) continue;
      if (!dung.has(vi)) dung.set(vi, { id: d.id, k });
      dau.push({ vi, id: d.id, k });
    }
  }
  return (s) => {
    const c = chuanKhoangTrang(s.replace(/ /g, ' '));
    if (dung.has(c)) return dung.get(c);
    // Câu trả lời JSON-LD là phần ĐẦU của đoạn hiển thị (đoạn có thêm câu "Xem thêm …") → lấy cả
    // phần đó: JSON-LD dài hơn bản Việt một câu nhưng vẫn khớp chữ hiển thị.
    const x = c.length >= 40 && dau.find((u) => u.vi.startsWith(c) && c.length >= 0.4 * u.vi.length && /^\s/.test(u.vi.slice(c.length)));
    return x ? { id: x.id, k: x.k } : null;
  };
}
// Chuỗi JSON-LD dịch từ bản dịch đoạn hiển thị (null nếu bản dịch lệch mã, không cắt được).
export function dichTuDoan(banDich, k) {
  const p = layPhan(banDich, k);
  return p == null ? null : sach(p);
}

// ---------- chuỗi trong script nội tuyến ----------
const DAU_VIET = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
export function chuoiScript(src, bd, kt) {
  const ds = [];
  const ma = src.slice(bd, kt);
  const re = /'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
  let m;
  while ((m = re.exec(ma))) {
    const noi = m[1] ?? m[2];
    if (!DAU_VIET.test(noi)) continue;
    const bien = [];
    const nguon = noi.replace(/\$\{([^}]*)\}/g, (_, x) => { bien.push(x); return `{${bien.length - 1}}`; });
    ds.push({ loai: 'js', id: maDoan(nguon), nguon, bien, mo: m[0][0], bd: bd + m.index + 1, kt: bd + m.index + m[0].length - 1 });
  }
  return ds;
}

export function tachTrang(src) {
  const doc = parse(src, { sourceCodeLocationInfo: true, scriptingEnabled: false });
  const ds = [];
  const html = doc.childNodes.find((n) => n.nodeName === 'html');
  duyetKhoi(html, src, ds);
  duyetThuocTinh(html, ds);
  const ld = [];
  const sc = [];
  (function tim(n) {
    if (n.nodeName === 'script') {
      const loc = viTri(n);
      const c = n.childNodes?.[0];
      if (c && loc?.startTag && loc?.endTag) {
        const bd = loc.startTag.endOffset, kt = loc.endTag.startOffset;
        if (tt(n, 'type') === 'application/ld+json') ld.push({ bd, kt, json: c.value });
        else if (!tt(n, 'src')) sc.push(...chuoiScript(src, bd, kt));
      }
      return;
    }
    for (const c of n.childNodes || []) tim(c);
    if (n.content) tim(n.content);
  })(html);
  return { doc, html, src, doan: ds, ld, js: sc };
}
