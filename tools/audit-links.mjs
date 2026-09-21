import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
// 'hang-doi' la ban nhap cho ngay dang, chua phai trang cua site — neu quet vao
// se bao trung title / mo coi voi chinh ban da dang.
const SKIP = new Set(['.git', '.claude', 'node_modules', 'skills', 'tools', 'uploads', 'img', 'css', 'js', 'fonts', 'hang-doi']);

// ---- collect page files ----
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP.has(e.name)) continue;
      walk(path.join(dir, e.name), out);
    } else if (e.name.endsWith('.html')) out.push(path.join(dir, e.name));
  }
  return out;
}
const files = walk(ROOT).map(f => path.relative(ROOT, f).split(path.sep).join('/'));
const pages = new Map(); // route -> file
for (const f of files) {
  const route = f === 'index.html' ? '/' : '/' + f.replace(/\/index\.html$/, '/').replace(/^index\.html$/, '');
  pages.set(route, f);
}

const findings = { deadAnchor: [], brokenLink: [], orphan: [], sitemapMissing: [], sitemapStale: [], badJson: [], danglingToc: [], h1: [], dupTitle: [], hreflang: [], emptyHref: [], iframeTitle: [], langSwitch: [], crossLang: [], robotsMeta: [], dupFaq: [] };
const faqBlocks = new Map(); // danh sach cau hoi cua khoi FAQ -> cac trang
const inbound = new Map(); // route -> count
const titles = new Map();

const stripped = new Map();
for (const f of files) stripped.set(f, fs.readFileSync(f, 'utf8'));

