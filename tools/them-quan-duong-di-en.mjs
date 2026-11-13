// Node Restaurant cho /en/directions/ (soat 12-11-2026 theo bai AIOSEO "types of schema markup":
// LocalBusiness dat o trang chu VA trang lien he / duong di).
//
// /duong-di/ (VI) va 5 ban dich da co khoi Restaurant rieng kem disambiguatingDescription (bien hieu
// doan tau, co dia diem khac cung ten Xom Leo). /en/directions/ chi co WebPage.about tro @id
// #restaurant — Google doc tung trang, khong tu noi @id sang trang khac, nen trang EN khong co du
// kien quan nao trong JSON-LD. Script them dung mot khoi Restaurant, cung bo thuoc tinh voi /duong-di/:
//   - name / servesCuisine / menu / hasMenu lay tu node Restaurant cua /en/ (ban EN),
//   - telephone / address / geo / hasMap / gio thuong / image / priceRange lay tu /en/ va PHAI trung
//     /duong-di/ (lech la dung, khong ghi),
//   - KHONG dua gio nghi Tet vao: lich Tet trong JSON-LD chi o index.html + en/index.html (CLAUDE.md muc 4,
//     "Lich Tet nam o 5 noi") — /duong-di/ cung chi co gio thuong,
//   - KHONG lay description cua /en/ (con chu "most scenic", tools/bo-tu-nhat.mjs se sua).
// disambiguatingDescription viet theo cau dang hien tren chinh trang ("train-shaped signboard",
// "railway overpass", "other locations named Xóm Lèo") — script kiem cac cum nay con tren trang.
//
// Chay:  node tools/them-quan-duong-di-en.mjs            chi kiem + in khoi se them
//        node tools/them-quan-duong-di-en.mjs --write    ghi en/directions/index.html
// Sau --write: csp-hash --write (JSON-LD khong vao CSP, chay cho du chuoi) -> kiem-schema ->
//   audit-links -> kiem-sitemap --sua (chu hien thi khong doi -> lastmod khong nang).
// Doi trang dang chay -> chi chay sau D+7 cua November 2026 core update (CLAUDE.md muc 4, 8), cung dot
// voi tools/sua-video.mjs (script do chen VideoObject vao CUOI cac khoi; script nay chen Restaurant
// vao DAU — hai script chay theo thu tu nao cung duoc, moi script tu bo qua neu da chay).
// Khong nang dateModified: trang khong doi chu hien thi.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const GHI = process.argv.includes('--write');
const FILE = 'en/directions/index.html';
let loi = 0;
const bao = (s) => { console.log(`  ! ${s}`); loi++; };

const doc = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const RE_KHOI = /([ \t]*)<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
const cacNode = (html) => [...html.matchAll(RE_KHOI)].map((m) => JSON.parse(m[2]));
const timNode = (html, loai) => cacNode(html).find((n) => [].concat(n['@type']).includes(loai));

const html = doc(FILE);
if (timNode(html, 'Restaurant')) {
  console.log(`  = ${FILE}: da co Restaurant, khong lam gi`);
  process.exit(0);
}

const en = timNode(doc('en/index.html'), 'Restaurant');
const vi = timNode(doc('duong-di/index.html'), 'Restaurant');
if (!en) bao('en/index.html: khong thay node Restaurant');
if (!vi) bao('duong-di/index.html: khong thay node Restaurant');
if (loi) process.exit(1);

const gioThuong = [].concat(en.openingHoursSpecification).filter((g) => !g.validFrom && !g.validThrough);
if (gioThuong.length !== 1) bao(`/en/: can dung 1 dong gio thuong, thay ${gioThuong.length}`);

