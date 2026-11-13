// Doi tac gia bai viet tu but danh "Bep truong Xom Leo" (Person @id #bep-truong) sang chinh quan
// (Organization @id #organization). Chu site chot 11-11-2026: "But danh de Tiem Nuong & Chill Xom
// Leo". Ly do: node Person cu khai jobTitle "Bep truong & Chu quan" va sameAs = Facebook/TikTok CUA
// QUAN (sameAs = cung mot thuc the -> khai nguoi nay chinh la trang Facebook cua quan), trong khi
// /about/ ghi bai do nha quan viet voi AI ho tro, khong co "Bep truong" nao.
//
// Chay:  node tools/doi-tac-gia.mjs            chi dem, khong ghi
//        node tools/doi-tac-gia.mjs --write    ghi
//
// Pham vi:
//  - Trang VI/EN goc + ban luu hang-doi/ (HTML): khoi "author" trong JSON-LD -> Organization (lay
//    nguyen node worksFor cu: dung ten theo ngon ngu trang, ban EN co alternateName ten Viet);
//    dong tac gia hien thi "Bai viet boi ..." / "Written by ...".
//  - Kho ban dich tools/dich/kho/<ma>.json: dong tac gia nam chung doan voi nhan + ngay
//    ("<span1>Cam nang</span1> ... <a6>Bai viet boi Bep truong Xom Leo</a6>"), doi chu ban Viet la
//    doi id doan -> script tu suy ra ban dich moi tu ban dich cu (chi thay but danh bang ten quan,
//    ten quan giu tieng Viet theo tools/dich/HUONG-DAN.md), khong can gui dich.
//  - Trang dich zh/ko/ja/ru/th KHONG sua tay: dung lai bang tools/dich/dung.mjs.
//
// Khong nang dateModified / "Cap nhat": than bai khong doi.
//
// Sau --write chay dung thu tu:
//   node tools/dich/tach.mjs && node tools/dich/dung.mjs
//   node tools/cache-bust.js --write && node tools/csp-hash.mjs --write
//   node tools/kiem-schema.mjs && node tools/audit-links.mjs && node tools/dich/dung.mjs --kiem
//   node tools/kiem-sitemap.mjs --sua      (dung ngay push)
// Chi chay sau D+7 cua dot cap nhat Google dang mo (CLAUDE.md muc 4): 284 trang doi dong tac gia.

import fs from 'node:fs';
import path from 'node:path';
import { tachTrang, maDoan } from './dich/doan.mjs';
import { MOI } from './dich/cau-hinh.mjs';

const ROOT = process.cwd();
const GHI = process.argv.includes('--write');
const ID_CU = 'https://xomleo.vn/#bep-truong';
const ID_QUAN = 'https://xomleo.vn/#organization';
const TEN_QUAN = 'Tiệm Nướng & Chill Xóm Lèo';
const TEN_QUAN_EN = 'Xom Leo Grill & Chill';

// Dong tac gia hien thi (ma nguon HTML).
const BYLINE = [
  ['>Bài viết bởi Bếp trưởng Xóm Lèo</a>', '>Bài viết bởi Tiệm Nướng &amp; Chill Xóm Lèo</a>'],
  ['>Written by Xom Leo Head Chef</a>', '>Written by Xom Leo Grill &amp; Chill</a>'],
  ['>By Xom Leo Head Chef</a>', '>By Xom Leo Grill &amp; Chill</a>'],
];
const BUT_DANH = new Set(['Bếp trưởng Xóm Lèo', 'Xom Leo Head Chef']);
// Cung dong do trong doan dich (chu da giai ma, nam trong <aN>...</aN>).
const BYLINE_DOAN_CU = 'Bài viết bởi Bếp trưởng Xóm Lèo';
const BYLINE_DOAN_MOI = `Bài viết bởi ${TEN_QUAN}`;
// But danh trong ban dich tung thu tieng (tools/dich/HUONG-DAN.md bang ten rieng, 11-2026) -> ten quan.
const DOI_DICH = {
  zh: (s) => s.replace(/Xóm Lèo ?主厨/g, TEN_QUAN),
  ko: (s) => s.replace(/Xóm Lèo ?셰프/g, TEN_QUAN),
  ja: (s) => s.replace(/Xóm Lèo ?料理長/g, TEN_QUAN),
  ru: (s) => s.replace(/[Шш]еф-повар Xóm Lèo/g, TEN_QUAN),
  th: (s) => s.replace(/ ?เชฟ ?Xóm Lèo/g, ` ${TEN_QUAN}`),
};
const CON_BUT_DANH = /主厨|셰프|料理長|[Шш]еф-повар|เชฟ|Bếp trưởng|Head Chef/;

const BO_THU_MUC = new Set(['.git', ['node', 'modules'].join('_'), '.claude', 'uploads', 'tools', 'css', 'js', ...MOI.map((n) => n.ma)]);
function duyet(d, ra = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (BO_THU_MUC.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) duyet(p, ra);
    else if (e.name.endsWith('.html')) ra.push(p);
  }
  return ra;
}

// Tim doan JSON bat dau o vi tri i (ky tu '{'), tra ve vi tri ngay sau '}' tuong ung.
function hetKhoi(s, i) {
  let sau = 0, trongChuoi = false;
  for (let k = i; k < s.length; k++) {
    const c = s[k];
    if (trongChuoi) {
      if (c === '\\') k++;
      else if (c === '"') trongChuoi = false;
    } else if (c === '"') trongChuoi = true;
    else if (c === '{') sau++;
    else if (c === '}' && --sau === 0) return k + 1;
  }
  return -1;
}

