#!/usr/bin/env node
// Sinh ba bản cắt 16:9, 4:3, 1:1 (rộng tối đa 1200px, không phóng to) cho ảnh đại diện của mọi bài
// viết (Article.image trong JSON-LD) — Google khuyên Article.image có đủ ba tỷ lệ, rộng ≥1200px, để
// hiện thumbnail trong kết quả tìm kiếm / AI Overviews. Thêm 02-11-2026 (soi theo 5 bài SEO chủ site dán).
//
// Cần sharp (repo không có package.json): tạo một thư mục tạm, trong đó `npm i --no-save sharp@0.33.5`, rồi
//   node tools/anh-ti-le.mjs --sharp <thư-mục-tạm>          # sinh các file còn thiếu
//   node tools/anh-ti-le.mjs --sharp <thư-mục-tạm> --ld     # + ghi mảng image vào JSON-LD bản Việt/Anh
//   node tools/anh-ti-le.mjs                                 # chỉ kiểm: bài nào còn thiếu bản cắt (exit 1)
// Tên file: <ảnh>-16x9.webp, <ảnh>-4x3.webp, <ảnh>-1x1.webp cạnh ảnh gốc. Trang dịch (zh/ko/ja/ru/th)
// nhận JSON-LD từ bản Việt khi chạy tools/dich/dung.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (t) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : null; };
const THU_MUC_SHARP = arg('--sharp');
const GHI_LD = process.argv.includes('--ld');
const TI_LE = [['16x9', 16 / 9], ['4x3', 4 / 3], ['1x1', 1]];

const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const viUrls = [...sm.matchAll(/<loc>https:\/\/xomleo\.vn\/([^<]*)<\/loc>/g)].map((m) => m[1]).filter((u) => !/^(zh|ko|ja|ru|th|en)\//.test(u) && !/-en\/$/.test(u));

function docArticle(file) {
  const h = fs.readFileSync(file, 'utf8');
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(h))) {
    let j; try { j = JSON.parse(m[1]); } catch { continue; }
    for (const x of j['@graph'] || [j]) if (/Article/.test(x['@type'])) return { h, json: m[1], bd: m.index, kt: m.index + m[0].length, art: x };
  }
  return null;
}
const tenCat = (url, tl) => url.replace(/\.webp$/, `-${tl}.webp`);
const duongCucBo = (url) => path.join(ROOT, url.replace('https://xomleo.vn/', ''));
const thoatRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let sharp = null;
if (THU_MUC_SHARP) {
  const goiSharp = path.resolve(THU_MUC_SHARP, ['node', 'modules'].join('_'), 'sharp', 'lib', 'index.js');
  sharp = (await import(pathToFileURL(goiSharp).href)).default;
}

const thieu = []; let sinh = 0, daCo = 0, ghi = 0;
for (const u of viUrls) {
  const fVi = path.join(ROOT, u, 'index.html');
  if (!fs.existsSync(fVi)) continue;
  const a = docArticle(fVi); if (!a) continue;
  const im = Array.isArray(a.art.image) ? a.art.image[0] : a.art.image;
  if (typeof im !== 'string' || !/^https:\/\/xomleo\.vn\/.*\.webp$/.test(im)) { console.log(`  ? ${u}: image lạ ${JSON.stringify(im).slice(0, 80)}`); continue; }
  const goc = duongCucBo(im);
  if (!fs.existsSync(goc)) { console.log(`  ! ${u}: không có ${goc}`); continue; }
  const can = TI_LE.filter(([tl]) => !fs.existsSync(duongCucBo(tenCat(im, tl))));
  if (can.length && !sharp) { thieu.push(`/${u} thiếu ${can.map((c) => c[0]).join(',')}`); continue; }
  if (can.length) {
    const meta = await sharp(goc).metadata();
    for (const [tl, r] of can) {
      let W = Math.min(1200, meta.width), H = Math.round(W / r);
      if (H > meta.height) { H = meta.height; W = Math.round(H * r); }
      const ra = duongCucBo(tenCat(im, tl));
      await sharp(goc).resize(W, H, { fit: 'cover', position: 'attention' }).webp({ quality: 80, effort: 6 }).toFile(ra);
      sinh++; console.log(`  + ${path.basename(ra)} ${W}x${H} ${(fs.statSync(ra).size / 1024).toFixed(0)} KB`);
    }
  } else daCo++;
  if (GHI_LD) {
    const mang = [im, ...TI_LE.map(([tl]) => tenCat(im, tl))];
    for (const f of [fVi, path.join(ROOT, u.replace(/\/$/, '-en/'), 'index.html')]) {
      if (!fs.existsSync(f)) continue;
      const b = docArticle(f); if (!b) continue;
      if (Array.isArray(b.art.image)) continue;
      const re = new RegExp(`(\\n([ \\t]*)"image":\\s*)"${thoatRegex(im)}"`);
      const m = b.json.match(re); if (!m) { console.log(`  ! ${f}: không thấy "image" trong khối Article`); continue; }
      const thut = m[2];
      const moi = b.json.replace(re, `$1[\n${thut}  ${mang.map((x) => JSON.stringify(x)).join(`,\n${thut}  `)}\n${thut}]`);
      fs.writeFileSync(f, b.h.slice(0, b.bd) + `<script type="application/ld+json">${moi}</script>` + b.h.slice(b.kt));
      ghi++;
    }
  }
}
console.log(`Bài: ${viUrls.length} · đã đủ 3 bản cắt: ${daCo} · sinh mới: ${sinh} · ghi JSON-LD: ${ghi}`);
if (thieu.length) { console.log(`THIẾU bản cắt (${thieu.length}):`); thieu.forEach((x) => console.log('  ' + x)); process.exitCode = 1; }