const ld = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  '@id': 'https://xomleo.vn/#restaurant',
  name: en.name,
  alternateName: vi.name,
  disambiguatingDescription:
    'The original restaurant with the train-shaped signboard, next to the railway overpass on Huynh Tan Phat. Other locations in Da Lat are also named Xóm Lèo.',
  url: en.url,
  telephone: en.telephone,
  address: en.address,
  geo: en.geo,
  hasMap: en.hasMap,
  openingHoursSpecification: gioThuong[0],
  image: en.image,
  priceRange: en.priceRange,
  servesCuisine: en.servesCuisine,
  menu: en.menu,
  hasMenu: en.hasMenu,
};

// Du kien quan phai trung /duong-di/ (va bang muc 2 CLAUDE.md qua /duong-di/).
const J = (x) => JSON.stringify(x);
for (const k of ['@id', 'url', 'telephone', 'address', 'geo', 'hasMap', 'openingHoursSpecification', 'image', 'priceRange']) {
  if (J(ld[k]) !== J(vi[k])) bao(`${k} lech /duong-di/: ${J(ld[k])} vs ${J(vi[k])}`);
}
if (ld.name !== 'Xom Leo Grill & Chill') bao(`name EN la "${ld.name}" — CLAUDE.md muc 2 chot "Xom Leo Grill & Chill"`);
if (ld.alternateName !== 'Tiệm Nướng & Chill Xóm Lèo') bao(`alternateName la "${ld.alternateName}"`);
if (ld.menu !== 'https://xomleo.vn/menu-en/') bao(`menu la ${ld.menu}`);
const menuEn = timNode(doc('menu-en/index.html'), 'Menu');
if (!menuEn || menuEn['@id'] !== ld.hasMenu?.['@id']) bao(`hasMenu ${J(ld.hasMenu)} khong trung @id Menu tren /menu-en/ (${menuEn?.['@id']})`);

// Cau disambiguatingDescription phai dua tren chu dang hien tren trang.
const chu = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
for (const s of ['train-shaped signboard', 'railway overpass', 'other locations named Xóm Lèo', '15:00', '076 452 7336', '113 Huynh Tan Phat']) {
  if (!chu.includes(s)) bao(`${FILE}: chu hien thi khong con "${s}" — trang doi tu luc viet script, soat lai`);
}
const trang = timNode(html, 'WebPage');
if (trang?.about?.['@id'] !== ld['@id']) bao(`WebPage.about khong tro ${ld['@id']}`);

// Chen truoc khoi JSON-LD dau tien, cung thut le / xuong dong voi khoi do (giong /duong-di/: Restaurant dung dau).
const dau = RE_KHOI.exec(html);
RE_KHOI.lastIndex = 0;
const eol = html.includes('\r\n') ? '\r\n' : '\n';
const than = dau[2];
const truoc = than.match(/^\s*/)[0], sauThan = than.match(/\s*$/)[0];
const khoiMoi = dau[0].replace(than, truoc + JSON.stringify(ld, null, 2).replace(/\n/g, eol) + sauThan);
const ketQua = html.slice(0, dau.index) + khoiMoi + eol + html.slice(dau.index);

// Tu kiem: parse lai, dung 1 Restaurant, cac khoi cu giu nguyen.
const nodeSau = cacNode(ketQua);
if (nodeSau.filter((n) => n['@type'] === 'Restaurant').length !== 1) bao('sau khi chen: so node Restaurant khac 1');
if (nodeSau.length !== cacNode(html).length + 1) bao('sau khi chen: so khoi JSON-LD khong tang dung 1');
if (ketQua.replace(khoiMoi + eol, '') !== html) bao('sau khi chen: phan con lai cua trang bi doi');

console.log(`  + ${FILE}: Restaurant ${ld.name} (${Object.keys(ld).length} thuoc tinh, chen truoc khoi ${[].concat(cacNode(html)[0]['@type']).join()})`);
console.log(khoiMoi.split(eol).slice(0, 12).join('\n') + '\n  ...');
console.log(`\nLoi: ${loi}`);
if (loi) process.exit(1);
if (GHI) {
  fs.writeFileSync(path.join(ROOT, FILE), ketQua);
  console.log(`Da ghi ${FILE}.`);
} else console.log('Chua ghi gi (them --write de ghi).');