// Ghi object theo dung kieu thut le / xuong dong cua khoi cu.
function vietLai(obj, cu, thutKhoa) {
  if (!/\n/.test(cu)) return JSON.stringify(obj);
  const eol = cu.includes('\r\n') ? '\r\n' : '\n';
  const thutTrong = (cu.match(/\n([ \t]*)"/) || [, ' '])[1];
  const buoc = Math.max(1, thutTrong.length - thutKhoa.length);
  return JSON.stringify(obj, null, buoc).split('\n').map((l, i) => (i ? thutKhoa + l : l)).join(eol);
}

function doiAuthor(src, file) {
  let ra = '', vt = 0, n = 0;
  const re = /"author"\s*:\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    const bd = m.index + m[0].length - 1;
    const kt = hetKhoi(src, bd);
    if (kt < 0) throw new Error(`${file}: khoi author khong dong`);
    const cu = src.slice(bd, kt);
    let o;
    try { o = JSON.parse(cu); } catch { continue; }
    // Ban luu hang-doi cu (truoc 12-09-2026) co Person khong @id -> nhan theo ten but danh.
    if (o['@id'] !== ID_CU && !(o['@type'] === 'Person' && BUT_DANH.has(o.name))) continue;
    const laEn = /Head Chef/.test(o.name || '');
    const wf = o.worksFor && o.worksFor['@id'] === ID_QUAN ? o.worksFor : null;
    const moi = wf || { '@type': 'Organization', '@id': ID_QUAN, name: laEn ? TEN_QUAN_EN : TEN_QUAN, url: 'https://xomleo.vn/', ...(laEn ? { alternateName: TEN_QUAN } : {}) };
    const dauDong = src.lastIndexOf('\n', m.index) + 1;
    const thutKhoa = /^[ \t]*$/.test(src.slice(dauDong, m.index)) ? src.slice(dauDong, m.index) : '';
    ra += src.slice(vt, bd) + vietLai(moi, cu, thutKhoa);
    vt = kt;
    re.lastIndex = kt;
    n++;
  }
  return { html: ra + src.slice(vt), n };
}

// ---------- 1. HTML VI/EN + hang-doi ----------
const files = duyet(ROOT);
const doanByline = new Map(); // id cu -> chu Viet cu (doan co dong tac gia)
let soFile = 0, soAuthor = 0, soByline = 0;
const conSot = [];
const ghiFile = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  if (!src.includes(ID_CU) && !CON_BUT_DANH.test(src)) continue;
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  // Doan dich cua dong tac gia: chi trang VI goc (trang dich dung tu trang VI).
  if (!rel.startsWith('hang-doi/') && /lang="vi"/.test(src.slice(0, 300))) {
    for (const d of tachTrang(src).doan) if (d.loai === 'chu' && d.nguon.includes(BYLINE_DOAN_CU)) doanByline.set(d.id, d.nguon);
  }
  let { html, n } = doiAuthor(src, rel);
  let nb = 0;
  for (const [a, b] of BYLINE) { const k = html.split(a).length - 1; if (k) { html = html.split(a).join(b); nb += k; } }
  if (CON_BUT_DANH.test(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, (x) => (/ld\+json/.test(x) ? x : ''))) || html.includes(ID_CU)) conSot.push(rel);
  if (html !== src) { soFile++; soAuthor += n; soByline += nb; ghiFile.push([f, html]); }
}
console.log(`HTML VI/EN + hang-doi: ${soFile} file, ${soAuthor} khoi author, ${soByline} dong tac gia`);
if (conSot.length) console.log(`  ! con but danh / #bep-truong sau khi doi (${conSot.length}):`, conSot.slice(0, 10).join(', '));

// ---------- 2. Kho ban dich ----------
const thayKho = [];
for (const n of MOI) {
  const fKho = path.join(ROOT, 'tools', 'dich', 'kho', `${n.ma}.json`);
  const kho = JSON.parse(fs.readFileSync(fKho, 'utf8'));
  let them = 0, thieu = 0, loi = 0;
  for (const [id, vi] of doanByline) {
    const idMoi = maDoan(vi.split(BYLINE_DOAN_CU).join(BYLINE_DOAN_MOI));
    const cu = kho[id];
    if (cu == null) { if (kho[idMoi] == null) thieu++; continue; }
    const moi = DOI_DICH[n.ma](cu);
    if (CON_BUT_DANH.test(moi) || !moi.includes(TEN_QUAN)) { loi++; console.log(`  ! ${n.ma} ${id}: khong thay duoc but danh: ${cu}`); continue; }
    if (kho[idMoi] !== moi) { kho[idMoi] = moi; them++; }
  }
  console.log(`kho ${n.ma}: ${doanByline.size} doan co dong tac gia -> +${them} ban dich moi, ${thieu} doan chua tung dich (trang chua co ban ${n.ma}), ${loi} loi`);
  if (loi) process.exitCode = 1;
  if (them) thayKho.push([fKho, Object.fromEntries(Object.keys(kho).sort().map((k) => [k, kho[k]]))]);
}

if (!GHI) {
  console.log('\nChua ghi gi (them --write de ghi).');
} else if (process.exitCode) {
  console.log('\nCo loi -> khong ghi.');
} else {
  for (const [f, html] of ghiFile) fs.writeFileSync(f, html);
  // Cung kieu ghi voi tools/dich/gop.mjs: khoa xep thu tu, thut 1, LF.
  for (const [f, kho] of thayKho) fs.writeFileSync(f, JSON.stringify(kho, null, 1) + '\n');
  console.log(`\nDa ghi ${ghiFile.length} file HTML + ${thayKho.length} kho. Tiep: tach.mjs -> dung.mjs -> cache-bust -> csp-hash -> kiem-schema (xem dau file).`);
}
