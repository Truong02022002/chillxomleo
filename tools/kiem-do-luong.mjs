#!/usr/bin/env node
/**
 * Kiem cac su kien GA4 cua site van ban DUNG va DU (muc 247-250 cua cam nang).
 *
 * Ly do ton tai: su kien do luong hong am tham. Doi mot class, doi cau truc khoi
 * CTA hay doi id `#navbar` la `cta_position` sai het ma khong co loi nao hien ra —
 * chi vai tuan sau moi phat hien bao cao GA4 rong. Do cung la lop loi "tham chieu
 * chet sau refactor" da tai dien nhieu lan o repo nay.
 *
 * Cach dung:
 *   node tools/kiem-do-luong.mjs           # chay 17 phep thu, exit 1 neu co cai hong
 *   node tools/kiem-do-luong.mjs --giu     # giu Chrome lai de tu xem
 *
 * KHONG lam ban du lieu that: moi request toi Google (gtag/js, /g/collect,
 * google-analytics.com...) deu bi chan o tang CDP, con endpoint Apps Script cua
 * form dat ban duoc tra 200 gia — khong co don dat ban nao duoc tao that.
 * Cach do: hook `dataLayer.push` roi doc lenh gtag, khong can gtag.js chay.
 *
 * Yeu cau: Chrome tren may (khong can cai npm package nao).
 *
 * Hop dong du lieu (ten su kien, tham so, gia tri hop le, viec con lai trong GA4 admin):
 * xem tools/do-luong.md. Sua khoi do luong thi sua ca file do.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GIU_CHROME = process.argv.includes('--giu');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('Khong tim thay Chrome.'); process.exit(2); }

// Profile PHAI o duong dan ngan: duong dan dai vuot MAX_PATH 260 lam service
// worker cua site chet gia (da vap 15-09-2026).
const PROFILE = (process.platform === 'win32' ? 'C:/Users/PHANDU~1/AppData/Local/Temp/' : '/tmp/') + 'xl-do-' + Date.now();
const CDP_PORT = 9470 + (Date.now() % 90);
const WEB_PORT = 8850 + (Date.now() % 90);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); }
  // no-store: khong thi Chrome dung ban main.min.js cu trong cache va phep thu
  // bao sai (da vap 16-09-2026).
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(fp));
});
await new Promise((r) => server.listen(WEB_PORT, '127.0.0.1', r));

// Tren runner ubuntu-24.04 cua GitHub, AppArmor chan user namespace khong dac quyen
// nen sandbox cua Chrome khong khoi dong duoc (loi 'Operation not permitted'). Chi tat
// sandbox khi bien CI co mat; may lap trinh chay binh thuong van giu nguyen sandbox.
const TREN_CI = !!process.env.CI;
const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=' + CDP_PORT, '--user-data-dir=' + PROFILE,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1280,900',
  ...(TREN_CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []),
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 60 && !target; i++) {
  try {
    const list = await (await fetch('http://127.0.0.1:' + CDP_PORT + '/json/list')).json();
    // Loc 'chrome': target chrome://omnibox-popup cung co type 'page'.
    target = list.find((x) => x.type === 'page' && !x.url.startsWith('chrome') && !x.url.startsWith('devtools'));
  } catch (e) { /* Chrome chua len */ }
  if (!target) await sleep(300);
}
if (!target) { console.error('Khong ket noi duoc Chrome.'); process.exit(2); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
// readyState phai kiem truoc: su kien 'open' co the ban xong truoc khi gan listener.
if (ws.readyState !== 1) await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });

let id = 0;
const cho = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && cho.has(m.id)) { cho.get(m.id)(m); cho.delete(m.id); }
});
const goi = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id;
  cho.set(i, (m) => (m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result)));
  ws.send(JSON.stringify({ id: i, method, params }));
});

const CHAN = /google-analytics\.com|analytics\.google\.com|googletagmanager\.com|google\.com\/(g|ccm|pagead)\/|doubleclick\.net|googlesyndication\.com|cloudflareinsights\.com|\/cdn-cgi\/rum/;
let appsScriptOk = true; // true = gia lap gui thanh cong
let soChan = 0, soAppsScript = 0;

await goi('Page.enable');
await goi('Runtime.enable');
await goi('Network.enable');
await goi('Network.setCacheDisabled', { cacheDisabled: true });
await goi('Fetch.enable', { patterns: [{ urlPattern: '*' }] });

