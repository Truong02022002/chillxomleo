#!/usr/bin/env node
/**
 * Giao dien mua le (Noel / Tet) TU BAT theo ngay — quan ly doan <script> nho trong <head>.
 *
 * Doan script (DOAN ben duoi) chay truoc khi trang hien, tinh ngay theo GIO VIET NAM (UTC+7,
 * khach o nuoc ngoai van thay dung mua cua quan) va:
 *   - Noel : 1/12 -> het 1/1 (tu 27/12 loi chuc doi sang chuc nam moi — js/mua-le.js)
 *   - Tet  : 16 ngay truoc mung 1 (~ra ram thang Chap) -> het ram thang Gieng (mung 1 + 14)
 *   - con lai: khong lam gi, khong tai them byte nao.
 * Trong mua: dat <html data-mua="noel|tet"> ngay, nhung CHI nap css/mua-le.min.css + js/mua-le.min.js
 * (chen do trang tri + thong bao lich Tet) SAU su kien 'load'. Do A/B 27-09-2026 (Slow 4G + CPU x4,
 * 6 vong xen ke): nap ngay tu <head> thi hai file tranh bang thong voi font tieu de -> LCP h1
 * cham 200-300ms; doi 'load' thi het. Ngoai mua: LCP y nhu truoc (2444 vs 2460ms).
 * Tet va Noel khong bao gio trung nhau (mung 1 som nhat 21/1 -> Tet bat som nhat 5/1).
 *
 * Ngay mung 1 Tet (duong lich, lich am Viet Nam UTC+7) ghi san toi 2036 — BANG_TET. Het bang
 * thi chi con Noel. Lich NGHI Tet cua quan nam o LICH_TET trong js/mua-le.js (tung nam, chu
 * site xac nhan moi ghi).
 *
 * Xem thu bat ky luc nao: them ?mua=noel | ?mua=tet | ?mua=thuong vao URL (giu trong phien
 * trinh duyet, co nhan "Dang xem thu" o day man hinh); ?mua=tu-dong de ve binh thuong.
 *
 * Cach dung:
 *   node tools/mua-le.mjs            # kiem: moi trang co doan script dung ban + hash asset khop (exit 1 neu lech)
 *   node tools/mua-le.mjs --write    # chen / cap nhat doan script vao moi trang co <style id="site-css">
 *   node tools/mua-le.mjs --lich     # in lich bat/tat 2 nam toi + kiem cac moc 23:59 / 00:00
 * Sau --write PHAI chay: node tools/csp-hash.mjs --write (noi dung script doi -> hash CSP doi).
 * Sua css/mua-le.css hay js/mua-le.js: build-css.js --write / build-js.js --write, roi lenh nay
 * (hoac cache-bust.js --write — hai cong cu tinh hash giong nhau).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Ngay mung 1 Tet (thang-ngay duong lich). Tinh bang thuat toan lich am Ho Ngoc Duc, MUI GIO +7
// (27-09-2026); 2027 = thu Bay 06-02-2027 khop lich Tet Dinh Mui da chot 17-09-2026.
// ⚠ Dung chep bang Tet Trung Quoc (UTC+8): nam 2030 Viet Nam an Tet 02-02, Trung Quoc 03-02.
const BANG_TET = {
  2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-02', 2031: '01-23',
  2032: '02-11', 2033: '01-31', 2034: '02-19', 2035: '02-08', 2036: '01-28',
};

// Hash giong het tools/cache-bust.js (sha1 noi dung da doi CRLF -> LF, 8 ky tu dau).
const hashOf = (rel) => crypto.createHash('sha1')
  .update(fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\r\n').join('\n'))
  .digest('hex').slice(0, 8);

// Mot dong duy nhat: noi dung script khong phu thuoc kieu xuong dong cua tung trang
// (hash CSP cung vi vay ma on dinh).
function doan() {
  const T = JSON.stringify(Object.fromEntries(Object.entries(BANG_TET))).replace(/"(\d{4})"/g, '$1').replace(/"/g, "'");
  return '<script>/* mua-le: giao dien Noel/Tet tu bat theo gio Viet Nam — sua o tools/mua-le.mjs */' +
    '(function(d,h){var n=Date.now()+252e5,N=864e5,t=0,k,m,' +
    'T=' + T + ',' +
    'q=/[?&]mua=([a-z-]*)/.exec(location.search),p=q&&/^(noel|tet|thuong)$/.test(q[1])?q[1]:"";' +
    'for(k in T){t=Date.parse(k+"-"+T[k]+"T00:00:00Z");if(t+15*N>n)break;t=0}' +
    'k=new Date(n);k=k.getUTCMonth()*100+k.getUTCDate();' +
    'm=t&&n>=t-16*N?"tet":k>=1101||k<2?"noel":"";' +
    'try{if(q){if(p)sessionStorage.setItem("mua",p);else sessionStorage.removeItem("mua")}else p=sessionStorage.getItem("mua")||""}catch(e){}' +
    'if(p){m=p=="thuong"?"":p;h.setAttribute("data-mua-thu",p)}' +
    'window.xomleoMua={mua:m,tet:t};' +
    'if(m)h.setAttribute("data-mua",m);else if(!p)return;' +
    'function nap(){' +
    'k=d.createElement("link");k.rel="stylesheet";k.href="/css/mua-le.min.css?h' + hashOf('css/mua-le.min.css') + '";' +
    'k.onload=function(){h.setAttribute("data-mua-css","");d.dispatchEvent(new Event("mua-css"))};' +
    'd.head.appendChild(k);' +
    'k=d.createElement("script");k.src="/js/mua-le.min.js?h' + hashOf('js/mua-le.min.js') + '";d.head.appendChild(k)}' +
    'if(d.readyState=="complete")nap();else addEventListener("load",nap)' +
    '})(document,document.documentElement)</script>';
}

