#!/usr/bin/env node
// Dong bo CSP (the meta) cua moi trang: policy chung cua site + hash sha256 cua
// dung cac script noi tuyen THAT cua trang do (muc 169).
//
// Vi sao can file nay: CSP dat bang the <meta> trong moi trang (GitHub Pages
// khong cho dat header). De bo 'unsafe-inline' khoi script-src, moi khoi
// <script> noi tuyen phai co hash dung noi dung cua no trong CSP cua chinh trang
// do. Sua mot chu trong script ma quen cap nhat hash thi trinh duyet CHAN script
// do va giao dien khong bao gi ca — GA mat so lieu im lang, o tim kiem blog chet.
// Doan GA noi tuyen da bi sua it nhat 2 lan (3,5s -> load -> idle callback), va
// bai dang theo lich 08-09 len song voi ban GA cu, nen hash KHONG duoc chep tay.
//
// NGUON CUA POLICY: the meta CSP trong index.html (bo phan hash). Muon doi CSP
// cho ca site — them mot dich vu ngoai chang han — thi sua the do trong
// index.html roi chay --write, moi trang se theo. Sua tay CSP o trang khac se bi
// ghi de. Trang thieu the CSP (vd ban nhap cu) duoc chen vao sau <meta charset>.
//
// Chay:
//   node tools/csp-hash.mjs           # kiem tra, exit 1 neu co trang lech
//   node tools/csp-hash.mjs --write   # ghi lai cho dung
//
// Tu dong chay o:
//   .github/workflows/csp-hash.yml           moi lan push co doi file .html
//   .github/workflows/dang-bai-theo-lich.yml sau khi dang bai (push cua bot
//       khong kich hoat workflow khac, nen phai tu chay trong do)
//
// Khong ho tro duoc: thuoc tinh on*="..." va href="javascript:..." — hash khong
// cho phep chung (phai them 'unsafe-hashes'). Gap thi bao loi; chuyen code do
// vao file .js hoac vao <script> la xong.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BO_QUA = ['.git', 'node_modules', '.claude', 'skills', 'tools', 'hang-doi'];

// Theo thu tu xuat hien trong file: comment HTML nuot truoc, de <script> nam
// trong comment khong bi tinh.
const KHOI = /<!--[\s\S]*?-->|<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const THE_CSP = /<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/i;
const TOKEN_TU_SINH = /^'(unsafe-inline|sha(256|384|512)-[^']*)'$/i;