ws.addEventListener('message', async (e) => {
  const m = JSON.parse(e.data);
  if (m.method !== 'Fetch.requestPaused') return;
  const { requestId, request } = m.params;
  try {
    if (CHAN.test(request.url)) { soChan++; await goi('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }); }
    else if (request.url.includes('script.google.com')) {
      soAppsScript++;
      if (appsScriptOk) await goi('Fetch.fulfillRequest', { requestId, responseCode: 200, body: '' });
      else await goi('Fetch.failRequest', { requestId, errorReason: 'Failed' });
    } else await goi('Fetch.continueRequest', { requestId });
  } catch (err) { /* request da bi huy */ }
});

async function ev(expr) {
  const r = await goi('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'loi eval');
  return r.result.value;
}

async function moTrang(duongDan) {
  await goi('Page.navigate', { url: 'http://127.0.0.1:' + WEB_PORT + duongDan });
  for (let i = 0; i < 80; i++) { await sleep(200); if (await ev('document.readyState') === 'complete') break; }
  await sleep(400);
  await ev(`(function(){
    window.__ghi = [];
    window.dataLayer = window.dataLayer || [];
    var push0 = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = function(){
      for (var i=0;i<arguments.length;i++){
        try { window.__ghi.push(JSON.parse(JSON.stringify(Array.prototype.slice.call(arguments[i])))); } catch(e) { window.__ghi.push(['?']); }
      }
      return push0.apply(null, arguments);
    };
    // Chan dieu huong that (tel:, tab moi) NHUNG listener cua site van chay truoc.
    document.addEventListener('click', function(e){ e.preventDefault(); }, true);
    return true;
  })()`);
}
const docEvent = async () => (await ev('JSON.stringify(window.__ghi)')).length
  ? JSON.parse(await ev('JSON.stringify(window.__ghi)')).filter((x) => x[0] === 'event').map((x) => ({ ten: x[1], tham: x[2] }))
  : [];
const xoaGhi = () => ev('window.__ghi = []');

const kq = [];
function bao(ten, dat, chiTiet) {
  kq.push({ ten, dat });
  console.log((dat ? '  DAT  ' : '  HONG ') + ten + (chiTiet ? ' | ' + chiTiet : ''));
}

async function thuBam(nhan, chon, tenMongDoi, kiem) {
  await xoaGhi();
  const co = await ev(`(function(){ var el = document.querySelector(${JSON.stringify(chon)}); if(!el) return 'KHONG-CO-PHAN-TU'; el.click(); return 'ok'; })()`);
  if (co !== 'ok') return bao(nhan, false, co + ' (' + chon + ')');
  await sleep(250);
  const ev1 = await docEvent();
  if (ev1.length !== 1) return bao(nhan, false, 'ban ' + ev1.length + ' event (phai la 1): ' + JSON.stringify(ev1.map((x) => x.ten)));
  if (ev1[0].ten !== tenMongDoi) return bao(nhan, false, 'ten sai: ' + ev1[0].ten);
  const loi = kiem ? kiem(ev1[0].tham) : null;
  bao(nhan, !loi, loi || JSON.stringify(ev1[0].tham));
}

async function thuGuiForm(gia) {
  return await ev(`(function(){
    try { sessionStorage.removeItem('xomleo_last_booking'); } catch(e){}
    var d = ${JSON.stringify(gia)};
    for (var k in d) { var el = document.getElementById(k); if (el) el.value = d[k]; }
    var f = document.getElementById('zaloBookingForm');
    if (!f) return 'KHONG-CO-FORM';
    if (!f.checkValidity()) {
      return 'FORM-KHONG-HOP-LE: ' + Array.prototype.filter.call(f.elements, function(el){ return !el.checkValidity(); })
        .map(function(el){ return el.id + ':' + el.validationMessage; }).join(' | ');
    }
    f.requestSubmit();
    return 'ok';
  })()`);
}
const GIA_HOP_LE = { book_name: 'Nguyen Van Kiem Thu', book_phone: '0912345678', book_guests: '4', book_note: '', book_date: '2026-12-01', book_time: '19:30', book_occasion: 'Sinh nhật' };

console.log('=== TRANG CHU (/) ===');
await moTrang('/');
bao('Tai trang khong tu ban event nao', (await docEvent()).length === 0);
await thuBam('Thanh dieu huong: so dien thoai -> click_call/navbar', '#navbar a[href^="tel:"]', 'click_call',
  (t) => (t.cta_position === 'navbar' && t.page_type === 'home' && t.contact_method === 'phone' ? null : 'tham so sai: ' + JSON.stringify(t)));
await thuBam('Nut noi: Zalo -> chat_open/zalo/floating', '.floating-contact a[href*="zalo.me"]', 'chat_open',
  (t) => (t.chat_channel === 'zalo' && t.cta_position === 'floating' ? null : 'tham so sai: ' + JSON.stringify(t)));
await thuBam('Nut noi: goi dien -> click_call/floating', '.floating-contact a[href^="tel:"]', 'click_call',
  (t) => (t.cta_position === 'floating' ? null : 'tham so sai: ' + JSON.stringify(t)));
await thuBam('Chan trang: Google Maps -> click_directions/footer', 'footer a[href*="google.com/maps"]', 'click_directions',
  (t) => (t.map_target === 'google_maps' && t.cta_position === 'footer' ? null : 'tham so sai: ' + JSON.stringify(t)));
await thuBam('Thanh dieu huong: Dat ban -> click_booking_cta/navbar', '#navbar a[href$="#booking"]', 'click_booking_cta',
  (t) => (t.cta_position === 'navbar' ? null : 'tham so sai: ' + JSON.stringify(t)));
await thuBam('Hero: Dat ban -> cta_position=hero', '.hero-cinematic a[href$="#booking"]', 'click_booking_cta',
  (t) => (t.cta_position === 'hero' ? null : 'cta_position=' + t.cta_position));

console.log('\n=== FORM DAT BAN ===');
appsScriptOk = true;
await xoaGhi();
const g1 = await thuGuiForm(GIA_HOP_LE);
await sleep(2500);
{
  const e = await docEvent();
  const lead = e.filter((x) => x.ten === 'generate_lead');
  const t = lead[0]?.tham || {};
  const coPII = JSON.stringify(t).includes('0912345678') || JSON.stringify(t).toLowerCase().includes('kiem thu');
  bao('Gui thanh cong -> DUNG 1 generate_lead', g1 === 'ok' && e.length === 1 && lead.length === 1, g1 !== 'ok' ? g1 : 'event: ' + JSON.stringify(e.map((x) => x.ten)));
  bao('generate_lead du ngu canh va KHONG co PII',
    !coPII && t.form_id === 'zaloBookingForm' && t.lead_type === 'booking_form' && t.guests === 4 && t.occasion === 'birthday',
    JSON.stringify(t));
}

appsScriptOk = false;
await moTrang('/');
await xoaGhi();
await thuGuiForm(GIA_HOP_LE);
await sleep(2500);
bao('Gui LOI mang -> khong ban generate_lead', (await docEvent()).filter((x) => x.ten === 'generate_lead').length === 0);

appsScriptOk = true;
await moTrang('/');
await xoaGhi();
await thuGuiForm(Object.assign({}, GIA_HOP_LE, { book_honeypot: 'bot' }));
await sleep(1500);
bao('Bot dien honeypot -> khong ban event nao', (await docEvent()).length === 0);

console.log('\n=== BAI VIET ===');
await moTrang('/thien-vien-truc-lam/');
await thuBam('Bai du lich -> page_type=blog_post, intent_stage=awareness', '#navbar a[href^="tel:"]', 'click_call',
  (t) => (t.page_type === 'blog_post' && t.intent_stage === 'awareness' && t.page_language === 'vi' ? null : 'tham so sai: ' + JSON.stringify(t)));
await thuBam('Khoi phu cuoi bai -> cta_position=article_aside', 'aside a[href$="#booking"]', 'click_booking_cta',
  (t) => (t.cta_position === 'article_aside' ? null : 'cta_position=' + t.cta_position));

await moTrang('/quan-nuong-da-lat-view-xe-lua/');
await thuBam('CTA giua than bai -> cta_position=article_body', 'main article p a[href$="#booking"]', 'click_booking_cta',
  (t) => (t.cta_position === 'article_body' ? null : 'cta_position=' + t.cta_position));
await thuBam('Bai ve quan -> intent_stage=consideration', '#navbar a[href^="tel:"]', 'click_call',
  (t) => (t.intent_stage === 'consideration' ? null : 'intent_stage=' + t.intent_stage));

console.log('\n=== BAN EN / MENU ===');
await moTrang('/en/');
await thuBam('Ban EN -> page_language=en', '#navbar a[href^="tel:"]', 'click_call',
  (t) => (t.page_language === 'en' && t.page_type === 'home' ? null : 'tham so sai: ' + JSON.stringify(t)));
await moTrang('/menu/');
await thuBam('Trang menu -> page_type=menu, intent_stage=action', '#navbar a[href^="tel:"]', 'click_call',
  (t) => (t.page_type === 'menu' && t.intent_stage === 'action' ? null : 'tham so sai: ' + JSON.stringify(t)));

console.log('\n=== MANG ===');
console.log('  request toi Google bi chan: ' + soChan + ' | request Apps Script bi giu lai: ' + soAppsScript);
if (soChan === 0) bao('Harness co that su chan request ra Google', false, 'khong chan duoc lan nao — hoac trang khong con the GA');
else bao('Khong co request nao ra Google lot luoi', true);

const hong = kq.filter((k) => !k.dat);
console.log('\n' + (kq.length - hong.length) + '/' + kq.length + ' phep thu DAT');
if (hong.length) { console.log('HONG:'); hong.forEach((h) => console.log('  - ' + h.ten)); }

if (!GIU_CHROME) { ws.close(); chrome.kill(); server.close(); }
process.exit(hong.length ? 1 : 0);
