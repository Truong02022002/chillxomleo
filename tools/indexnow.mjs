// IndexNow: bao Bing/Copilot, Yandex, Seznam, Naver... (qua api.indexnow.org, mot noi gui
// la chia cho moi cong cu tham gia) nhung URL canonical vua THEM, SUA NOI DUNG THAT, hoac
// bi XOA / THOI INDEX giua hai commit.
//
// Vi sao khong gui "moi file .html da doi": gan nhu commit nao cung dong ~123 file (nhet
// CSS vao trang, hash CSP, menu dieu huong) ma khong doi chu nao trong bai. Gui ca 86 URL
// moi lan push dung la dieu IndexNow dan tranh. Tool nay so "dau van tay" cua tung trang:
// title, meta description, canonical, robots, hreflang + chu / anh (src+alt) / link trong
// <main> — da bo <nav> (breadcrumb, muc luc), <script> (ca JSON-LD), <style>, query
// cache-bust. Dau van tay giu nguyen thi khong gui.
//
// Chi trang tu canonical va khong noindex moi duoc gui (dung tap URL trong sitemap.xml);
// trang canonical cheo, stub chuyen huong, 404.html bi bo qua — tru khi truoc do no la
// trang index roi moi bi xoa / doi canonical, luc do gui URL cu de Bing cap nhat.
//
// Cach dung:
//   node tools/indexnow.mjs --tu <commit> [--den <commit>]          chi in danh sach, khong gui
//   node tools/indexnow.mjs --tu <commit> --den <commit> --cho-deploy --gui
//       (CI) doi den khi xomleo.vn da doi sang ban moi, kiem file khoa, roi moi gui
//   --cho-toi-da <giay>   thoi gian doi deploy, mac dinh 600
//
// Ma 200/202 chi co nghia la cong cu tim kiem DA NHAN URL, khong phai da crawl hay index.
// Trang thai crawl/index xem trong Bing Webmaster Tools > URL Inspection.

import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const SITE = 'https://xomleo.vn';
const HOST = 'xomleo.vn';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
// Ban nhap, cong cu, ban .md trung lap — khong phai trang cua site.
const BO_QUA = /^(hang-doi|tools|skills|node_modules|blog-translations(-en)?)\//;
const UA = 'Mozilla/5.0 (compatible; xomleo-indexnow/1.0; +https://xomleo.vn/)';

