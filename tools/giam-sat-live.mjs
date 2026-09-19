#!/usr/bin/env node
/**
 * Giam sat do luong tren SITE THAT (muc 283 cua cam nang): chay hang tuan bang
 * .github/workflows/giam-sat-do-luong.yml, loi thi workflow do va GitHub gui mail.
 *
 * Ly do ton tai: kiem-do-luong.mjs chi kiem FILE TRONG REPO sau moi push, va gia lap
 * webhook dat ban. Nhung thu lam hong du lieu nam ngoai repo thi khong ai bao:
 *   - Webhook Apps Script bi go trien khai / het quota -> khach gui form bao loi,
 *     generate_lead ve 0, ma khong co commit nao de CI bat.
 *   - Pages deploy ket hoac Cloudflare giu ban JS cu -> site that chay code do
 *     luong cu (da vap: xem ghi chu "cache nhiem ban cu").
 *   - Ai do them the theo doi (Pixel, Clarity, Zaraz...) ngoai hop dong du lieu.
 *
 * Chi DOC, khong gui don dat ban nao: webhook chi duoc hoi bang GET (doGet la trang
 * kiem suc khoe, tra {"status":"ok",...}). Chi tai file JS ma HTML SONG dang tro toi
 * — khong bao gio goi URL co hash lay tu repo, vi goi truoc khi Pages deploy xong se
 * nhet ban cu vao cache Cloudflare duoi khoa moi.
 *
 * Cach dung:  node tools/giam-sat-live.mjs     (exit 1 neu co muc HONG)
 * Hop dong du lieu: tools/do-luong.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://xomleo.vn';
const GA_ID = 'G-YWGENK065S';
const UA = 'Mozilla/5.0 (compatible; xomleo-giam-sat/1.0; +https://xomleo.vn/)';
// Hop dong du lieu noi site KHONG dung cac cong cu nay. Them cong cu thi sua
// tools/do-luong.md truoc, roi moi go khoi danh sach.
const TRACKER_NGOAI = /connect\.facebook\.net|fbevents\.js|fbq\(|clarity\.ms|static\.hotjar\.com|hotjar\.com\/c\/|analytics\.tiktok\.com|ttq\.load|\/cdn-cgi\/zaraz|static\.cloudflareinsights\.com\/beacon|GTM-[A-Z0-9]{4,}/;

const kq = [];
const bao = (ten, dat, chiTiet = '') => { kq.push({ ten, dat }); console.log((dat ? '  DAT  ' : '  HONG ') + ten + (chiTiet ? ' | ' + chiTiet : '')); };
const ghiChu = (s) => console.log('  ---  ' + s);
const sha = (s) => crypto.createHash('sha256').update(s.replace(/\r\n/g, '\n')).digest('hex').slice(0, 12);
async function tai(url, opts = {}) {
  const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow', ...opts });
  return { res, text: await res.text() };
}

// 1. Webhook dat ban. URL lay tu js/main.js (hang so base64 `_0x`) de khong phai
//    khai lai o hai noi.
console.log('=== WEBHOOK DAT BAN ===');
try {
  const m = fs.readFileSync(path.join(ROOT, 'js/main.js'), 'utf8').match(/const _0x = '([A-Za-z0-9+/=]+)'/);
  if (!m) throw new Error('khong tim thay hang so _0x trong js/main.js');
  const url = Buffer.from(m[1], 'base64').toString();
  const { res, text } = await tai(url, { headers: { origin: SITE } });
  let data = null;
  try { data = JSON.parse(text); } catch (e) { /* khong phai JSON */ }
  bao('doGet tra {"status":"ok"}', res.ok && data?.status === 'ok', res.status + ' ' + text.slice(0, 90).replace(/\s+/g, ' '));
  // Form doc tra loi cua doPost bang CORS; thieu header nay la moi don se ra 'khong_ro'
  // va generate_lead ve 0.
  bao('Tra loi co Access-Control-Allow-Origin', res.headers.get('access-control-allow-origin') === '*', 'ACAO=' + res.headers.get('access-control-allow-origin'));
} catch (e) { bao('Goi duoc webhook', false, e.message); }

// 2. Trang song: the GA dung, JS do luong dung ban voi repo, khong co tracker la.
console.log('\n=== TRANG SONG ===');
const daKiemJs = new Set();
for (const p of ['/', '/en/', '/menu/', '/quan-nuong-da-lat-view-xe-lua/']) {
  try {
    const { res, text } = await tai(SITE + p);
    const repoHtml = fs.readFileSync(path.join(ROOT, p, 'index.html'), 'utf8');
    const soGa = (text.match(new RegExp('gtag/js\\?id=' + GA_ID, 'g')) || []).length;
    bao(p + ' tai the ' + GA_ID + ' dung 1 lan', res.ok && soGa === 1, 'HTTP ' + res.status + ', ' + soGa + ' lan');

    const refSong = (text.match(/main\.min\.js\?(h[0-9a-f]+)/) || [])[1];
    const refRepo = (repoHtml.match(/main\.min\.js\?(h[0-9a-f]+)/) || [])[1];
    bao(p + ' tro cung ban main.min.js voi repo', !!refSong && refSong === refRepo, 'song ' + refSong + ' / repo ' + refRepo);

    const la = text.match(TRACKER_NGOAI);
    bao(p + ' khong co the theo doi ngoai hop dong', !la, la ? 'thay: ' + la[0] : '');

    if (refSong && !daKiemJs.has(refSong)) {
      daKiemJs.add(refSong);
      const { res: rj, text: js } = await tai(SITE + '/js/main.min.js?' + refSong);
      const ban = fs.readFileSync(path.join(ROOT, 'js/main.min.js'), 'utf8');
      // Hash noi dung chi so duoc khi HTML song va repo cung tro mot ban; lech thi
      // muc tren da HONG roi, so tiep chi ra bao dong trung.
      if (refSong === refRepo) bao('main.min.js?' + refSong + ' song khop repo tung byte', rj.ok && sha(js) === sha(ban), 'song ' + sha(js) + ' / repo ' + sha(ban));
      bao('main.min.js song con khoi do luong', /generate_lead/.test(js) && /click_call/.test(js), rj.status + '');
    }
  } catch (e) { bao(p + ' tai duoc', false, e.message); }
}

// 3. gtag.js cua Google van phuc vu dung property.
console.log('\n=== GOOGLE TAG ===');
try {
  const { res, text } = await tai('https://www.googletagmanager.com/gtag/js?id=' + GA_ID);
  bao('gtag.js tra ve cho ' + GA_ID, res.ok && text.includes(GA_ID), 'HTTP ' + res.status + ', ' + text.length + ' byte');
  const dich = [...new Set([...text.matchAll(/"vtp_instanceDestinationId":"([^"]+)"/g)].map((x) => x[1]))];
  // Khong phai loi: connected tag cau hinh phia Google. In ra de thay khi no doi.
  ghiChu('property nhan du lieu: ' + dich.join(', ') + (dich.length > 1 ? '  (connected tag — xem tools/do-luong.md muc 2)' : ''));
} catch (e) { bao('Tai duoc gtag.js', false, e.message); }

const hong = kq.filter((k) => !k.dat);
console.log('\n' + (kq.length - hong.length) + '/' + kq.length + ' muc DAT');
if (hong.length) { console.log('HONG:'); hong.forEach((h) => console.log('  - ' + h.ten)); }
process.exit(hong.length ? 1 : 0);
