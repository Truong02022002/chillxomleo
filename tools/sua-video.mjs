// Video tren site (soat 11-11-2026 theo bai "SEO tu duy he thong", muc video; chu site: "lam di").
//  1. VideoObject cho video chi duong: /duong-di/ (YouTube Short 6PBFx0cP0lg) va /en/directions/
//     (07LEaE9bv6U). Video bo trong facade (link + anh bia, iframe chi tai khi bam) nen Google khong
//     thay the nhung; JSON-LD la cach bao day la video. Khoi rieng, noi WebPage bang isPartOf — khong
//     dung khoi WebPage (ban va /duong-di/ trong .claude/cho-day sua name cua khoi do).
//     Khong khai inLanguage: tools/dich/dung.mjs doi moi inLanguage "vi" thanh tieng trang dich, video
//     van noi tieng Viet. Khong khai author/publisher: chu chua xac nhan kenh YouTube (ke-hoach cau 2).
//     Khi chu xac nhan: them creator: { '@id': 'https://xomleo.vn/#organization' } cho ca 2 video —
//     tai lieu VideoObject cua Google ghi "creator (or author)" la thuoc tinh khuyen nghi (changelog 24-09-2026).
//  2. Doi ten 5 clip /about/ uploads/tiktok-N.mp4 -> ten ta noi dung (CLAUDE.md muc 3: ten file ta noi
//     dung, khong ten theo cong dung). Ten dat theo khung hinh trich tu chinh clip. Clip la ban xem
//     truoc cam, khong lap chi muc, khong ai link ngoai -> khong giu ban ten cu.
//
// Du kien video (doc trang YouTube cong khai 11-11-2026):
//   6PBFx0cP0lg  kenh @TiemNuongChillXomLeo, dang 2026-06-22T18:02:33-07:00, 40 s, co phu de tu dong tieng Viet
//   07LEaE9bv6U  cung kenh, dang 2024-08-16T22:10:15-07:00, 36 s
//
// Chay:  node tools/sua-video.mjs            chi dem + kiem
//        node tools/sua-video.mjs --write    ghi 2 trang chi duong + 2 trang about + doi ten 5 file + kho dich
// Sau --write: node tools/dich/tach.mjs -> node tools/dich/dung.mjs -> cache-bust --write ->
//   csp-hash --write -> kiem-schema / audit-links / dung --kiem -> kiem-sitemap --sua.
// Doi trang dang chay -> chi chay sau D+7 cua November 2026 core update (CLAUDE.md muc 4, 8), cung dot
// voi tools/doi-tac-gia.mjs + tools/bo-tu-nhat.mjs. Khong doi chu hien thi -> khong nang dateModified,
// kiem-sitemap khong nang lastmod.

import fs from 'node:fs';
import path from 'node:path';
import { maDoan } from './dich/doan.mjs';
import { MOI } from './dich/cau-hinh.mjs';

const ROOT = process.cwd();
const GHI = process.argv.includes('--write');
let loi = 0;
const bao = (s) => { console.log(`  ! ${s}`); loi++; };

// ---------- 1. VideoObject ----------
const VIDEO = [
  {
    file: 'duong-di/index.html',
    ld: {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      '@id': 'https://xomleo.vn/duong-di/#video',
      // Trung chu data-nhung-title cua facade -> dung lai ban dich da co trong kho.
      name: 'Đường đi đến Tiệm Nướng & Chill Xóm Lèo',
      description: 'Video ngắn của quán hướng dẫn đường tới Tiệm Nướng & Chill Xóm Lèo ở 113 Huỳnh Tấn Phát, Trại Mát, Đà Lạt.',
      thumbnailUrl: 'https://xomleo.vn/uploads/video/video-huong-dan-duong-den-xom-leo.webp',
      uploadDate: '2026-06-22T18:02:33-07:00',
      duration: 'PT40S',
      embedUrl: 'https://www.youtube.com/embed/6PBFx0cP0lg',
      isPartOf: { '@id': 'https://xomleo.vn/duong-di/' },
    },
    phaiCo: ['youtube.com/embed/6PBFx0cP0lg', '/uploads/video/video-huong-dan-duong-den-xom-leo.webp', '"@id": "https://xomleo.vn/duong-di/"'],
  },
  {
    file: 'en/directions/index.html',
    ld: {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      '@id': 'https://xomleo.vn/en/directions/#video',
      name: 'How to get to Xom Leo Grill & Chill',
      description: 'A short video from the restaurant showing the way to Xom Leo Grill & Chill at 113 Huynh Tan Phat, Trai Mat, Da Lat.',
      thumbnailUrl: 'https://xomleo.vn/uploads/video/video-directions-to-xom-leo.webp',
      uploadDate: '2024-08-16T22:10:15-07:00',
      duration: 'PT36S',
      embedUrl: 'https://www.youtube.com/embed/07LEaE9bv6U',
      isPartOf: { '@id': 'https://xomleo.vn/en/directions/' },
    },
    phaiCo: ['youtube.com/embed/07LEaE9bv6U', '/uploads/video/video-directions-to-xom-leo.webp', '"@id": "https://xomleo.vn/en/directions/"'],
  },
];

