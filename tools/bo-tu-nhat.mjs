// Bo cac chu "nhat" quan tu khen minh (chu site chot 11-11-2026: "bo may tu nhat di").
// Pham vi: cau quan TU XEP HANG / tu khen bang so sanh nhat ("view dep nhat Da Lat", "ngon & chill
// nhat thanh pho", "dep nhat nhi", "Trai Nghiem Doc Nhat" — Tram Dung Chill sat vach cung thay tau),
// ban EN tuong ung ("The Best View", "most scenic", "one of the best", "the most delicious").
// GIU: "nhat" chi gio/thang/so lieu ("dep nhat 18:30–20:00", "lan som nhat 17:20") va moi cau trong
// bai cam nang noi ve diem tham quan.
//
// Chay:  node tools/bo-tu-nhat.mjs            chi dem + in doan dich se doi id
//        node tools/bo-tu-nhat.mjs --write    ghi trang VI/EN + kho ban dich 5 thu tieng
// Sau --write: node tools/dich/tach.mjs -> node tools/dich/dung.mjs -> cache-bust --write ->
//   csp-hash --write -> kiem-schema / audit-links / vai-tro-trang / dung --kiem -> kiem-sitemap --sua.
// H1 trang chu nam trong nhom "khong doi title / H1" khi Google dang tung core update -> chi chay
// sau D+7 (CLAUDE.md muc 4), cung dot voi tools/doi-tac-gia.mjs.
// Khong nang dateModified: chi bo chu tu khen, khong doi du kien.

import fs from 'node:fs';
import path from 'node:path';
import { tachTrang, maDoan, chuoiLd, nenDichLd } from './dich/doan.mjs';
import { MOI } from './dich/cau-hinh.mjs';

const ROOT = process.cwd();
const GHI = process.argv.includes('--write');

// [file, chuoi cu, chuoi moi, so lan phai gap]
const SUA = [
  ['index.html', 'View Đẹp Nhất Đà Lạt – Ngắm Hoàng Hôn', 'View Đẹp Đà Lạt – Ngắm Hoàng Hôn', 2],
  ['index.html', '"description": "Quán nướng view đẹp nhất Đà Lạt - BBQ than hồng, ngắm hoàng hôn thung lũng và xe lửa.', '"description": "Quán nướng than hồng tại bàn ở Trại Mát, Đà Lạt - ngắm hoàng hôn thung lũng và xe lửa.', 1],
  ['en/index.html', 'The Best View BBQ Restaurant in Da Lat – Enjoy Sunset', 'Valley-View BBQ Restaurant in Da Lat – Enjoy Sunset', 2],
  ['en/index.html', '"description": "The most scenic BBQ restaurant in Da Lat - charcoal BBQ with stunning valley sunset and train views.', '"description": "Charcoal BBQ grilled at your table in Trai Mat, Da Lat - valley sunset and train views.', 1],
  ['404.html', 'để khám phá quán nướng view đẹp nhất Đà Lạt.', 'để xem quán nướng view thung lũng Trại Mát, Đà Lạt.', 2],
  ['about/index.html', '>Trải Nghiệm Độc Nhất</span>', '>Tuyến Tàu Đà Lạt – Trại Mát</span>', 1],
  ['about/index.html', 'Góc đón hoàng hôn đẹp nhất nhì Đà Lạt.', 'Ngắm hoàng hôn ngay từ bàn ăn.', 1],
  ['about/index.html', 'Đặt trước để đảm bảo khoảnh khắc hoàn hảo nhất cho bạn.', 'Đặt trước để giữ chỗ đúng giờ hoàng hôn.', 1],
  ['about-en/index.html', '>Unique Experience</span>', '>Da Lat – Trai Mat Railway</span>', 1],
  ['about-en/index.html', 'One of the best sunset spots in Da Lat.', 'Watch the sunset right from your table.', 1],
  ['about-en/index.html', 'Book in advance to guarantee your perfect moment.', 'Book ahead to hold a seat for sunset.', 1],
  ['quan-nuong-da-lat-tiem-nuong-va-chill-xom-leo/index.html', 'nơi đây chắc chắn sẽ là một trong những điểm đến ấn tượng nhất trong hành trình', 'nơi đây là một điểm dừng đáng ghé trong hành trình', 1],
  ['quan-nuong-da-lat-tiem-nuong-va-chill-xom-leo/index.html', 'ngon &amp; chill nhất thành phố!</em>', 'view thung lũng Trại Mát, mở 15:00–23:00 mỗi ngày!</em>', 1],
  ['quan-nuong-da-lat-tiem-nuong-va-chill-xom-leo-en/index.html', 'this place will definitely be one of the most impressive destinations in your journey', 'this place is a stop worth making on your journey', 1],
  ['quan-nuong-da-lat-tiem-nuong-va-chill-xom-leo-en/index.html', '— the most delicious &amp; chill BBQ spot in Da Lat!</p>', '— a Da Lat BBQ spot overlooking the Trai Mat valley, open 15:00–23:00 every day!</p>', 1],
];

