// Dựng các trang /zh/ /ko/ /ja/ /ru/ /th/ từ trang tiếng Việt + kho bản dịch tools/dich/kho/<ma>.json,
// rồi cập nhật bộ chọn ngôn ngữ, hreflang, og:locale:alternate của trang Việt/Anh và sitemap.xml.
//   node tools/dich/dung.mjs              dựng đủ (trang thiếu bản dịch thì bỏ qua và báo)
//   node tools/dich/dung.mjs --kiem       chỉ báo độ phủ bản dịch từng trang, không ghi gì
//   node tools/dich/dung.mjs --ma zh      chỉ một/vài thứ tiếng (vẫn cập nhật trang gốc theo những gì có trên đĩa)
// Trang dịch được dựng lại TOÀN BỘ từ bản Việt mỗi lần chạy — đừng sửa tay trong /zh/… ; sửa bản Việt
// hoặc sửa bản dịch trong kho rồi chạy lại. Sau khi chạy: node tools/csp-hash.mjs --write,
// node tools/kiem-sitemap.mjs --sua, node tools/kiem-schema.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, MOI, TAT_CA, MIEN, THU_MUC_DICH, trangViet, fileCua, capTiengAnh } from './cau-hinh.mjs';
import { tachTrang, chuoiLd, nenDichLd, boMa, maDoan, chuanKhoangTrang, taoTraLd, dichTuDoan } from './doan.mjs';
import { thayBoChon, thayHreflang, thayOgLocale } from './bo-chon.mjs';
import crypto from 'node:crypto';

const thamSo = (ten) => { const i = process.argv.indexOf(ten); return i > 0 ? process.argv[i + 1] : null; };
const chiKiem = process.argv.includes('--kiem');
const MA_CHON = (thamSo('--ma') || MOI.map((n) => n.ma).join(',')).split(',');
const NN = MOI.filter((n) => MA_CHON.includes(n.ma));
// Chạy thử: --kho <thư mục kho khác> --ra <thư mục ghi trang dịch> (khi có --ra thì KHÔNG đụng trang Việt/Anh và sitemap).
const KHO_DIR = thamSo('--kho') || path.join(THU_MUC_DICH, 'kho');
const RA = thamSo('--ra');

const RE_MA = /<(\/?)([a-z][a-z0-9]*?)(\d+)(\/?)>/g;
const escChu = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;');
const escTT = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const KHO = Object.fromEntries(MOI.map((n) => {
  const f = path.join(KHO_DIR, `${n.ma}.json`);
  return [n.ma, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}];
}));

// ---------- đọc + tách mọi trang Việt ----------
const TRANG = trangViet().map((duong) => {
  const src = fs.readFileSync(fileCua(duong), 'utf8');
  const t = tachTrang(src);
  return { duong, src, en: capTiengAnh(src), t, tra: taoTraLd(t.doan) };
});
const LA_TRANG = new Set(TRANG.map((x) => x.duong));
const theoChu = new Map();
for (const { t } of TRANG) for (const d of t.doan) if (!theoChu.has(boMa(d.nguon))) theoChu.set(boMa(d.nguon), d.id);

// Chuỗi JSON-LD: (1) lấy từ phần tương ứng của bản dịch đoạn hiển thị CÙNG trang (FAQ phải khớp chữ
// hiển thị), (2) đoạn trang khác có cùng chữ, (3) bản dịch riêng của chính chuỗi trong kho.
function dichLdChuoi(s, ma, tra) {
  const chu = chuanKhoangTrang(s);
  const r = tra && tra(chu);
  if (r && r.id in KHO[ma]) { const v = dichTuDoan(KHO[ma][r.id], r.k); if (v) return v; }
  const id = theoChu.get(chu);
  if (id && id in KHO[ma]) return boMa(KHO[ma][id]);
  return KHO[ma][maDoan(chu)];
}

