// Dat cac cai dat bao mat con thieu (muc 165-173) qua API Cloudflare.
//
// Vi sao can file nay: site chay GitHub Pages dat sau Cloudflare. GitHub Pages
// KHONG cho dat header tuy y, va file `_headers` cung khong co tac dung o day
// (do la co che cua Cloudflare Pages / Netlify, khac han). Nen nhung thu nay
// bat buoc phai dat o Cloudflare. Script nay lam thay viec bam tay trong dashboard.
//
// Script nay dat:
//   165  TLS toi thieu 1.2 — do 10-09-2026: server VAN bat tay TLS 1.0 va 1.1
//   166  HSTS max-age 1 nam (KHONG includeSubDomains/preload)
//   167  X-Content-Type-Options: nosniff
//   168  CSP frame-ancestors 'self' + X-Frame-Options SAMEORIGIN (trinh duyet cu)
//   170  Referrer-Policy (the meta da co tren 133 trang; header de cong cu quet thay)
//   171  Permissions-Policy
//   173  go header lo ha tang ben duoi (GitHub Pages + Fastly)
//
// KHONG dat o day:
//   - Policy CSP that (script-src...) nam trong the meta cua tung trang, moi trang
//     co hash rieng — do tools/csp-hash.mjs quan ly. Header CSP o day CHI co
//     frame-ancestors (the meta bi trinh duyet bo qua directive nay). Hai policy
//     cung ap dung, trinh duyet lay phan giao, nen khong dung nhau.
//   - Bo cipher CBC con lai trong TLS 1.2 (ECDHE-ECDSA-AES128-SHA...): goi Free
//     KHONG cho tuy chinh cipher, can Advanced Certificate Manager.
//   - Header `Server: cloudflare`: Cloudflare cam sua; no khong lo phien ban.
//
// Cach dung:
//   node tools/dat-header-bao-mat.mjs --verify  # chi DO hien trang, khong can token
//   set CF_API_TOKEN=...            (Windows CMD)   hoac
//   $env:CF_API_TOKEN="..."         (PowerShell)    hoac
//   export CF_API_TOKEN=...         (bash)
//   node tools/dat-header-bao-mat.mjs           # xem se doi gi, khong ghi
//   node tools/dat-header-bao-mat.mjs --apply   # ghi that, roi tu do lai
//
// Token can quyen (Cloudflare > My Profile > API Tokens > Create Custom Token):
//   Zone / Zone            / Read
//   Zone / Zone Settings   / Edit      <- TLS toi thieu, HSTS, nosniff
//   Zone / Transform Rules / Edit      <- cac header con lai
//   Zone Resources: Include / Specific zone / xomleo.vn

import tls from 'node:tls';

const ZONE = 'xomleo.vn';
const API = 'https://api.cloudflare.com/client/v4';
const TOKEN = process.env.CF_API_TOKEN || '';
const APPLY = process.argv.includes('--apply');
const CHI_DO = process.argv.includes('--verify');

// Ten quy tac — dung de tim lai dung quy tac cua minh, khong dam vao quy tac khac.
const TEN_QUY_TAC = 'Header bao mat (checklist muc 167-173)';