// Ban dich doan Viet MOI (description). name trung doan 584fef714182 da dich san.
const DICH = {
  'Video ngắn của quán hướng dẫn đường tới Tiệm Nướng & Chill Xóm Lèo ở 113 Huỳnh Tấn Phát, Trại Mát, Đà Lạt.': {
    zh: '店家拍摄的短视频，带您前往位于大叻 Trại Mát 113 Huỳnh Tấn Phát 的 Tiệm Nướng & Chill Xóm Lèo。',
    ko: '가게에서 직접 만든 짧은 영상으로, 달랏 Trại Mát 113 Huỳnh Tấn Phát에 있는 Tiệm Nướng & Chill Xóm Lèo 오시는 길을 안내해요.',
    ja: 'お店が制作した短い動画で、ダラット・Trại Mát の 113 Huỳnh Tấn Phát にある Tiệm Nướng & Chill Xóm Lèo へのアクセスをご案内します。',
    ru: 'Короткое видео от ресторана о том, как добраться до Tiệm Nướng & Chill Xóm Lèo по адресу 113 Huỳnh Tấn Phát, Trại Mát, Далат.',
    th: 'วิดีโอสั้นจากทางร้าน แนะนำเส้นทางไป Tiệm Nướng & Chill Xóm Lèo ที่ 113 Huỳnh Tấn Phát, Trại Mát ดาลัด',
  },
};
const ID_NAME = '584fef714182';

const sau = new Map();
const docFile = (f) => sau.get(f) ?? fs.readFileSync(path.join(ROOT, f), 'utf8');

for (const v of VIDEO) {
  const html = docFile(v.file);
  if (html.includes('"@type": "VideoObject"')) { console.log(`  = ${v.file}: da co VideoObject`); continue; }
  for (const s of v.phaiCo) if (!html.includes(s)) bao(`${v.file}: khong thay "${s}" — trang doi tu luc viet script, soat lai`);
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const khoi = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g)];
  if (!khoi.length) { bao(`${v.file}: khong co khoi JSON-LD`); continue; }
  const cuoi = khoi[khoi.length - 1];
  const viTri = cuoi.index + cuoi[0].length;
  const moi = `${eol}<script type="application/ld+json">${eol}${JSON.stringify(v.ld, null, 2).replace(/\n/g, eol)}${eol}</script>`;
  sau.set(v.file, html.slice(0, viTri) + moi + html.slice(viTri));
  console.log(`  + ${v.file}: VideoObject ${v.ld.embedUrl.split('/').pop()} (${v.ld.duration}, ${v.ld.uploadDate.slice(0, 10)})`);
}