// Độ phủ: mọi đoạn chữ/thuộc tính/script + mọi chuỗi JSON-LD cần dịch phải có trong kho.
function thieuCua(x, ma) {
  const thieu = [];
  for (const d of [...x.t.doan, ...x.t.js]) if (!(d.id in KHO[ma])) thieu.push(d.id);
  for (const k of x.t.ld) {
    chuoiLd(JSON.parse(k.json), (s, khoa) => { if (nenDichLd(s, khoa) && dichLdChuoi(s, ma, x.tra) === undefined) thieu.push('ld:' + maDoan(chuanKhoangTrang(s))); });
  }
  return [...new Set(thieu)];
}

const DUNG = {};
let coLoi = false;
for (const n of NN) {
  DUNG[n.ma] = new Set();
  const thieuTrang = [];
  for (const x of TRANG) {
    const th = thieuCua(x, n.ma);
    if (!th.length) DUNG[n.ma].add(x.duong);
    else thieuTrang.push(`${x.duong} (${th.length})`);
  }
  console.log(`${n.ma}: đủ bản dịch ${DUNG[n.ma].size}/${TRANG.length} trang${thieuTrang.length ? ' — thiếu: ' + thieuTrang.slice(0, 8).join(', ') + (thieuTrang.length > 8 ? ', …' : '') : ''}`);
}
if (chiKiem) process.exit(0);

// Trang dịch đang có trên đĩa (kể cả thứ tiếng không dựng lần này) — để link chéo và bộ chọn đúng.
const coTren = (ma, duong) => (DUNG[ma] ? DUNG[ma].has(duong) : fs.existsSync(path.join(ROOT, ma, duong === '/' ? '' : duong.slice(1), 'index.html')));

// ---------- đổi URL ----------
const LA_URL_TT = new Set(['href', 'src', 'srcset', 'poster', 'data-src', 'data-srcset', 'data-fb-base', 'action']);
function doiUrl(u, duongTrang, ma) {
  const goc = u.trim();
  if (!goc || /^(#|mailto:|tel:|sms:|javascript:|data:|blob:)/i.test(goc)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(goc) && !/^https?:\/\/(www\.)?xomleo\.vn(\/|$)/i.test(goc)) return u;
  if (/^\/\//.test(goc)) return u;
  let url;
  try { url = new URL(goc, MIEN + duongTrang); } catch { return u; }
  let p;
  try { p = decodeURI(url.pathname); } catch { p = url.pathname; }
  const tuyetDoi = /^https?:/i.test(goc);
  const trang = LA_TRANG.has(p) ? p : (LA_TRANG.has(p + '/') ? p + '/' : null);
  if (trang && coTren(ma, trang)) {
    const moi = `/${ma}${encodeURI(trang)}` + url.search + url.hash;
    return tuyetDoi ? MIEN + moi : moi;
  }
  if (tuyetDoi || goc.startsWith('/')) return u;
  return url.pathname + url.search + url.hash; // tương đối ("../uploads/…") → tính từ gốc, vì trang dịch sâu hơn một cấp
}
const doiSrcset = (v, d, ma) => v.split(',').map((phan) => phan.replace(/^(\s*)(\S+)/, (_, a, b) => a + doiUrl(b, d, ma))).join(',');
const doiCssUrl = (v, d, ma) => v.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => `url(${q}${doiUrl(u, d, ma)}${q})`);

const HASH_NGON_NGU = crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, 'js', 'ngon-ngu.js'), 'utf8').split('\r\n').join('\n')).digest('hex').slice(0, 8);