const DAT = {
  'Content-Security-Policy': "frame-ancestors 'self'",
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Site khong dung API nao trong nay (chu "geolocation" duy nhat trong repo la
  // chu trong bai viet). Iframe Maps khong co allow=, YouTube khong can may cai nay.
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
};
const GO_BO = ['via', 'x-served-by', 'x-fastly-request-id', 'x-github-request-id', 'x-github-edge-region', 'x-timer', 'x-cache', 'x-cache-hits', 'x-proxy-cache'];

async function cf(duong, tuyChon = {}) {
  const r = await fetch(API + duong, {
    ...tuyChon,
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json', ...(tuyChon.headers || {}) }
  });
  let j; try { j = await r.json(); } catch (e) { j = { success: false, errors: [{ message: 'phan hoi khong phai JSON, HTTP ' + r.status }] }; }
  if (!j.success) {
    const msg = (j.errors || []).map(e => e.code + ': ' + e.message).join(' | ') || ('HTTP ' + r.status);
    throw new Error(msg);
  }
  return j.result;
}

// OpenSSL 3 phia CLIENT tu tat TLS 1.0/1.1 o muc bao mat mac dinh, nen `openssl
// s_client -tls1` bao "no protocols available" ma CHUA he gui gi — phien 10-09
// sang da doc nham thanh "server tu choi". Phai ha SECLEVEL=0, va phai co doi
// chung: mot server chi nghe TLS 1.0 ma cung "tu choi" thi la may do hong.
function thuTls(host, port, ver) {
  return new Promise((xong) => {
    const s = tls.connect({ host, port, servername: host, minVersion: ver, maxVersion: ver, ciphers: 'ALL:@SECLEVEL=0' },
      () => { const p = s.getProtocol(); s.end(); xong(p === ver ? 'nhan' : 'la: ' + p); });
    s.on('error', () => xong('tu choi'));
    s.setTimeout(8000, () => { s.destroy(); xong('het gio'); });
  });
}

async function doHienTrang() {
  console.log('\n--- TLS cua ' + ZONE + ' (muc 165) ---');
  const doiChung = await thuTls('tls-v1-0.badssl.com', 1010, 'TLSv1');
  for (const v of ['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3']) {
    const kq = await thuTls(ZONE, 443, v);
    const tot = (v === 'TLSv1' || v === 'TLSv1.1') ? kq !== 'nhan' : kq === 'nhan';
    console.log('  ' + (tot ? 'DAT  ' : 'LOI  ') + v.padEnd(8) + kq);
  }
  if (doiChung !== 'nhan') console.log('  ! doi chung (server chi co TLS 1.0) cung khong ket noi duoc -> ket qua TLS 1.0/1.1 o tren KHONG dang tin');

  const TRANG = ['/', '/css/site.css', '/khong-ton-tai-kiem-header/'];
  for (const duong of TRANG) {
    const r = await fetch('https://' + ZONE + duong, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/128.0' }, redirect: 'manual' });
    const h = r.headers;
    console.log('\n--- header that cua https://' + ZONE + duong + ' (HTTP ' + r.status + ') ---');
    const hsts = h.get('strict-transport-security') || '';
    const tuoi = Number((hsts.match(/max-age=(\d+)/i) || [])[1] || 0);
    const dong = [
      ['166 HSTS', hsts ? tuoi >= 31536000 : false, hsts],
      ['167 nosniff', /nosniff/i.test(h.get('x-content-type-options') || ''), h.get('x-content-type-options')],
      ['168 frame-ancestors (header CSP)', /frame-ancestors/i.test(h.get('content-security-policy') || ''), h.get('content-security-policy')],
      ['168 X-Frame-Options', !!h.get('x-frame-options'), h.get('x-frame-options')],
      ['170 Referrer-Policy (header)', !!h.get('referrer-policy'), h.get('referrer-policy')],
      ['171 Permissions-Policy', !!h.get('permissions-policy'), h.get('permissions-policy')]
    ];
    for (const [nhan, ok, v] of dong) console.log('  ' + (ok ? 'CO   ' : 'THIEU') + ' ' + nhan.padEnd(34) + (v ? ': ' + v.slice(0, 80) : ''));
    const lo = GO_BO.filter(k => h.get(k));
    console.log('  173 header lo ha tang: ' + (lo.length ? lo.join(', ') : 'khong con'));
  }
}

(async () => {
  if (CHI_DO) { await doHienTrang(); return; }
  if (!TOKEN) {
    console.error('Thieu CF_API_TOKEN. Xem huong dan o dau file nay.');
    console.error('Muon xem hien trang ma khong can token: node tools/dat-header-bao-mat.mjs --verify');
    process.exit(1);
  }

  const zones = await cf('/zones?name=' + encodeURIComponent(ZONE));
  if (!zones.length) throw new Error('Khong tim thay zone ' + ZONE + ' voi token nay');
  const zid = zones[0].id;
  console.log('zone ' + ZONE + ' -> ' + zid);

  // --- 165: TLS toi thieu ---
  const tlsMin = await cf('/zones/' + zid + '/settings/min_tls_version');
  console.log('\n[165] TLS toi thieu hien tai: ' + tlsMin.value);
  if (APPLY) {
    await cf('/zones/' + zid + '/settings/min_tls_version', { method: 'PATCH', body: JSON.stringify({ value: '1.2' }) });
    console.log('   -> da dat 1.2 (TLS 1.0/1.1 bi tu choi)');
  } else {
    console.log('   -> SE dat 1.2');
  }

  // --- 166 + 167: HSTS va nosniff nam trong CUNG mot cai dat cua Cloudflare ---
  const ht = await cf('/zones/' + zid + '/settings/security_header');
  const hien = (ht.value && ht.value.strict_transport_security) || {};
  console.log('\n[166/167] cai dat security_header hien tai:');
  console.log('   HSTS bat        : ' + !!hien.enabled + (hien.max_age ? ' (max_age ' + hien.max_age + ')' : ''));
  console.log('   includeSubDomains: ' + !!hien.include_subdomains + '   preload: ' + !!hien.preload);
  console.log('   nosniff         : ' + !!hien.nosniff);
  const muon = {
    enabled: true,
    max_age: 31536000,
    // CO Y de false: chi bat khi CHAC moi subdomain deu chay HTTPS.
    // preload thi kho rut lai (phai cho Google go khoi danh sach), dung bat voi.
    include_subdomains: false,
    preload: false,
    nosniff: true
  };
  if (APPLY) {
    await cf('/zones/' + zid + '/settings/security_header', {
      method: 'PATCH',
      body: JSON.stringify({ value: { strict_transport_security: muon } })
    });
    console.log('   -> da dat: HSTS max-age 31536000, nosniff bat, KHONG includeSubDomains/preload');
  } else {
    console.log('   -> SE dat: HSTS max-age 31536000, nosniff bat, KHONG includeSubDomains/preload');
  }

  // --- 168 + 170 + 171 + 173: quy tac bien doi header phan hoi ---
  const duongRs = '/zones/' + zid + '/rulesets/phases/http_response_headers_transform/entrypoint';
  let rs;
  try { rs = await cf(duongRs); } catch (e) { rs = { rules: [] }; }
  const cu = (rs.rules || []).filter(r => r.description !== TEN_QUY_TAC);
  console.log('\n[168/170/171/173] quy tac header phan hoi:');
  console.log('   quy tac khac dang co (giu nguyen): ' + cu.length);

  const headers = {};
  for (const [k, v] of Object.entries(DAT)) headers[k] = { operation: 'set', value: v };
  for (const k of GO_BO) headers[k] = { operation: 'remove' };

  const quyTac = {
    action: 'rewrite',
    action_parameters: { headers },
    expression: 'true',
    description: TEN_QUY_TAC,
    enabled: true
  };
  console.log('   se dat  : ' + Object.keys(DAT).join(', '));
  console.log('   se go bo: ' + GO_BO.join(', '));

  if (APPLY) {
    await cf(duongRs, { method: 'PUT', body: JSON.stringify({ rules: [...cu, quyTac] }) });
    console.log('   -> da ghi quy tac');
    console.log('\nDoi vai giay cho Cloudflare ap dung roi do lai...');
    await new Promise(r => setTimeout(r, 8000));
    await doHienTrang();
  } else {
    console.log('   -> chua ghi (them --apply de ghi that)');
    console.log('\n--- hien trang truoc khi doi ---');
    await doHienTrang();
    console.log('\nChay lai voi --apply de ghi that.');
  }
})().catch(e => { console.error('\nLOI: ' + e.message); process.exit(1); });