function laScriptChay(thuocTinh) {
  if (/\bsrc\s*=/i.test(thuocTinh)) return false;
  const m = thuocTinh.match(/\btype\s*=\s*["']?([^"'\s>]+)/i);
  if (!m) return true;
  // application/ld+json, text/template... khong chay nen CSP khong xet.
  return /^((text|application)\/(java|ecma)script|module)$/i.test(m[1]);
}

// Trinh phan tich HTML doi CRLF va CR le thanh LF truoc khi dung DOM, nen trinh
// duyet bam tren noi dung da doi. Repo nay de core.autocrlf=true (Windows CRLF,
// runner Linux LF) — bam thang byte tren dia la ra hai hash khac nhau.
const bam = (s) => crypto.createHash('sha256').update(s.replace(/\r\n?/g, '\n'), 'utf8').digest('base64');

const noiDungCsp = (the) => (the.match(/\bcontent\s*=\s*"([^"]*)"/i) || [])[1];

// Doi token cua script-src: bo moi hash / 'unsafe-inline', chen `hash` sau 'self'.
function datHash(policy, hash) {
  let co = false;
  const kq = policy.split(';').map((phan) => {
    const m = phan.match(/^(\s*)script-src\s+(.*?)(\s*)$/i);
    if (!m) return phan;
    co = true;
    const tok = m[2].split(/\s+/).filter((t) => t && !TOKEN_TU_SINH.test(t));
    const i = tok.indexOf("'self'");
    tok.splice(i === -1 ? 0 : i + 1, 0, ...hash);
    return m[1] + 'script-src ' + tok.join(' ') + m[3];
  }).join(';');
  return co ? kq : null;
}

// Policy chung cua site = CSP cua index.html, bo phan hash.
export function policyGoc(htmlIndex) {
  const the = htmlIndex.match(THE_CSP);
  const nd = the && noiDungCsp(the[0]);
  const goc = nd && datHash(nd, []);
  if (!goc) throw new Error('index.html phai co the meta CSP voi script-src — day la nguon policy cua ca site');
  return goc;
}

export function tinhLai(html, goc) {
  const loi = [];
  const ghiChu = [];
  const hash = [];
  for (const m of html.matchAll(KHOI)) {
    // Chuoi rong thi trinh duyet bo qua luon, khong xet CSP.
    if (m[0].startsWith('<!--') || !laScriptChay(m[1]) || m[2] === '') continue;
    const h = `'sha256-${bam(m[2])}'`;
    if (!hash.includes(h)) hash.push(h);
  }

  const conLai = html.replace(KHOI, ' ');
  for (const m of conLai.matchAll(/<[a-z][\w-]*\b[^>]*?\s(on[a-z]+)\s*=/gi)) loi.push(`co thuoc tinh ${m[1]}= (hash khong cho phep duoc)`);
  if (/\bhref\s*=\s*["']?\s*javascript:/i.test(conLai)) loi.push('co href="javascript:..." (hash khong cho phep duoc)');

  const theMoi = `<meta http-equiv="Content-Security-Policy" content="${datHash(goc, hash)}">`;
  let ra;
  const the = html.match(THE_CSP);
  if (the) {
    ra = html.replace(the[0], () => theMoi);
  } else {
    const nl = html.includes('\r\n') ? '\r\n' : '\n';
    const neo = html.match(/^([ \t]*)<meta\s+charset\b[^>]*>/im) || html.match(/^([ \t]*)<head\b[^>]*>/im);
    if (!neo) { loi.push('khong co <meta charset> hay <head> de chen CSP'); return { html, hash, loi, ghiChu }; }
    ra = html.replace(neo[0], () => neo[0] + nl + neo[1] + theMoi);
    ghiChu.push('chua co the CSP — da chen sau ' + (neo[0].includes('charset') ? '<meta charset>' : '<head>'));
  }

  const viTriCsp = ra.search(THE_CSP);
  const viTriScript = ra.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length)).search(/<script\b/i);
  if (viTriScript !== -1 && viTriScript < viTriCsp) loi.push('co <script> dung TRUOC the meta CSP — script do khong duoc CSP bao ve');
  return { html: ra, hash, loi, ghiChu };
}

function dsTrang() {
  const ds = [];
  (function di(thuMuc) {
    for (const e of fs.readdirSync(thuMuc, { withFileTypes: true })) {
      if (BO_QUA.includes(e.name)) continue;
      const p = path.join(thuMuc, e.name);
      if (e.isDirectory()) di(p);
      else if (e.name.endsWith('.html')) ds.push(p);
    }
  })(ROOT);
  return ds;
}

function chay() {
  const GHI = process.argv.includes('--write');
  const goc = policyGoc(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  const trang = dsTrang();
  let lech = 0, soHash = 0;
  const loi = [];
  for (const f of trang) {
    const cu = fs.readFileSync(f, 'utf8');
    const kq = tinhLai(cu, goc);
    const ten = path.relative(ROOT, f).split(path.sep).join('/');
    kq.loi.forEach((x) => loi.push(`${ten}: ${x}`));
    kq.ghiChu.forEach((x) => console.log(`  ${ten}: ${x}`));
    soHash += kq.hash.length;
    if (kq.html !== cu) {
      lech++;
      if (GHI) fs.writeFileSync(f, kq.html);
      else if (lech <= 10) console.log('  lech: ' + ten);
    }
  }
  console.log(`${trang.length} trang, ${soHash} hash script noi tuyen.`);
  if (loi.length) {
    console.error('\nLOI — sua tay truoc:');
    loi.forEach((x) => console.error('  - ' + x));
    process.exit(1);
  }
  if (!lech) { console.log('Dong bo. Khong co gi phai sua.'); return; }
  if (GHI) { console.log(`Da cap nhat CSP cua ${lech} trang.`); return; }
  console.error(`\nLECH: ${lech} trang co CSP khong khop. Chay lai voi --write.`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) chay();