const args = process.argv.slice(2);
const lay = (ten, macDinh) => {
  const i = args.indexOf(ten);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : macDinh;
};
const TU = lay('--tu');
const DEN = lay('--den', 'HEAD');
const GUI = args.includes('--gui');
const CHO = args.includes('--cho-deploy');
const CHO_TOI_DA = Number(lay('--cho-toi-da', '600')) * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tomTat = [];
const ghi = (s = '') => { console.log(s); tomTat.push(s); };
function ketThuc(code) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + tomTat.join('\n') + '\n```\n');
  }
  process.exit(code);
}

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
function docTai(sha, p) {
  try {
    return execFileSync('git', ['show', `${sha}:${p}`], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null; // file khong ton tai o commit do
  }
}

// ---------- doc trang ----------
const giaiMa = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&');
function thuocTinh(the, ten) {
  const m = the.match(new RegExp(`\\s${ten}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? giaiMa(m[1] ?? m[2]) : null;
}
const boCacheBust = (u) => u.replace(/\?(h[0-9a-f]{6,}|v=?\d+)(?=#|$)/i, '');
const cungUrl = (a, b) => {
  try { return new URL(a).href === new URL(b).href; } catch { return false; }
};
const bam = (x) => crypto.createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 12);

function thongTin(html, url) {
  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  const meta = (ten) => {
    for (const t of metas) if ((thuocTinh(t, 'name') || '').toLowerCase() === ten) return thuocTinh(t, 'content');
    return null;
  };
  const links = html.match(/<link\b[^>]*>/gi) || [];
  const canonical = links
    .filter((t) => (thuocTinh(t, 'rel') || '').toLowerCase() === 'canonical')
    .map((t) => thuocTinh(t, 'href'))[0] || null;
  const hreflang = links
    .filter((t) => thuocTinh(t, 'hreflang'))
    .map((t) => `${thuocTinh(t, 'hreflang')}=${thuocTinh(t, 'href')}`).sort();
  const robots = (meta('robots') || '').toLowerCase().replace(/\s+/g, '');
  const refresh = metas.some((t) => (thuocTinh(t, 'http-equiv') || '').toLowerCase() === 'refresh');
  const title = giaiMa((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim();

  // Vung noi dung: <main>; trang nao thieu <main> thi lay <body> bo <footer>.
  let vung = html.match(/<main\b[^>]*>([\s\S]*)<\/main>/i)?.[1];
  if (vung == null) {
    vung = (html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html).replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ');
  }
  vung = vung
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|template|svg)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ');
  const anh = (vung.match(/<img\b[^>]*>/gi) || []).map((t) => `${(thuocTinh(t, 'src') || '').split('?')[0]}|${thuocTinh(t, 'alt') ?? ''}`);
  const lienKet = (vung.match(/<a\b[^>]*>/gi) || []).map((t) => boCacheBust(thuocTinh(t, 'href') || ''));
  const chu = giaiMa(vung.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

  const phan = {
    title: bam(title), 'mo ta': bam(meta('description') || ''), canonical: bam(canonical || ''),
    robots: bam(robots), hreflang: bam(hreflang), 'chu trong bai': bam(chu), anh: bam(anh), 'lien ket': bam(lienKet),
  };
  return {
    index: !!canonical && cungUrl(canonical, url) && !robots.includes('noindex') && !refresh,
    refresh, phan, van: bam(phan),
  };
}

// ---------- chon URL ----------
if (!TU || /^0+$/.test(TU)) { ghi('Khong co commit goc (--tu) — bo qua.'); ketThuc(0); }
let tuSha, denSha;
const revParse = (ref) => execFileSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
}).trim();
try {
  tuSha = revParse(TU);
  denSha = revParse(DEN);
} catch {
  ghi(`Khong tim thay commit "${TU}" hoac "${DEN}" (checkout thieu lich su, hay da force-push?).`);
  ketThuc(1);
}

const urlCuaFile = (p) => new URL(p.replace(/(^|\/)index\.html$/, '$1'), SITE + '/').href;
const doi = git('diff', '--name-only', '-z', '--no-renames', tuSha, denSha, '--', '*.html')
  .split('\0').filter(Boolean)
  .filter((p) => /(^|\/)index\.html$/.test(p) && !BO_QUA.test(p));

const guiDi = [];
const boQua = new Map();
const dem = (lyDo) => boQua.set(lyDo, (boQua.get(lyDo) || 0) + 1);
for (const p of doi) {
  const url = urlCuaFile(p);
  const cu = docTai(tuSha, p);
  const moi = docTai(denSha, p);
  const a = cu == null ? null : thongTin(cu, url);
  const b = moi == null ? null : thongTin(moi, url);
  if (b?.index && !a?.index) guiDi.push({ url, loai: a ? 'moi index' : 'trang moi', a, b });
  else if (a?.index && !b) guiDi.push({ url, loai: 'da xoa', a });
  else if (a?.index && !b.index) guiDi.push({ url, loai: 'thoi index', a, b });
  else if (a?.index && b?.index) {
    const khac = Object.keys(b.phan).filter((k) => a.phan[k] !== b.phan[k]);
    if (khac.length) guiDi.push({ url, loai: 'cap nhat', khac, a, b });
    else dem('chi doi ma / khung trang, noi dung giu nguyen');
  } else dem(a?.refresh || b?.refresh ? 'stub chuyen huong' : 'canonical cheo / noindex');
}

ghi(`IndexNow ${HOST}: ${tuSha.slice(0, 8)}..${denSha.slice(0, 8)} — ${doi.length} trang .html doi, ${guiDi.length} URL can gui`);
for (const m of guiDi) ghi(`  ${m.loai.padEnd(10)} ${m.url}${m.khac ? `  (${m.khac.join(', ')})` : ''}`);
for (const [lyDo, n] of boQua) ghi(`  bo qua ${n}: ${lyDo}`);

// lastmod: Bing dung lastmod de xep lich crawl — URL vua sua ma lastmod cu thi bao.
const sitemap = docTai(denSha, 'sitemap.xml') || '';
const lastmod = new Map([...sitemap.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map((m) => [m[1].trim(), m[2].trim()]));
const ngayDen = git('show', '-s', '--format=%cs', denSha).trim();
const canhBao = [];
for (const m of guiDi) {
  const lm = lastmod.get(m.url);
  if (['da xoa', 'thoi index'].includes(m.loai)) { if (lm) canhBao.push(`${m.url} da ${m.loai} nhung van con trong sitemap.xml`); continue; }
  if (!lm) canhBao.push(`${m.url} chua co trong sitemap.xml`);
  else if (lm < ngayDen && m.khac?.some((k) => ['chu trong bai', 'anh', 'title'].includes(k))) canhBao.push(`${m.url} doi noi dung ngay ${ngayDen} nhung lastmod van ${lm}`);
}
if (canhBao.length) { ghi(`Canh bao sitemap (${canhBao.length}):`); canhBao.forEach((c) => ghi('  ' + c)); }

if (!guiDi.length) { ghi('Khong co URL nao doi noi dung — khong gui.'); ketThuc(0); }
if (!GUI) { ghi('(chay thu — them --cho-deploy --gui de gui that)'); ketThuc(0); }
if (guiDi.length > 10000) { ghi('Qua 10.000 URL mot lan gui — kiem lai khoang commit.'); ketThuc(1); }

// ---------- khoa ----------
const tenKhoa = fs.readdirSync('.').find((f) => /^[0-9a-f]{32}\.txt$/.test(f) && fs.readFileSync(f, 'utf8').trim() === f.slice(0, 32));
if (!tenKhoa) { ghi('Khong thay file khoa <32 hex>.txt o goc repo.'); ketThuc(1); }
const KHOA = tenKhoa.slice(0, 32);
const VI_TRI_KHOA = `${SITE}/${tenKhoa}`;

// ---------- doi deploy ----------
async function layLive(url) {
  const r = await fetch(url, { redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
  return { status: r.status, body: r.status === 200 ? await r.text() : '' };
}
function daLen(m, live) {
  if (m.loai === 'da xoa') return live.status === 404;
  if (live.status !== 200) return m.loai === 'thoi index' && [301, 302, 404].includes(live.status);
  const t = thongTin(live.body, m.url);
  if (m.loai === 'thoi index') return !t.index;
  if (m.loai === 'cap nhat') return t.van !== m.a.van; // da khac ban cu (co the la ban con moi hon)
  return t.index;
}
async function theoLo(ds, n, fn) {
  const kq = new Array(ds.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, ds.length) }, async () => {
    while (i < ds.length) { const j = i++; kq[j] = await fn(ds[j]); }
  }));
  return kq;
}

if (CHO) {
  // Thu tu bat buoc: trang da len ban moi -> roi moi goi file khoa (xem ghi chu cache
  // Cloudflare: goi URL moi truoc khi Pages deploy xong co the luu nham ban cu / 404).
  const han = Date.now() + CHO_TOI_DA;
  let conLai = guiDi;
  for (;;) {
    const kq = await theoLo(conLai, 8, async (m) => { try { return daLen(m, await layLive(m.url)); } catch { return false; } });
    conLai = conLai.filter((_, i) => !kq[i]);
    if (!conLai.length) break;
    if (Date.now() > han) {
      ghi(`Het ${CHO_TOI_DA / 1000}s ma ${conLai.length} URL tren site that chua doi sang ban moi — KHONG gui URL nao.`);
      conLai.slice(0, 20).forEach((m) => ghi('  ' + m.url));
      ghi(`Chay lai: Actions > IndexNow > Run workflow, tu=${tuSha.slice(0, 8)} den=${denSha.slice(0, 8)}`);
      ketThuc(1);
    }
    await sleep(15000);
  }
  ghi(`Site that da len ban moi cho ca ${guiDi.length} URL.`);
}
try {
  const k = await layLive(VI_TRI_KHOA);
  if (k.status !== 200 || k.body.trim() !== KHOA) throw new Error(`HTTP ${k.status}`);
} catch (e) {
  ghi(`File khoa ${VI_TRI_KHOA} chua dung (${e.message}) — cong cu tim kiem se tra 403, khong gui.`);
  ketThuc(1);
}

// ---------- gui ----------
const body = JSON.stringify({ host: HOST, key: KHOA, keyLocation: VI_TRI_KHOA, urlList: guiDi.map((m) => m.url) });
let ma = 0;
for (let lan = 1; lan <= 4; lan++) {
  let r = null;
  try {
    r = await fetch(ENDPOINT, {
      method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body, signal: AbortSignal.timeout(30000),
    });
    const text = (await r.text()).replace(/\s+/g, ' ').slice(0, 300);
    ma = r.status;
    ghi(`POST ${ENDPOINT} lan ${lan}: HTTP ${r.status}${text ? ' — ' + text : ''}`);
  } catch (e) {
    ghi(`POST ${ENDPOINT} lan ${lan}: loi mang — ${e.message}`);
  }
  if (r && (r.status === 200 || r.status === 202)) break;
  // 400 sai dinh dang, 403 khoa sai, 422 URL khong thuoc host: gui lai y nguyen cung vo ich.
  if (r && ![429, 500, 502, 503, 504].includes(r.status)) break;
  if (lan === 4) break;
  const cho = r?.status === 429 ? Math.min(Number(r.headers.get('retry-after')) || 60, 600) : [10, 30, 90][lan - 1];
  ghi(`  doi ${cho}s roi thu lai`);
  await sleep(cho * 1000);
}
const yNghia = {
  200: 'da nhan URL (CHUA phai da crawl/index)',
  202: 'da nhan, dang xac minh khoa',
  400: 'sai dinh dang yeu cau',
  403: 'khoa khong hop le hoac file khoa khong doc duoc',
  422: 'URL khong thuoc host hoac khong khop khoa',
  429: 'gui qua nhieu — bi han che',
};
ghi(`Ket qua: ${ma || 'khong co phan hoi'} ${yNghia[ma] || ''}`);
ketThuc(ma === 200 || ma === 202 ? 0 : 1);