// routes that exist (normalise trailing slash)
const norm = (r) => {
  if (!r.startsWith('/')) return null;
  r = r.split('#')[0].split('?')[0];
  if (r === '') r = '/';
  if (r !== '/' && !r.endsWith('/') && !r.includes('.')) r += '/';
  return r;
};
const exists = (r) => {
  if (r === '/') return files.includes('index.html');
  const asDir = r.replace(/^\//, '').replace(/\/$/, '') + '/index.html';
  if (files.includes(asDir)) return true;
  const asFile = r.replace(/^\//, '');
  return fs.existsSync(path.join(ROOT, decodeURIComponent(asFile)));
};

// ngon ngu + cap VI<->EN cua tung trang, doc tu <html lang> va <link rel="alternate" hreflang>
const pathOf = (u) => u.replace('https://xomleo.vn', '');
const langOf = new Map();   // route -> 'vi' | 'en'
const altOf = new Map();    // route -> { vi, en }
for (const [route, f] of pages) {
  const s = stripped.get(f);
  langOf.set(route, (s.match(/<html[^>]*\slang="([a-z]+)/) || [])[1]);
  const vi = (s.match(/<link rel="alternate" hreflang="vi" href="([^"]+)"/) || [])[1];
  const en = (s.match(/<link rel="alternate" hreflang="en" href="([^"]+)"/) || [])[1];
  if (vi && en) altOf.set(route, { vi: pathOf(vi), en: pathOf(en) });
}

for (const f of files) {
  const s = stripped.get(f);
  const body = s.slice(s.indexOf('<body'));
  const route = f === 'index.html' ? '/' : '/' + f.replace(/index\.html$/, '');

  // Nut doi ngon ngu VN|EN phai tro ve dung cap hreflang cua CHINH trang. Bai nhom dong
  // (18-09-2026) chep nav tu bai khung nen nut "EN" nhay sang bai view xe lua.
  const alt = altOf.get(route);
  if (alt) {
    for (const m of body.matchAll(/<a\s+href="([^"]*)"\s+hreflang="(vi|en)"/g)) {
      if (m[1] !== alt[m[2]]) findings.langSwitch.push(`${f}: nut ${m[2]} -> ${m[1]}, dung ra ${alt[m[2]]}`);
    }
  }
  const main = s.includes('</main>') ? s.slice(s.indexOf('<main'), s.indexOf('</main>')) : body;

  // 1) JSON-LD validity
  for (const [i, m] of [...s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].entries()) {
    try { JSON.parse(m[1]); } catch (e) { findings.badJson.push(`${f} block#${i + 1}: ${e.message.slice(0, 70)}`); }
  }

  const stub = /meta http-equiv="refresh"/i.test(s);
  // 2) H1 count
  // bo chu thich truoc khi dem: index.html co chu <h1> nam trong mot comment giai thich
  // ve LCP, khong phai the that — dem thang tren `s` thi bao nham "2 x H1".
  const h1 = (s.replace(/<!--[\s\S]*?-->/g, ' ').match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1 && !stub) findings.h1.push(`${f}: ${h1} x H1`);

  // 3) duplicate <title>
  const t = (s.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (t && !stub) { if (!titles.has(t)) titles.set(t, []); titles.get(t).push(f); }

  // 4) dangling in-page anchors (TOC)
  for (const m of main.matchAll(/<a href="#([^"]+)"/g)) {
    if (!s.includes(`id="${m[1]}"`)) findings.danglingToc.push(`${f} -> #${m[1]}`);
  }

  // 5) links: broken internal + inbound tally — whole body, so nav and footer count too
  for (const m of body.matchAll(/<a\s([^>]*?)>/g)) {
    const attrs = m[1];
    const hm = attrs.match(/href="([^"]*)"/);
    if (!hm) continue;
    const href = hm[1].trim();
    if (href === '' || href === '#') { findings.emptyHref.push(`${f}: href="${href}"`); continue; }
    if (/^(https?:|mailto:|tel:|javascript:)/.test(href)) {
      if (href.startsWith('https://xomleo.vn/')) {
        const r = norm(href.replace('https://xomleo.vn', ''));
        if (r) { if (!exists(r)) findings.brokenLink.push(`${f} -> ${href}`); else inbound.set(r, (inbound.get(r) || 0) + 1); }
      }
      continue;
    }
    if (href.startsWith('#')) continue;
    if (href.startsWith('/')) {
      const r = norm(href);
      if (r && !exists(r)) findings.brokenLink.push(`${f} -> ${href}`);
      else if (r) inbound.set(r, (inbound.get(r) || 0) + 1);
    }
  }

  // 5b) link trong than bai sang trang KHAC ngon ngu trong khi trang dich co ban dich cung
  //     ngon ngu voi trang nguon. Dem 21-09-2026: 26 link trong 18 trang EN tro sang ban VI
  //     (12 cai la "directions" -> /duong-di/ thay vi /en/directions/). Nut doi ngon ngu co
  //     thuoc tinh hreflang nen duoc bo qua. 404.html co y song ngu (chi duong ca VI lan EN).
  const lang = langOf.get(route);
  if (lang && f !== '404.html' && !/meta http-equiv="refresh"/i.test(s)) {
    for (const m of main.matchAll(/<a\b([^>]*)>/g)) {
      if (/hreflang=/.test(m[1])) continue;
      const hm = m[1].match(/href="([^"]*)"/);
      if (!hm) continue;
      const href = hm[1].trim();
      const r = href.startsWith('https://xomleo.vn') ? norm(href.replace('https://xomleo.vn', '') || '/')
        : href.startsWith('/') ? norm(href) : null;
      if (!r || !pages.has(r)) continue;
      const tl = langOf.get(r);
      const ta = altOf.get(r);
      if (tl && tl !== lang && ta && ta[lang] && ta[lang] !== r) findings.crossLang.push(`${f}: ${href} -> nen la ${ta[lang]}`);
    }
  }

  // 5c) khoi hoi dap y het nhau tren hai trang = noi dung chep. tools/tao-bai-nhap.mjs tung
  //     chep khoi "Giai dap nhanh" cua bai khung (view xe lua) sang bai nhom dong (18-09-2026).
  if (!/meta http-equiv="refresh"/i.test(s)) {
    for (const m of body.matchAll(/<section id="faq"[\s\S]*?<\/section>/g)) {
      const qs = [...m[0].matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g)].map(x => x[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
      if (!qs.length) continue;
      const k = qs.join(' | ');
      if (!faqBlocks.has(k)) faqBlocks.set(k, []);
      faqBlocks.get(k).push(f);
    }
  }

  // 6) "call to action" text that lost its href — <em>/<strong> wrappers with link-ish words.
  const LINKY = /(Tại Đây|Xem bản đồ|Xem Chỉ Đường|Xem chỉ đường|See map|See Directions|Here|Book now|Đặt bàn ngay|Xem thêm)/;
  for (const m of main.matchAll(/<(em|strong)>([^<]{2,40})<\/\1>/g)) {
    //    A label like <strong>Xem Chỉ Đường:</strong> is fine when the <a> sits beside it rather than
    //    inside it, so only flag when the enclosing <p> carries no href at all.
    if (!LINKY.test(m[2])) continue;
    const pStart = main.lastIndexOf('<p', m.index);
    const pEnd = main.indexOf('</p>', m.index);
    const block = main.slice(pStart === -1 ? Math.max(0, m.index - 300) : pStart,
                             pEnd === -1 ? m.index + 300 : pEnd);
    if (block.includes('href=')) continue;
    findings.deadAnchor.push(`${f}: <${m[1]}>${m[2]}</${m[1]}>`);
  }

  // 7) hreflang self-reference
  const canon = (s.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (canon) {
    const alts = [...s.matchAll(/<link rel="alternate" hreflang="[^"]+" href="([^"]+)"/g)].map(m => m[1]);
    if (alts.length && !alts.includes(canon)) findings.hreflang.push(`${f}: canonical ${canon} not among hreflang alts`);
  }
}

// 8) sitemap coverage
const sm = fs.readFileSync('sitemap.xml', 'utf8');
const smLocs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const smRoutes = new Set(smLocs.map(u => norm(u.replace('https://xomleo.vn', ''))));
for (const u of smLocs) {
  const r = norm(u.replace('https://xomleo.vn', ''));
  if (r && !exists(r)) findings.sitemapStale.push(u);
}
// pages that should be in the sitemap: real content pages, not stubs/404.
// A page whose canonical points elsewhere is a deliberately consolidated duplicate — a sitemap
// lists canonical URLs only, so its absence is correct, not a defect. Same for the orphan check:
// it is canonicalised away on purpose, so it needs no inbound links.
const isStub = (f) => /meta http-equiv="refresh"/i.test(stripped.get(f));
const crossCanonical = (route, f) => {
  const c = (stripped.get(f).match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  return c ? norm(c.replace('https://xomleo.vn', '')) !== route : false;
};
const skipPage = (route, f) =>
  f === '404.html' || isStub(f) || /noindex/.test(stripped.get(f)) || crossCanonical(route, f);

for (const [route, f] of pages) {
  if (skipPage(route, f)) continue;
  if (!smRoutes.has(route)) findings.sitemapMissing.push(`${route}  (${f})`);
  // Tu 16-09-2026 moi trang index duoc deu mo max-snippet/max-image-preview. Ban nhap soan
  // truoc ngay do len song thieu the (bai nhom dong 18-09) — chan o day.
  if (!/<meta name="robots" content="[^"]*max-snippet:-1/.test(stripped.get(f))) findings.robotsMeta.push(`${route}  (${f})`);
}

// 9) orphans — indexable canonical pages with no inbound internal link
for (const [route, f] of pages) {
  if (route === '/' || skipPage(route, f)) continue;
  if (!inbound.get(route)) findings.orphan.push(`${route}  (${f})`);
}

// iframe phai co title, va nhieu iframe tren cung trang phai co ten khac nhau —
// nguoi dung tro nang chi nghe title de biet dang o khung nao.
for (const [route, f] of pages) {
  const found = [...stripped.get(f).matchAll(/<iframe[^>]*>/g)].map(m => m[0]);
  if (!found.length) continue;
  const ts = found.map(x => (x.match(/title="([^"]*)"/) || [, null])[1]);
  ts.forEach((t, i) => { if (!t) findings.iframeTitle.push(`${route}: iframe #${i + 1} không có title`); });
  const co = ts.filter(Boolean);
  if (new Set(co).size < co.length) findings.iframeTitle.push(`${route}: ${co.length} iframe nhưng chỉ ${new Set(co).size} title khác nhau`);
}

for (const [t, fs_] of titles) if (fs_.length > 1) findings.dupTitle.push(`"${t.slice(0, 60)}" -> ${fs_.join(', ')}`);
for (const [q, fs_] of faqBlocks) if (fs_.length > 1) findings.dupFaq.push(`${fs_.join(', ')}: "${q.slice(0, 70)}…"`);

// ---- report ----
const LABEL = {
  badJson: 'JSON-LD hỏng', brokenLink: 'Link nội bộ hỏng', deadAnchor: 'Text CTA mất href',
  emptyHref: 'href rỗng', danglingToc: 'Anchor mục lục không tồn tại', orphan: 'Trang mồ côi (0 inbound)',
  sitemapMissing: 'Thiếu trong sitemap', sitemapStale: 'Sitemap trỏ trang không tồn tại',
  h1: 'H1 sai số lượng', dupTitle: 'Title trùng', hreflang: 'hreflang thiếu self-ref',
  iframeTitle: 'iframe thiếu title hoặc trùng title',
  langSwitch: 'Nút đổi ngôn ngữ trỏ sai trang', crossLang: 'Link thân bài sang trang khác ngôn ngữ',
  robotsMeta: 'Trang index được thiếu thẻ robots max-snippet',
  dupFaq: 'Khối hỏi đáp giống hệt trên nhiều trang',
};
console.log(`Quét ${files.length} file HTML, ${smLocs.length} URL sitemap\n`);
let total = 0;
for (const k of Object.keys(findings)) {
  const v = findings[k];
  total += v.length;
  console.log(`${v.length ? 'X' : 'OK'}  ${LABEL[k]}: ${v.length}`);
  for (const line of v.slice(0, 25)) console.log(`      ${line}`);
  if (v.length > 25) console.log(`      … và ${v.length - 25} dòng nữa`);
}
console.log(`\nTỔNG: ${total}`);
fs.writeFileSync(process.env.OUT || 'audit-findings.json', JSON.stringify(findings, null, 2));