// ---------- 2. Doi ten clip /about/ ----------
const TEN = [
  ['tiktok-1.mp4', 'hoang-hon-thung-lung-nha-kinh-va-ban-nuong-xom-leo.mp4'],
  ['tiktok-2.mp4', 'khach-kin-ban-nuong-dem-duoi-den-long-xom-leo.mp4'],
  ['tiktok-3.mp4', 'cap-doi-nuong-thit-luc-hoang-hon-tren-thung-lung-xom-leo.mp4'],
  ['tiktok-4.mp4', 'nhan-vien-chuc-mung-cau-hon-ban-dem-xom-leo.mp4'],
  ['tiktok-5.mp4', 'ban-nuong-dem-va-coi-xay-gio-sang-den-xom-leo.mp4'],
];
const TRANG_ABOUT = ['about/index.html', 'about-en/index.html'];
const doiTenFile = [];
for (const [cu, moi] of TEN) {
  const pCu = path.join(ROOT, 'uploads', cu), pMoi = path.join(ROOT, 'uploads', moi);
  if (fs.existsSync(pMoi) && !fs.existsSync(pCu)) { console.log(`  = uploads/${moi}: da doi ten`); continue; }
  if (!fs.existsSync(pCu)) { bao(`thieu uploads/${cu}`); continue; }
  if (fs.existsSync(pMoi)) { bao(`uploads/${moi} da ton tai`); continue; }
  doiTenFile.push([pCu, pMoi]);
}
for (const f of TRANG_ABOUT) {
  let html = docFile(f);
  for (const [cu, moi] of TEN) {
    const tim = `data-src="../uploads/${cu}"`;
    const n = html.split(tim).length - 1;
    if (n === 1) html = html.split(tim).join(`data-src="../uploads/${moi}"`);
    else if (!(n === 0 && html.includes(`data-src="../uploads/${moi}"`))) bao(`${f}: "${tim}" gap ${n} lan, can 1`);
  }
  if (html !== docFile(f)) sau.set(f, html);
}
// Moi tham chieu con lai toi ten cu (ngoai chu thich trong en/index.html) phai bang 0 sau khi doi.
console.log(`  doi ten: ${doiTenFile.length} file, ${TRANG_ABOUT.filter((f) => sau.has(f)).length} trang about`);

// ---------- 3. Kho dich ----------
const RE_MA = /<(\/?)([a-z][a-z0-9]*?)(\d+)(\/?)>/g;
const dsMa = (s) => [...s.matchAll(RE_MA)].map((m) => m[0]).sort().join(' ');
const kho = {};
for (const n of MOI) kho[n.ma] = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'dich', 'kho', `${n.ma}.json`), 'utf8'));
for (const n of MOI) if (!kho[n.ma][ID_NAME]) bao(`kho ${n.ma}: thieu ban dich name (${ID_NAME})`);
if (maDoan(VIDEO[0].ld.name) !== ID_NAME) bao(`name VideoObject khong con trung doan ${ID_NAME}`);
for (const [vi, d] of Object.entries(DICH)) {
  for (const n of MOI) {
    if (!d[n.ma]) bao(`thieu ban dich ${n.ma}`);
    else if (dsMa(vi) !== dsMa(d[n.ma])) bao(`${n.ma}: ma the lech`);
    else if (!d[n.ma].includes('Tiệm Nướng & Chill Xóm Lèo') || !d[n.ma].includes('113 Huỳnh Tấn Phát')) bao(`${n.ma}: mat ten quan / dia chi tieng Viet`);
  }
}

console.log(`\nTrang se doi: ${sau.size}, file doi ten: ${doiTenFile.length}, doan dich moi: ${Object.keys(DICH).length}, loi: ${loi}`);
if (!GHI) {
  console.log('Chua ghi gi (them --write de ghi).');
} else if (loi) {
  console.log('Co loi -> khong ghi.');
  process.exitCode = 1;
} else {
  for (const [f, html] of sau) fs.writeFileSync(path.join(ROOT, f), html);
  for (const [a, b] of doiTenFile) fs.renameSync(a, b);
  for (const n of MOI) {
    let them = 0;
    for (const [vi, d] of Object.entries(DICH)) {
      const id = maDoan(vi);
      if (kho[n.ma][id] !== d[n.ma]) { kho[n.ma][id] = d[n.ma]; them++; }
    }
    // Cung kieu ghi voi tools/dich/gop.mjs: khoa xep thu tu, thut 1, LF.
    if (them) fs.writeFileSync(path.join(ROOT, 'tools', 'dich', 'kho', `${n.ma}.json`), JSON.stringify(Object.fromEntries(Object.keys(kho[n.ma]).sort().map((k) => [k, kho[n.ma][k]])), null, 1) + '\n');
    console.log(`kho ${n.ma}: +${them}`);
  }
  console.log(`Da ghi ${sau.size} trang, doi ten ${doiTenFile.length} file. Tiep: tach.mjs -> dung.mjs -> cache-bust -> csp-hash -> kiem (xem dau file).`);
}
if (loi) process.exitCode = 1;