// ---------- dựng một trang ----------
const ID_CHUNG = /^https:\/\/xomleo\.vn\/#(organization|restaurant|website|bep-truong)$/;
function dichLd(json, duongTrang, n, tra) {
  const obj = JSON.parse(json);
  const di = (o, giuUrl) => {
    if (Array.isArray(o)) return o.map((v) => di(v, giuUrl));
    if (!o || typeof o !== 'object') return o;
    const chung = giuUrl || (typeof o['@id'] === 'string' && ID_CHUNG.test(o['@id']));
    const ra = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string') ra[k] = dichLdGiaTri(k, v, chung, duongTrang, n, tra);
      else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) ra[k] = v.map((x) => dichLdGiaTri(k, x, chung, duongTrang, n, tra));
      else ra[k] = di(v, chung);
    }
    return ra;
  };
  return di(obj, false);
}
function dichLdGiaTri(k, v, chung, duongTrang, n, tra) {
  if (k === 'inLanguage' && v === 'vi') return n.lang;
  if (nenDichLd(v, k)) return dichLdChuoi(v, n.ma, tra);
  if (/^https:\/\/xomleo\.vn\/#menu$/.test(v)) return `${v}-${n.ma}`;
  if (/^https:\/\/xomleo\.vn/.test(v) && !chung && !ID_CHUNG.test(v) && !['sameAs', 'image', 'logo', 'contentUrl', 'thumbnailUrl'].includes(k)) return doiUrl(v, duongTrang, n.ma);
  return v;
}

function apDung(src, bd, kt, sua) {
  let ra = '', vt = bd;
  for (const s of sua) {
    if (s.bd < bd || s.kt > kt) continue;
    ra += src.slice(vt, s.bd) + s.moi;
    vt = s.kt;
  }
  return ra + src.slice(vt, kt);
}

function dungTrang(x, n) {
  const { src, t, duong } = x;
  const kho = KHO[n.ma];
  const sua = [];
  // 1) thuộc tính: bản dịch + URL
  const ttDich = new Map(t.doan.filter((d) => d.loai === 'tt').map((d) => [d.bd, d]));
  (function di(node) {
    if (node.tagName && node.sourceCodeLocation?.startTag) {
      const loc = node.sourceCodeLocation.startTag.attrs || {};
      const laAlt = node.tagName === 'link' && (node.attrs.find((a) => a.name === 'rel')?.value || '') === 'alternate';
      for (const a of node.attrs) {
        const l = loc[a.name];
        if (!l) continue;
        const d = ttDich.get(l.startOffset);
        if (d) { sua.push({ bd: l.startOffset, kt: l.endOffset, moi: `${a.name}="${escTT(kho[d.id])}"` }); continue; }
        let moi = null;
        if (LA_URL_TT.has(a.name) && !laAlt) moi = a.name.endsWith('srcset') ? doiSrcset(a.value, duong, n.ma) : doiUrl(a.value, duong, n.ma);
        else if (a.name === 'content' && node.tagName === 'meta' && /^og:url$/.test(node.attrs.find((b) => b.name === 'property')?.value || '')) moi = doiUrl(a.value, duong, n.ma);
        else if (a.name === 'style' && /url\(/.test(a.value)) moi = doiCssUrl(a.value, duong, n.ma);
        if (moi !== null && moi !== a.value) sua.push({ bd: l.startOffset, kt: l.endOffset, moi: `${a.name}="${escTT(moi)}"` });
      }
    }
    if (node.tagName === 'script' || node.tagName === 'style') return;
    for (const c of node.childNodes || []) di(c);
    if (node.content) di(node.content);
  })(t.html);

  // 2) đoạn chữ: mã thẻ → thẻ gốc (đã áp sửa thuộc tính bên trong)
  const suaChu = [];
  for (const d of t.doan) {
    if (d.loai !== 'chu') continue;
    const dich = kho[d.id];
    const theo = new Map(d.the.map((x) => [x.ten + x.i, x]));
    for (const tk of d.the) if (tk.bd < d.bd || tk.kt > d.kt) throw new Error(`${duong}: thẻ ${tk.ten}${tk.i} nằm ngoài vùng đoạn ${d.id}`);
    let ra = '', vt = 0;
    for (const m of dich.matchAll(RE_MA)) {
      ra += escChu(dich.slice(vt, m.index));
      vt = m.index + m[0].length;
      const tk = theo.get(m[2] + m[3]);
      if (!tk) { ra += escChu(m[0]); continue; }
      if (tk.dac) ra += apDung(src, tk.bd, tk.kt, sua);
      else if (m[1]) ra += tk.dong;
      else ra += apDung(src, tk.the[0], tk.the[1], sua);
    }
    ra += escChu(dich.slice(vt));
    suaChu.push({ bd: d.bd, kt: d.kt, moi: ra });
  }
  const ngoaiDoan = sua.filter((s) => !suaChu.some((c) => s.bd >= c.bd && s.kt <= c.kt));

  // 3) JSON-LD + chuỗi script
  const suaKhac = [];
  for (const k of t.ld) {
    const dau = /^\s*/.exec(k.json)[0], cuoi = /\s*$/.exec(k.json)[0];
    const nl = /\r\n/.test(k.json) ? '\r\n' : '\n';
    suaKhac.push({ bd: k.bd, kt: k.kt, moi: dau + JSON.stringify(dichLd(k.json, duong, n, x.tra), null, 2).replace(/\n/g, nl) + cuoi });
  }
  for (const s of t.js) {
    let v = kho[s.id];
    v = s.mo === '`' ? v.replace(/[\\`]/g, '\\$&').replace(/\$\{/g, '\\${') : v.replace(/[\\']/g, '\\$&');
    v = v.replace(/\{(\d+)\}/g, (_, i) => (s.mo === '`' ? '${' + s.bien[i] + '}' : `{${i}}`));
    suaKhac.push({ bd: s.bd, kt: s.kt, moi: v });
  }

  const tatCa = [...ngoaiDoan, ...suaChu, ...suaKhac].sort((a, b) => a.bd - b.bd);
  for (let i = 1; i < tatCa.length; i++) if (tatCa[i].bd < tatCa[i - 1].kt) throw new Error(`${duong}: hai chỗ sửa chồng nhau ở ${tatCa[i].bd}`);
  let ra = apDung(src, 0, src.length, tatCa);

  // 4) phần đầu trang + bộ chọn ngôn ngữ
  const ban = banCua(x);
  ra = ra.replace(/(<html\b[^>]*?\blang=")vi(")/, `$1${n.lang}$2`);
  ra = ra.replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${n.locale}$2`);
  ra = thayOgLocale(ra, n.ma, ban).html;
  ra = thayHreflang(ra, ban).html;
  // Bảng dịch chữ do JS sinh ra (js/ngon-ngu.js) nạp TRƯỚC main.min.js; hash cùng cách tools/cache-bust.js.
  ra = ra.replace(/([ \t]*)(<script src="[^"]*main\.min\.js\?[^"]*" defer><\/script>)/, (_, thut, the) => `${thut}<script src="/js/ngon-ngu.js?h${HASH_NGON_NGU}" defer></script>${src.includes('\r\n') ? '\r\n' : '\n'}${thut}${the}`);
  if (!ra.includes('/js/ngon-ngu.js?')) console.log(`  ! ${n.ma}${duong}: không chèn được js/ngon-ngu.js`);
  const bc = thayBoChon(ra, { hienTai: n.ma, ban });
  if (!bc.so) console.log(`  ! ${n.ma}${duong}: không thấy bộ chọn ngôn ngữ`);
  return bc.html;
}

function banCua(x) {
  const ban = { vi: x.duong, en: x.en };
  for (const n of MOI) ban[n.ma] = coTren(n.ma, x.duong) ? `/${n.ma}${x.duong}` : null;
  return ban;
}

// ---------- ghi trang dịch ----------
let soGhi = 0;
for (const n of NN) {
  for (const x of TRANG) {
    if (!DUNG[n.ma].has(x.duong)) continue;
    let html;
    try { html = dungTrang(x, n); } catch (e) { console.error(`LỖI ${n.ma}${x.duong}: ${e.message}`); coLoi = true; DUNG[n.ma].delete(x.duong); continue; }
    const f = path.join(RA || ROOT, n.ma, x.duong === '/' ? '' : x.duong.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(f), { recursive: true });
    if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== html) { fs.writeFileSync(f, html); soGhi++; }
  }
}
console.log(`đã ghi ${soGhi} trang dịch`);
if (RA) process.exit(coLoi ? 1 : 0);

// ---------- trang Việt + Anh: bộ chọn, hreflang, og:locale:alternate ----------
let soGoc = 0;
const sua1 = (file, hienTai, ban) => {
  if (!fs.existsSync(file)) return;
  const cu = fs.readFileSync(file, 'utf8');
  let h = thayBoChon(cu, { hienTai, ban }).html;
  h = thayHreflang(h, ban).html;
  h = thayOgLocale(h, hienTai, ban).html;
  if (h !== cu) { fs.writeFileSync(file, h); soGoc++; }
};
for (const x of TRANG) {
  const ban = banCua(x);
  sua1(fileCua(x.duong), 'vi', ban);
  if (x.en) sua1(fileCua(x.en), 'en', ban);
}
// 404 song ngữ: bộ chọn dẫn về trang chủ từng thứ tiếng.
{
  const f = path.join(ROOT, '404.html');
  const cu = fs.readFileSync(f, 'utf8');
  const h = thayBoChon(cu, { hienTai: 'vi', ban: { vi: '/', en: '/en/' } }).html;
  if (h !== cu) { fs.writeFileSync(f, h); soGoc++; }
}
console.log(`đã cập nhật ${soGoc} trang Việt/Anh`);

// ---------- sitemap ----------
{
  const f = path.join(ROOT, 'sitemap.xml');
  let sm = fs.readFileSync(f, 'utf8');
  const nl = /\r\n/.test(sm) ? '\r\n' : '\n';
  const homNay = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);
  const khoiUrl = (loc, lastmod, uuTien, ban) => [
    '  <url>',
    `    <loc>${MIEN}${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <priority>${uuTien}</priority>`,
    ...TAT_CA.filter((m) => ban[m.ma]).map((m) => `    <xhtml:link rel="alternate" hreflang="${m.hreflang}" href="${MIEN}${ban[m.ma]}" />`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${MIEN}${ban.vi}" />`,
    '  </url>',
  ].join(nl);
  const khoi = new Map();
  for (const m of sm.matchAll(/  <url>[\s\S]*?<\/url>/g)) khoi.set(/<loc>([^<]+)<\/loc>/.exec(m[0])[1].replace(MIEN, ''), m[0]);
  for (const x of TRANG) {
    const ban = banCua(x);
    const cuVi = khoi.get(x.duong);
    const lastmod = (/<lastmod>([^<]+)</.exec(cuVi) || [])[1] || homNay;
    const uuTien = (/<priority>([^<]+)</.exec(cuVi) || [])[1] || '0.6';
    for (const ma of ['vi', 'en']) {
      const loc = ban[ma];
      if (!loc || !khoi.has(loc)) continue;
      const cu = khoi.get(loc);
      const lm = (/<lastmod>([^<]+)</.exec(cu) || [])[1] || lastmod;
      sm = sm.replace(cu, () => khoiUrl(loc, lm, uuTien, ban));
    }
    for (const n of MOI) {
      const loc = ban[n.ma];
      if (loc) {
        const cu = khoi.get(loc);
        const lm = cu ? ((/<lastmod>([^<]+)</.exec(cu) || [])[1] || homNay) : homNay;
        const moi = khoiUrl(loc, lm, uuTien, ban);
        if (cu) sm = sm.replace(cu, () => moi);
        else sm = sm.replace(/\s*<\/urlset>/, (m) => nl + moi + m);
      } else if (khoi.has(`/${n.ma}${x.duong}`)) {
        sm = sm.replace(new RegExp(`\\s*${khoi.get(`/${n.ma}${x.duong}`).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '');
      }
    }
  }
  fs.writeFileSync(f, sm);
  console.log(`sitemap: ${(sm.match(/<loc>/g) || []).length} URL`);
}
if (coLoi) process.exitCode = 1;
