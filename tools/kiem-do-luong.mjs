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
 *   node tools/kiem-do-luong.mjs           # chay het cac phep thu, exit 1 neu co cai hong
 *   node tools/kiem-do-luong.mjs --giu     # giu Chrome lai de tu xem
 *
 * KHONG lam ban du lieu that: moi request toi Google (gtag/js, /g/collect,
 * google-analytics.com...) deu bi chan o tang CDP, con endpoint Apps Script cua
 * form dat ban duoc tra loi gia theo 4 kich ban (xem bien `appsScript`) — khong co
 * don dat ban nao duoc tao that.
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
// Gia lap webhook Apps Script cua form dat ban. Webhook that tra JSON kem
// Access-Control-Allow-Origin: * (kiem 19-09-2026), site doc tra loi do de quyet dinh
// co tinh lead hay khong:
//   'ok'         POST tra {"status":"success"}                -> xac nhan
//   'server_loi' POST tra {"status":"error"}                  -> bao loi cho khach
//   'khong_doc'  POST tra 200 nhung THIEU CORS, GET van tra loi -> don co le da toi
//   'loi_mang'   moi request deu that bai                     -> bao loi cho khach
let appsScript = 'ok';
let soChan = 0, soAppsScript = 0;
const b64 = (s) => Buffer.from(s).toString('base64');
const CORS = [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Content-Type', value: 'application/json; charset=utf-8' }];

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
      const post = request.method === 'POST';
      if (appsScript === 'loi_mang') await goi('Fetch.failRequest', { requestId, errorReason: 'Failed' });
      else if (!post) await goi('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: CORS, body: b64('{"status":"ok"}') });
      else if (appsScript === 'khong_doc') await goi('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/html' }], body: b64('<html>ok</html>') });
      else await goi('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: CORS, body: b64(appsScript === 'server_loi' ? '{"status":"error","message":"sheet"}' : '{"status":"success"}') });
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
// Trang thai giao dien sau khi gui: thong bao nao dang hien, du lieu khach nhap con
// khong, nut gui mo lai chua, khoa chong gui lap con khong.
const giaoDien = () => ev(`JSON.stringify({
  daGui: !!document.querySelector('[role="status"]'),
  baoLoi: !!document.querySelector('[role="alert"]'),
  tenConGiu: (document.getElementById('book_name') || {}).value === 'Nguyen Van Kiem Thu',
  nutMo: !document.querySelector('#zaloBookingForm button[type="submit"]').disabled,
  khoaGuiLap: !!sessionStorage.getItem('xomleo_last_booking'),
})`).then(JSON.parse);

appsScript = 'ok';
await xoaGhi();
const g1 = await thuGuiForm(GIA_HOP_LE);
await sleep(2500);
{
  const e = await docEvent();
  const lead = e.filter((x) => x.ten === 'generate_lead');
  const t = lead[0]?.tham || {};
  const coPII = JSON.stringify(t).includes('0912345678') || JSON.stringify(t).toLowerCase().includes('kiem thu');
  const gd = await giaoDien();
  bao('Webhook xac nhan -> DUNG 1 generate_lead + bao da gui', g1 === 'ok' && e.length === 1 && lead.length === 1 && gd.daGui && !gd.baoLoi,
    g1 !== 'ok' ? g1 : 'event: ' + JSON.stringify(e.map((x) => x.ten)) + ' ' + JSON.stringify(gd));
  bao('generate_lead du ngu canh va KHONG co PII',
    !coPII && t.form_id === 'zaloBookingForm' && t.lead_type === 'booking_form' && t.guests === 4 && t.occasion === 'birthday',
    JSON.stringify(t));
}

for (const [che, nhan] of [['loi_mang', 'Loi mang'], ['server_loi', 'Webhook tra {"status":"error"}']]) {
  appsScript = che;
  await moTrang('/');
  await xoaGhi();
  await thuGuiForm(GIA_HOP_LE);
  await sleep(2500);
  const coLead = (await docEvent()).some((x) => x.ten === 'generate_lead');
  const gd = await giaoDien();
  // Truoc 19-09-2026 truong hop nay van hien "Da gui thong tin dat ban": khach tuong
  // da dat duoc ban ma quan khong nhan duoc gi.
  bao(nhan + ' -> khong generate_lead, BAO LOI, giu du lieu, cho gui lai',
    !coLead && gd.baoLoi && !gd.daGui && gd.tenConGiu && gd.nutMo && !gd.khoaGuiLap, JSON.stringify(gd));
}
await thuBam('Nut goi trong thong bao loi -> click_call/toast', '[role="alert"] a[href^="tel:"]', 'click_call',
  (t) => (t.cta_position === 'toast' ? null : 'cta_position=' + t.cta_position));

appsScript = 'khong_doc';
await moTrang('/');
await xoaGhi();
await thuGuiForm(GIA_HOP_LE);
await sleep(2500);
{
  const coLead = (await docEvent()).some((x) => x.ten === 'generate_lead');
  const gd = await giaoDien();
  // Don co le da toi (GET van thong) nen khong bao loi — bao loi thi khach gui lai
  // thanh don trung. Nhung chua co xac nhan nen KHONG tinh lead.
  bao('Khong doc duoc tra loi, mang van thong -> bao da gui, KHONG tinh lead', !coLead && gd.daGui && !gd.baoLoi, JSON.stringify(gd));
}

console.log('\n=== NGUON TRUY CAP GHI VAO DON DAT BAN ===');
// Co UTM thi nguon = "<trang vao>/<utm_source>" va medium nam o khoa rieng — ghep medium
// vao nguon thi Apps Script noi them lan nua thanh "organic / organic" (vap 19-09-2026).
for (const [duong, mongDoi, medium] of [
  ['/?fbclid=IwAR0kiemthu', 'Facebook'],
  ['/?gclid=kiemthu', 'Google Ads'],
  ['/menu/?utm_source=google_maps&utm_medium=organic&utm_campaign=gbp', 'menu/google_maps', 'organic'],
  ['/?utm_source=facebook&utm_medium=paid_social', 'trang_chu/facebook', 'paid_social'],
  ['/thien-vien-truc-lam/?utm_source=zalo&utm_medium=social', 'bai_viet/zalo', 'social'],
]) {
  await moTrang(duong);
  const nguon = await ev("sessionStorage.getItem('xomleo_traffic_source')");
  const med = await ev("sessionStorage.getItem('xomleo_utm_medium')");
  // fbclid Facebook gan vao MOI link di ra, ke ca bai dang thuong — khong duoc suy ra "Ads".
  bao('Vao ' + duong + ' -> nguon "' + mongDoi + '"', nguon === mongDoi && (!medium || med === medium), 'nhan: ' + nguon + ' | medium: ' + med);
}

appsScript = 'ok';
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

console.log('\n=== BAC DLN -> CONTENT GROUP ===');
// Lenh config phai mang content_group = <html data-dln> (do-luong.md muc 4). Doc thang
// dataLayer chu khong doc __ghi: config co the da vao hang doi truoc luc moTrang cai hook.
for (const [duong, mongDoi] of [['/', '5-act'], ['/en/', '5-act'], ['/menu/', '4-rate'], ['/thien-vien-truc-lam/', '1-orient']]) {
  await moTrang(duong);
  const cfg = JSON.parse(await ev(`(function(){
    window.dispatchEvent(new Event('scroll'));   // nhanh tuong tac cua doan GA: nap ngay
    return JSON.stringify((window.dataLayer || []).filter(function(x){ return x[0] === 'config'; })
      .map(function(x){ return Array.prototype.slice.call(x); }));
  })()`));
  const cg = cfg.length === 1 ? (cfg[0][2] || {}).content_group : undefined;
  bao(duong + ' -> config gui content_group=' + mongDoi, cfg.length === 1 && cg === mongDoi, 'config: ' + JSON.stringify(cfg));
}

console.log('\n=== MANG ===');
console.log('  request toi Google bi chan: ' + soChan + ' | request Apps Script bi giu lai: ' + soAppsScript);
if (soChan === 0) bao('Harness co that su chan request ra Google', false, 'khong chan duoc lan nao — hoac trang khong con the GA');
else bao('Khong co request nao ra Google lot luoi', true);

const hong = kq.filter((k) => !k.dat);
console.log('\n' + (kq.length - hong.length) + '/' + kq.length + ' phep thu DAT');
if (hong.length) { console.log('HONG:'); hong.forEach((h) => console.log('  - ' + h.ten)); }

if (!GIU_CHROME) { ws.close(); chrome.kill(); server.close(); }
process.exit(hong.length ? 1 : 0);
