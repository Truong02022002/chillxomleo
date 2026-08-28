import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['.git', '.claude', 'node_modules', 'skills', 'tools', 'uploads', 'img', 'css', 'js', 'fonts']);

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

const findings = { deadAnchor: [], brokenLink: [], orphan: [], sitemapMissing: [], sitemapStale: [], badJson: [], danglingToc: [], h1: [], dupTitle: [], hreflang: [], emptyHref: [] };
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

for (const f of files) {
  const s = stripped.get(f);
  const body = s.slice(s.indexOf('<body'));
  const main = s.includes('</main>') ? s.slice(s.indexOf('<main'), s.indexOf('</main>')) : body;

  // 1) JSON-LD validity
  for (const [i, m] of [...s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].entries()) {
    try { JSON.parse(m[1]); } catch (e) { findings.badJson.push(`${f} block#${i + 1}: ${e.message.slice(0, 70)}`); }
  }

  const stub = /meta http-equiv="refresh"/i.test(s);
  // 2) H1 count
  const h1 = (s.match(/<h1[\s>]/g) || []).length;
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
}

// 9) orphans — indexable canonical pages with no inbound internal link
for (const [route, f] of pages) {
  if (route === '/' || skipPage(route, f)) continue;
  if (!inbound.get(route)) findings.orphan.push(`${route}  (${f})`);
}

for (const [t, fs_] of titles) if (fs_.length > 1) findings.dupTitle.push(`"${t.slice(0, 60)}" -> ${fs_.join(', ')}`);

// ---- report ----
const LABEL = {
  badJson: 'JSON-LD hỏng', brokenLink: 'Link nội bộ hỏng', deadAnchor: 'Text CTA mất href',
  emptyHref: 'href rỗng', danglingToc: 'Anchor mục lục không tồn tại', orphan: 'Trang mồ côi (0 inbound)',
  sitemapMissing: 'Thiếu trong sitemap', sitemapStale: 'Sitemap trỏ trang không tồn tại',
  h1: 'H1 sai số lượng', dupTitle: 'Title trùng', hreflang: 'hreflang thiếu self-ref',
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