// Ban dich doan Viet MOI (khoa = chu doan dung nhu tools/dich/tach.mjs tach ra). Ten quan, dia
// danh giu tieng Viet theo tools/dich/HUONG-DAN.md.
const DICH = {
  // H1 trang chu (WebPage.name trung chu nen dung chung ban dich nay)
  'Quán Nướng View Đẹp Đà Lạt – Ngắm Hoàng Hôn & Thưởng Thức BBQ Tại Xóm Lèo': {
    zh: '大叻美景烧烤店——在 Xóm Lèo 看日落、享炭火BBQ',
    ko: '달랏 뷰 좋은 바베큐 맛집 – Xóm Lèo에서 일몰 보며 즐기는 숯불 BBQ',
    ja: 'ダラットの眺めのいいBBQレストラン ― Xóm Lèo で夕日を眺めながらBBQを',
    ru: 'Гриль-ресторан с красивым видом в Далате — закат и барбекю в Xóm Lèo',
    th: 'ร้านปิ้งย่างวิวสวยในดาลัด – ชมพระอาทิตย์ตกพร้อมลิ้มรส BBQ ที่ Xóm Lèo',
  },
  // Restaurant.description (JSON-LD)
  'Quán nướng than hồng tại bàn ở Trại Mát, Đà Lạt - ngắm hoàng hôn thung lũng và xe lửa. Không gian chill giữa sương mù Đà Lạt.': {
    zh: '位于大叻 Trại Mát 的桌边炭火烧烤店——看山谷日落和火车。大叻薄雾中的惬意空间。',
    ko: '달랏 Trại Mát의 테이블 숯불 바베큐 맛집 - 계곡 일몰과 기차를 감상하세요. 달랏의 안개 속에서 즐기는 힐링 공간.',
    ja: 'ダラットの Trại Mát にある、テーブルで炭火焼きを楽しむBBQレストラン。谷に沈む夕日と列車を一望。霧に包まれるダラットで過ごす、チルなひととき。',
    ru: 'Гриль-ресторан в Trại Mát, Далат, с жаровней на углях у каждого стола: закат над долиной и поезд. Уютная атмосфера в далатском тумане.',
    th: 'ร้านปิ้งย่างเตาถ่านที่โต๊ะ ย่าน Trại Mát ดาลัด - ชมพระอาทิตย์ตกเหนือหุบเขาและรถไฟ บรรยากาศชิลท่ามกลางหมอกของดาลัด',
  },
  // /about/: nhan the "Doan tau luot qua ben canh"
  '<span1><svg2/></span1><span3>Tuyến Tàu Đà Lạt – Trại Mát</span3>': {
    zh: '<span1><svg2/></span1><span3>大叻—Trại Mát 观光小火车</span3>',
    ko: '<span1><svg2/></span1><span3>달랏 – Trại Mát 관광열차</span3>',
    ja: '<span1><svg2/></span1><span3>ダラット ― Trại Mát 観光列車</span3>',
    ru: '<span1><svg2/></span1><span3>Поезд Далат — Trại Mát</span3>',
    th: '<span1><svg2/></span1><span3>รถไฟท่องเที่ยวดาลัด – Trại Mát</span3>',
  },
  'Thu trọn thung lũng Trại Mát vào tầm mắt. Ngắm hoàng hôn ngay từ bàn ăn.': {
    zh: '将 Trại Mát 山谷尽收眼底，坐在餐桌旁就能看日落。',
    ko: 'Trại Mát 계곡을 한눈에 담아요. 테이블에 앉은 채로 일몰을 볼 수 있어요.',
    ja: 'Trại Mát の谷をまるごと一望。テーブルに座ったまま夕日を眺められます。',
    ru: 'Вся долина Trại Mát как на ладони. Закат видно прямо из-за столика.',
    th: 'เก็บหุบเขา Trại Mát ไว้ได้เต็มสายตา ชมพระอาทิตย์ตกได้จากโต๊ะอาหาร',
  },
  'Bàn view tàu và view hoàng hôn có số lượng giới hạn. Đặt trước để giữ chỗ đúng giờ hoàng hôn.': {
    zh: '火车景观座和日落景观座数量有限。提前预订，为您留好日落时分的座位。',
    ko: '기차 뷰와 일몰 뷰 테이블은 수가 한정되어 있어요. 일몰 시간에 맞춰 자리를 잡으려면 미리 예약하세요.',
    ja: '列車や夕日が見える席には限りがあります。夕日の時間に席を確保するなら、事前のご予約をおすすめします。',
    ru: 'Столиков с видом на поезд и на закат немного. Забронируйте заранее, чтобы место к закату было за вами.',
    th: 'โต๊ะวิวรถไฟและวิวพระอาทิตย์ตกมีจำนวนจำกัด จองล่วงหน้าเพื่อให้มีที่นั่งตรงเวลาพระอาทิตย์ตก',
  },
  // bai quan-nuong-da-lat-tiem-nuong-va-chill-xom-leo: doan ket
  '<em1><strong2>Tiệm Nướng & Chill Xóm Lèo</strong2></em1> không chỉ đơn thuần là một tiệm BBQ tại Đà Lạt, mà là nơi để bạn sống chậm lại, tận hưởng trọn vẹn từng khoảnh khắc bên người thân, bạn bè. Với không gian đặc sắc, món ăn ngon và dịch vụ tận tâm, nơi đây là một điểm dừng đáng ghé trong hành trình khám phá Đà Lạt của bạn.': {
    zh: '<em1><strong2>Tiệm Nướng & Chill Xóm Lèo</strong2></em1> 不只是一家大叻的 BBQ 店，更是让您慢下来、与家人朋友尽享每一刻的地方。独特的空间、美味的菜品和用心的服务，让这里成为您大叻之旅中值得停留的一站。',
    ko: '<em1><strong2>Tiệm Nướng & Chill Xóm Lèo</strong2></em1>는 달랏의 평범한 BBQ 가게가 아니라, 천천히 쉬어 가며 가족·친구와 함께하는 순간순간을 온전히 즐기는 곳이에요. 특별한 공간, 맛있는 음식, 정성 어린 서비스가 있어 달랏 여행 중 들러 볼 만한 곳이에요.',
    ja: '<em1><strong2>Tiệm Nướng & Chill Xóm Lèo</strong2></em1> は単なるダラットのBBQ店ではなく、ゆっくりとした時間の中で、家族や友人と過ごす一瞬一瞬を存分に味わえる場所です。個性的な空間、おいしい料理、心のこもったサービスがそろう、ダラット旅行の途中に立ち寄りたい一軒です。',
    ru: '<em1><strong2>Tiệm Nướng & Chill Xóm Lèo</strong2></em1> — не просто барбекю-ресторан в Далате, а место, где можно замедлиться и сполна насладиться каждым моментом с близкими и друзьями. Самобытная атмосфера, вкусная еда и душевный сервис — сюда стоит заглянуть во время путешествия по Далату.',
    th: '<em1><strong2>Tiệm Nướng & Chill Xóm Lèo</strong2></em1> ไม่ได้เป็นแค่ร้าน BBQ ในดาลัด แต่เป็นที่ให้คุณได้ใช้ชีวิตช้าลง ดื่มด่ำทุกช่วงเวลากับคนในครอบครัวและเพื่อนฝูงอย่างเต็มที่ ด้วยบรรยากาศโดดเด่น อาหารอร่อย และบริการใส่ใจ ที่นี่เป็นอีกจุดที่ควรแวะในทริปสำรวจดาลัดของคุณ',
  },
  'Hẹn gặp bạn tại<strong1> TIỆM NƯỚNG & CHILL XÓM LÈO </strong1>–<strong2> Quán nướng Đà Lạt </strong2>view thung lũng Trại Mát, mở 15:00–23:00 mỗi ngày!': {
    zh: '我们在<strong1> Tiệm Nướng & Chill Xóm Lèo </strong1>等您——俯瞰 Trại Mát 山谷的<strong2>大叻烧烤店</strong2>，每天 15:00–23:00 营业！',
    ko: '<strong1>Tiệm Nướng & Chill Xóm Lèo</strong1>에서 만나요 – Trại Mát 계곡이 내려다보이는 <strong2>달랏 바베큐 맛집</strong2>, 매일 15:00~23:00 영업해요!',
    ja: '<strong1>Tiệm Nướng & Chill Xóm Lèo</strong1> ― Trại Mát の谷を見下ろす<strong2>ダラットのBBQ店</strong2>で、毎日 15:00〜23:00 お待ちしています！',
    ru: 'Ждём вас в<strong1> TIỆM NƯỚNG & CHILL XÓM LÈO </strong1>—<strong2> гриль-ресторане Далата </strong2>с видом на долину Trại Mát, ежедневно с 15:00 до 23:00!',
    th: 'แล้วพบกันที่<strong1> TIỆM NƯỚNG & CHILL XÓM LÈO </strong1>–<strong2> ร้านปิ้งย่างดาลัด </strong2>วิวหุบเขา Trại Mát เปิดทุกวัน 15:00–23:00!',
  },
};
// Ban dich phai giu dung bo ma the cua ban Viet (cung luat voi tools/dich/gop.mjs).
const RE_MA = /<(\/?)([a-z][a-z0-9]*?)(\d+)(\/?)>/g;
const dsMa = (s) => [...s.matchAll(RE_MA)].map((m) => m[0]).sort().join(' ');
const CON_NHAT = { zh: /最|数一数二/, ko: /가장|손꼽/, ja: /一番|いちばん|最高|指折り/, ru: /сам(ый|ой|ым|ых|ое)|лучш/, th: /ที่สุด|ติดอันดับ/ };
for (const [vi, d] of Object.entries(DICH)) {
  for (const [ma, t] of Object.entries(d)) {
    if (dsMa(vi) !== dsMa(t)) { console.log(`  ! ${ma}: ma the lech: ${t}`); process.exitCode = 1; }
    if (CON_NHAT[ma].test(t)) { console.log(`  ! ${ma}: con chu so sanh nhat: ${t}`); process.exitCode = 1; }
  }
}