const RE_DOAN = /<script>\/\* mua-le:[\s\S]*?<\/script>/g;

// ---------- --lich: chay CHINH doan script voi dong ho gia ----------
function muaLuc(iso) {
  const ms = Date.parse(iso);
  const code = doan().replace(/^<script>/, '').replace(/<\/script>$/, '');
  const thuocTinh = {};
  class DongHo extends Date { static now() { return ms; } }
  const fn = new Function('document', 'location', 'sessionStorage', 'window', 'Date', code);
  const doc = {
    documentElement: { setAttribute: (k, v) => { thuocTinh[k] = v; } },
    readyState: 'complete', createElement: () => ({}), head: { appendChild() {} }, dispatchEvent() {},
  };
  fn(doc, { search: '' }, { getItem: () => null, setItem() {}, removeItem() {} }, {}, DongHo);
  return thuocTinh['data-mua'] || '';
}

if (process.argv.includes('--lich')) {
  const batDau = new Date(Date.now() + 252e5);
  let d = Date.UTC(batDau.getUTCFullYear(), batDau.getUTCMonth(), batDau.getUTCDate());
  const het = d + 730 * 864e5;
  const iso = (x) => new Date(x).toISOString().slice(0, 10);
  let cu = null, tu = d;
  for (; d <= het; d += 864e5) {
    const m = muaLuc(iso(d) + 'T12:00:00+07:00');
    if (m !== cu) {
      if (cu) console.log(`  ${cu.padEnd(5)} ${iso(tu)} -> ${iso(d - 864e5)}`);
      cu = m; tu = d;
    }
  }
  if (cu) console.log(`  ${cu.padEnd(5)} ${iso(tu)} -> ...`);
  // Moc chuyen mua dung 00:00 gio Viet Nam, bat ke mui gio cua may khach.
  const moc = [
    ['2026-11-30T23:59:59+07:00', ''], ['2026-12-01T00:00:00+07:00', 'noel'],
    ['2027-01-01T23:59:59+07:00', 'noel'], ['2027-01-02T00:00:00+07:00', ''],
    ['2027-01-20T23:59:59+07:00', ''], ['2027-01-21T00:00:00+07:00', 'tet'],
    ['2027-02-20T23:59:59+07:00', 'tet'], ['2027-02-21T00:00:00+07:00', ''],
    ['2027-12-24T20:00:00-08:00', 'noel'], ['2028-01-09T23:59:59+07:00', ''], ['2028-01-10T00:00:00+07:00', 'tet'],
  ];
  let sai = 0;
  for (const [t, mong] of moc) {
    const ra = muaLuc(t);
    if (ra !== mong) sai++;
    console.log(`  ${ra === mong ? 'dung' : 'SAI '}  ${t}  -> "${ra}"${ra === mong ? '' : ' (can "' + mong + '")'}`);
  }
  process.exit(sai ? 1 : 0);
}

// ---------- chen / kiem ----------
const trang = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.claude', 'skills', 'tools'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) trang.push(p);
  }
})(ROOT);

const moi = doan();
const write = process.argv.includes('--write');
let thieu = 0, cu = 0, dung = 0;
for (const f of trang) {
  const s = fs.readFileSync(f, 'utf8');
  if (!s.includes('<style id="site-css"')) continue;            // stub chuyen huong: khong co giao dien
  const co = s.match(RE_DOAN) || [];
  let t;
  if (co.length === 1 && co[0] === moi) { dung++; continue; }
  if (co.length) {
    // thay ban cu ngay tai cho; lo co hai ban (dan tay) thi bo ban thu hai
    cu++;
    let dau = true;
    t = s.replace(RE_DOAN, () => (dau ? ((dau = false), moi) : ''));
  } else {
    thieu++;
    const nl = s.includes('\r\n') ? '\r\n' : '\n';
    t = s.replace(/([ \t]*)<style id="site-css"/, (m, thut) => thut + moi + nl + m);
  }
  if (write) fs.writeFileSync(f, t);
}

console.log(`doan script mua le: ${dung} trang dung, ${cu} trang ban cu, ${thieu} trang chua co`);
if (!cu && !thieu) process.exit(0);
if (write) { console.log('Da ghi. Chay tiep: node tools/csp-hash.mjs --write'); process.exit(0); }
console.error('LECH. Chay: node tools/mua-le.mjs --write && node tools/csp-hash.mjs --write');
process.exit(1);
