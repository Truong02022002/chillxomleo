// Dat cac header bao mat con thieu (muc 166, 167, 168, 171, 173) qua API Cloudflare.
//
// Vi sao can file nay: site chay GitHub Pages dat sau Cloudflare. GitHub Pages
// KHONG cho dat header tuy y, va file `_headers` cung khong co tac dung o day
// (do la co che cua Cloudflare Pages / Netlify, khac han). Nen nhung header nay
// bat buoc phai dat o Cloudflare. Script nay lam thay viec bam tay trong dashboard.
//
// Nhung thu KHONG can file nay vi da lam bang the meta trong HTML roi:
//   - Content-Security-Policy (muc 169)
//   - Referrer-Policy (muc 170)
// Rieng `frame-ancestors` thi the meta bi trinh duyet BO QUA, nen chong nhung
// (muc 168) van phai dat bang header — script nay dung X-Frame-Options.
//
// Cach dung:
//   set CF_API_TOKEN=...            (Windows CMD)   hoac
//   $env:CF_API_TOKEN="..."         (PowerShell)    hoac
//   export CF_API_TOKEN=...         (bash)
//   node tools/dat-header-bao-mat.mjs           # chi XEM se doi gi, khong ghi
//   node tools/dat-header-bao-mat.mjs --apply   # ghi that
//   node tools/dat-header-bao-mat.mjs --verify  # chi do lai header hien tai
//
// Token can quyen (Cloudflare > My Profile > API Tokens > Create Custom Token):
//   Zone / Zone            / Read
//   Zone / Zone Settings   / Edit      <- de bat HSTS + nosniff
//   Zone / Transform Rules / Edit      <- de them X-Frame-Options, Permissions-Policy
//   Zone Resources: Include / Specific zone / xomleo.vn

const ZONE = 'xomleo.vn';
const API = 'https://api.cloudflare.com/client/v4';
const TOKEN = process.env.CF_API_TOKEN || '';
const APPLY = process.argv.includes('--apply');
const CHI_DO = process.argv.includes('--verify');

// Ten quy tac — dung de tim lai dung quy tac cua minh, khong dam vao quy tac khac.
const TEN_QUY_TAC = 'Header bao mat (checklist muc 167-173)';

const DAT = {
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
};
// Muc 173: bot lo ha tang ben duoi (GitHub Pages + Fastly).
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

async function doHeaderThat() {
  const r = await fetch('https://' + ZONE + '/', { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0' } });
  const h = r.headers;
  const CAN = [
    ['strict-transport-security', '166 HSTS'],
    ['x-content-type-options', '167 nosniff'],
    ['x-frame-options', '168 chong nhung'],
    ['content-security-policy', '169 CSP (dang lam bang the meta, header co the trong)'],
    ['referrer-policy', '170 Referrer-Policy (dang lam bang the meta)'],
    ['permissions-policy', '171 Permissions-Policy']
  ];
  console.log('\n--- header that su cua https://' + ZONE + '/ ---');
  for (const [k, nhan] of CAN) {
    const v = h.get(k);
    console.log('  ' + (v ? 'CO   ' : 'THIEU') + ' ' + nhan.padEnd(52) + (v ? ': ' + v.slice(0, 90) : ''));
  }
  const lo = GO_BO.filter(k => h.get(k));
  console.log('  header con lo ha tang (muc 173): ' + (lo.length ? lo.join(', ') : 'khong con'));
}

(async () => {
  if (CHI_DO) { await doHeaderThat(); return; }
  if (!TOKEN) {
    console.error('Thieu CF_API_TOKEN. Xem huong dan o dau file nay.');
    console.error('Muon xem hien trang ma khong can token: node tools/dat-header-bao-mat.mjs --verify');
    process.exit(1);
  }

  const zones = await cf('/zones?name=' + encodeURIComponent(ZONE));
  if (!zones.length) throw new Error('Khong tim thay zone ' + ZONE + ' voi token nay');
  const zid = zones[0].id;
  console.log('zone ' + ZONE + ' -> ' + zid);

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
  const canDoiHsts = JSON.stringify(muon) !== JSON.stringify({ ...muon, ...hien, enabled: !!hien.enabled });
  if (APPLY) {
    await cf('/zones/' + zid + '/settings/security_header', {
      method: 'PATCH',
      body: JSON.stringify({ value: { strict_transport_security: muon } })
    });
    console.log('   -> da dat: HSTS max-age 31536000, nosniff bat, KHONG includeSubDomains/preload');
  } else {
    console.log('   -> SE dat: HSTS max-age 31536000, nosniff bat, KHONG includeSubDomains/preload');
  }

  // --- 168 + 171 + 173: quy tac bien doi header phan hoi ---
  const duongRs = '/zones/' + zid + '/rulesets/phases/http_response_headers_transform/entrypoint';
  let rs;
  try { rs = await cf(duongRs); } catch (e) { rs = { rules: [] }; }
  const cu = (rs.rules || []).filter(r => r.description !== TEN_QUY_TAC);
  console.log('\n[168/171/173] quy tac header phan hoi:');
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
  } else {
    console.log('   -> chua ghi (them --apply de ghi that)');
  }

  if (APPLY) {
    console.log('\nDoi vai giay cho Cloudflare ap dung roi do lai...');
    await new Promise(r => setTimeout(r, 8000));
    await doHeaderThat();
  } else {
    console.log('\n--- hien trang truoc khi doi ---');
    await doHeaderThat();
    console.log('\nChay lai voi --apply de ghi that.');
  }
})().catch(e => { console.error('\nLOI: ' + e.message); process.exit(1); });