// ---------- 1. Sua trang ----------
const theoFile = new Map();
for (const [f, cu, moi, n] of SUA) {
  if (!theoFile.has(f)) theoFile.set(f, []);
  theoFile.get(f).push([cu, moi, n]);
}
const truoc = new Map(), sau = new Map();
let loi = 0;
for (const [f, ds] of theoFile) {
  const p = path.join(ROOT, f);
  const src = fs.readFileSync(p, 'utf8');
  let html = src;
  for (const [cu, moi, n] of ds) {
    const gap = html.split(cu).length - 1;
    if (gap !== n) {
      if (gap === 0 && html.includes(moi)) { console.log(`  = ${f}: da sua tu truoc ("${moi.slice(0, 50)}…")`); continue; }
      console.log(`  ! ${f}: "${cu.slice(0, 60)}…" gap ${gap} lan, can ${n}`); loi++; continue;
    }
    html = html.split(cu).join(moi);
  }
  truoc.set(f, src);
  sau.set(f, html);
}
const doiFile = [...sau].filter(([f, h]) => h !== truoc.get(f));
console.log(`Trang VI/EN: ${doiFile.length}/${theoFile.size} file se doi, ${loi} loi`);

// ---------- 2. Doan dich doi id (chi trang Viet co ban dich) ----------
function doanCua(html) {
  const t = tachTrang(html);
  const ra = new Map();
  for (const d of t.doan) ra.set(d.id, { vi: d.nguon, loai: d.loai });
  for (const k of t.ld) {
    try {
      chuoiLd(JSON.parse(k.json), (s, khoa) => {
        if (!nenDichLd(s, khoa)) return;
        const chu = s.replace(/\s+/g, ' ').trim();
        ra.set(maDoan(chu), { vi: chu, loai: 'ld' });
      });
    } catch {}
  }
  return ra;
}
const canDich = new Map(); // id moi -> {vi, loai, cu: [vi cu]}
for (const [f, html] of doiFile) {
  if (!/^<!DOCTYPE html>\s*<html lang="vi"/i.test(html.slice(0, 80))) continue;
  if (f === '404.html') continue; // 404 khong co ban dich
  const a = doanCua(truoc.get(f)), b = doanCua(html);
  const mat = [...a].filter(([id]) => !b.has(id));
  for (const [id, d] of b) {
    if (a.has(id)) continue;
    // H1 va WebPage.name trung chu -> cung id, mot ban dich dung cho ca hai.
    canDich.set(id, { ...d, file: f, cu: mat.filter(([, x]) => x.loai === d.loai).map(([, x]) => x.vi) });
  }
}
const kho = {};
for (const n of MOI) kho[n.ma] = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'dich', 'kho', `${n.ma}.json`), 'utf8'));
let thieuDich = 0;
for (const [id, d] of canDich) {
  const co = DICH[d.vi];
  if (!co) thieuDich++;
  if (!co || process.argv.includes('--doan')) {
    console.log(`\n# ${id} [${d.loai}] ${d.file}\n  VI moi: ${JSON.stringify(d.vi)}`);
    for (const c of d.cu) {
      const idc = maDoan(c);
      console.log(`  VI cu : ${JSON.stringify(c)}`);
      for (const n of MOI) if (kho[n.ma][idc]) console.log(`     ${n.ma}: ${JSON.stringify(kho[n.ma][idc])}`);
    }
  }
}
console.log(`\nDoan dich doi id: ${canDich.size}, chua co ban dich trong script: ${thieuDich}`);
if (thieuDich || loi) process.exitCode = 1;

if (!GHI) {
  console.log('Chua ghi gi (them --write de ghi).');
} else if (process.exitCode) {
  console.log('Co loi / thieu ban dich -> khong ghi.');
} else {
  for (const [f, html] of doiFile) fs.writeFileSync(path.join(ROOT, f), html);
  for (const n of MOI) {
    let them = 0;
    for (const [id, d] of canDich) { const t = DICH[d.vi][n.ma]; if (kho[n.ma][id] !== t) { kho[n.ma][id] = t; them++; } }
    const f = path.join(ROOT, 'tools', 'dich', 'kho', `${n.ma}.json`);
    // Cung kieu ghi voi tools/dich/gop.mjs: khoa xep thu tu, thut 1, LF.
    if (them) fs.writeFileSync(f, JSON.stringify(Object.fromEntries(Object.keys(kho[n.ma]).sort().map((k) => [k, kho[n.ma][k]])), null, 1) + '\n');
    console.log(`kho ${n.ma}: +${them}`);
  }
  console.log(`Da ghi ${doiFile.length} trang. Tiep: tach.mjs -> dung.mjs -> cache-bust -> csp-hash -> kiem (xem dau file).`);
}
