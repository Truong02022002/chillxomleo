#!/usr/bin/env node
/**
 * Giam sat uptime xomleo.vn + duong nhan don dat ban (~15 phut/lan, chay boi
 * .github/workflows/giam-sat-uptime.yml). Chep tu scripts/giam-sat-uptime.js cua
 * repo tramdungchill.vn (dung 19-10-2026) va DUNG CHUNG BOT Telegram giam sat voi
 * ben do (chu site chon 20-10-2026) — tin cua quan nao thi mo dau bang ten quan do.
 *
 * Ly do ton tai: giam-sat-live.mjs chi chay moi tuan (lich con hay tre 5-7 tieng),
 * nen web sap hay webhook dat ban bi go trien khai co the nam do ca tuan ma khong ai
 * hay. Googlebot gap 5xx / qua thoi gian, nhat la o robots.txt, la giam nhip crawl.
 *
 * Moi luot goi thu 6 muc. Muc nao hong 3 lan lien (cach 20 giay) moi tinh — mot cu
 * chop mang khong dang bao. Bao dong = mo issue "[giam-sat] Su co: ..." gan ten chu
 * repo -> GitHub gui email, roi gui TELEGRAM kem link issue. Van hong thi im lang (khong
 * bao lai moi 15 phut); danh sach muc hong doi thi bao 1 tin; len lai thi binh luan +
 * dong issue + bao. Telegram gui hong thi ghi vao issue — email van toi.
 *
 * Kem 2 loi nhac (cung bang issue): chung chi HTTPS con < 20 ngay (Cloudflare tu gia
 * han tu luc con ~30 ngay, tut duoi 20 la ket) · ten mien con <= 30 ngay. Han .vn KHONG
 * tra tu dong duoc (khong RDAP) nen ghi tay o HAN_TEN_MIEN — gia han xong thi sua ngay do.
 *
 * Gioi han: may kiem chay tren chinh GitHub — GitHub sap toan bo thi khong bao duoc.
 * Chi tiet + cach cai: tools/giam-sat-uptime.md.
 *
 * Cach dung:
 *   node tools/giam-sat-uptime.mjs --thu   chi kiem va in ra, khong dung GitHub/Telegram
 *   node tools/giam-sat-uptime.mjs         (trong Actions) kiem + mo/dong issue + bao
 *   Bam "Run workflow" tay trong tab Actions -> luon gui 1 tin thu ve Telegram.
 *
 * Bien moi truong (Actions tu co GITHUB_TOKEN, GITHUB_REPOSITORY):
 *   TELEGRAM_BOT_TOKEN   ma bot giam sat — CUNG ma voi secret cung ten ben tramdungchill.vn
 *   TELEGRAM_CHAT_ID     tuy chon, nhieu nguoi thi ngan bang dau phay; mac dinh NGUOI_NHAN
 *
 * Ma thoat: 0 = kiem xong (ke ca khi web dang hong — bao dong nam o issue)
 *           1 = khong mo/dong duoc issue (co tinh rot de GitHub gui mail thay),
 *               hoac luot chay tay ma tin thu Telegram khong gui duoc
 */
import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIEN = 'xomleo.vn';
const QUAN = 'Xóm Lèo';
const CHU_REPO = 'Truong02022002';
export const TIEN_TO = '[giam-sat]';
const CHI_THU = process.argv.includes('--thu');

// Tra iNET 15-10-2026 (xem ghi chu "ten mien het han"). Gia han xong thi sua dong nay,
// issue nhac tu dong.
export const HAN_TEN_MIEN = '2028-10-15';
export const NHAC_TEN_MIEN_TRUOC = 30;
export const NHAC_CHUNG_CHI_DUOI = 20;

const SO_LAN_THU = 3;
const CHO_GIUA_LAN = 20000;
const HET_GIO = 30000;
const UA = 'xomleo-giam-sat-uptime/1.0 (+https://github.com/Truong02022002/chillxomleo)';

/** URL webhook lay tu dung cho form dat ban dung (hang so base64 `_0x`, nhu giam-sat-live.mjs). */
function diaChiAppsScript() {
  const m = fs.readFileSync(path.join(ROOT, 'js/main.js'), 'utf8').match(/const _0x = '([A-Za-z0-9+/=]+)'/);
  if (!m) throw new Error('khong tim thay hang so _0x trong js/main.js');
  return Buffer.from(m[1], 'base64').toString();
}

// Tu khoa chi trang THAT moi co — trang do ten mien hay ban build hong van co the tra
// 200. Da thu 20-10-2026: 404.html chi co `#zaloBookingForm` trong CSS, khong co
// `id="zaloBookingForm"`, va khong chua tu khoa nao khac o day.
function danhSachMuc() {
  return [
    { ten: 'Trang chủ', url: `https://${MIEN}/`, tuKhoa: 'id="zaloBookingForm"' },
    { ten: 'Thực đơn', url: `https://${MIEN}/menu/`, tuKhoa: 'id="menu-lat-trang"' },
    { ten: 'Bài blog', url: `https://${MIEN}/quan-nuong-da-lat-view-xe-lua/`, tuKhoa: '"@type": "Article"' },
    { ten: 'robots.txt', url: `https://${MIEN}/robots.txt`, tuKhoa: `Sitemap: https://${MIEN}/sitemap.xml` },
    { ten: 'sitemap.xml', url: `https://${MIEN}/sitemap.xml`, tuKhoa: '<urlset' },
    // doGet chi tra mot dong JSON — khong ghi Sheet, khong gui Telegram. Chi chung minh
    // ban trien khai con song + con quyen "Bat ky ai", KHONG chung minh ghi don chay.
    { ten: 'Form đặt bàn (Apps Script)', url: diaChiAppsScript(), tuKhoa: '"status":"ok"' },
  ];
}

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

function gioVN(d = new Date()) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(d);
}

function ngayHomNayVN() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

/** So ngay tu hom nay toi `iso`. Tinh theo moc trua UTC de khoi lech mui gio. */
function soNgayToi(iso, homNay) {
  const moc = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), 12);
  return Math.round((moc(iso) - moc(homNay)) / 86400000);
}

const ngayVN = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

async function kiemHttp(muc) {
  const res = await fetch(muc.url, {
    headers: { 'user-agent': UA },
    redirect: 'follow',
    signal: AbortSignal.timeout(HET_GIO),
  });
  const than = await res.text();
  if (!res.ok) {
    const chan = res.headers.get('cf-mitigated') ? ' — Cloudflare đang chặn máy kiểm, có thể web vẫn chạy' : '';
    return `mã ${res.status}${chan}`;
  }
  if (muc.tuKhoa && !than.includes(muc.tuKhoa)) return `trả ${res.status} nhưng thiếu từ khoá ${muc.tuKhoa}`;
  return null;
}

export async function kiemMot(muc) {
  let loi = null;
  for (let lan = 1; lan <= SO_LAN_THU; lan++) {
    const batDau = Date.now();
    try {
      loi = await kiemHttp(muc);
    } catch (e) {
      loi = e.name === 'TimeoutError' ? `quá ${HET_GIO / 1000} giây không trả lời` : `lỗi mạng (${e.cause?.code || e.message})`;
    }
    if (!loi) return { ten: muc.ten, ok: true, ms: Date.now() - batDau, lanThu: lan };
    if (lan < SO_LAN_THU) await ngu(CHO_GIUA_LAN);
  }
  return { ten: muc.ten, ok: false, loi, lanThu: SO_LAN_THU };
}

/** May kiem tu mat mang thi moi muc deu do — dung bao dong nham. */
async function mayKiemConMang() {
  for (let lan = 1; lan <= SO_LAN_THU; lan++) {
    try {
      const res = await fetch('https://www.google.com/generate_204', { signal: AbortSignal.timeout(HET_GIO) });
      if (res.status === 204) return true;
    } catch { /* thu lai */ }
    if (lan < SO_LAN_THU) await ngu(CHO_GIUA_LAN);
  }
  return false;
}

function soNgayChungChi() {
  return new Promise((xong) => {
    const s = tls.connect({ host: MIEN, port: 443, servername: MIEN, timeout: 15000 }, () => {
      const het = s.getPeerCertificate().valid_to;
      s.end();
      xong(het ? Math.floor((new Date(het) - Date.now()) / 86400000) : null);
    });
    s.once('timeout', () => { s.destroy(); xong(null); });
    s.once('error', () => xong(null));
  });
}

// --- Issue: mo khi hong, dong khi len lai ---

function ghClient() {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) throw new Error('Thiếu GITHUB_REPOSITORY / GITHUB_TOKEN (chạy ngoài Actions thì dùng --thu)');
  const goi = async (method, duong, body) => {
    const res = await fetch(`https://api.github.com/repos/${repo}${duong}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': UA,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`GitHub API ${method} ${duong} → ${res.status} ${await res.text()}`);
    return res.json();
  };
  return {
    async dangMo() {
      const ds = await goi('GET', '/issues?state=open&per_page=100&creator=' + encodeURIComponent('github-actions[bot]'));
      return ds.filter((i) => !i.pull_request && i.title.startsWith(TIEN_TO));
    },
    tao: (title, body) => goi('POST', '/issues', { title, body }),
    sua: (so, duLieu) => goi('PATCH', `/issues/${so}`, duLieu),
    binhLuan: (so, body) => goi('POST', `/issues/${so}/comments`, { body }),
    dong: (so) => goi('PATCH', `/issues/${so}`, { state: 'closed', state_reason: 'completed' }),
  };
}

// Cung nguoi nhan voi ben tramdungchill.vn: tai khoan da bam Start voi bot giam sat
// ngay 19-10-2026 (bot khong duoc nhan truoc). Them nguoi thi nguoi do bam Start truoc,
// khong thi Telegram tra 400 "chat not found".
const NGUOI_NHAN = ['6022990090'];

async function guiMotChat(maBot, chat, tinNhan) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${maBot}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: tinNhan, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(HET_GIO),
    });
    const tl = await res.json().catch(() => ({}));
    if (res.ok && tl.ok) return null;
    const vi = res.status === 401 ? ' — sai mã bot (chép-dán lại từ BotFather, đừng gõ tay)'
      : res.status === 400 ? ' — sai chat ID, hoặc người nhận chưa bấm Start với bot' : '';
    return `mã ${res.status}${vi}`;
  } catch (e) {
    return e.message;
  }
}

/** ok = toi duoc it nhat mot nguoi; nguoi nao hong thi ghi ro. */
export async function nhanTelegram(tinNhan) {
  const maBot = process.env.TELEGRAM_BOT_TOKEN;
  if (!maBot) return { ok: false, ghi: 'Telegram: chưa cài secret TELEGRAM_BOT_TOKEN' };
  const ds = process.env.TELEGRAM_CHAT_ID ? process.env.TELEGRAM_CHAT_ID.split(',').map((s) => s.trim()).filter(Boolean) : NGUOI_NHAN;
  const loi = await Promise.all(ds.map((c) => guiMotChat(maBot, c, tinNhan)));
  const hong = ds.map((c, i) => loi[i] && `${c}: ${loi[i]}`).filter(Boolean);
  const soToi = ds.length - hong.length;
  if (hong.length === 0) return { ok: true, ghi: `Telegram: đã gửi ${soToi}/${ds.length}` };
  return { ok: soToi > 0, ghi: `Telegram: gửi được ${soToi}/${ds.length} — hỏng ${hong.join('; ')}` };
}

const DAU_HONG = /<!-- dang-hong: (.*?) -->/;

function bangKetQua(ketQua) {
  const dong = ['| Mục | Trạng thái |', '|---|---|'];
  for (const k of ketQua) dong.push(`| ${k.ten} | ${k.ok ? `✅ ${k.ms} ms` : `🔴 ${k.loi}`} |`);
  return dong.join('\n');
}

const HUONG_DAN = [
  '**Làm gì bây giờ** (chi tiết: `tools/giam-sat-uptime.md`, mục "Khi nhận báo động")',
  '1. Mở thử bằng 4G trên điện thoại — sập thật hay chỉ máy kiểm thấy.',
  '2. Trang web hỏng: xem githubstatus.com (Pages) và cloudflarestatus.com; vừa đổi gì trên Cloudflare thì quay lại bước trước.',
  '3. Form đặt bàn hỏng: Apps Script → Triển khai → bản triển khai mà hằng `_0x` trong `js/main.js` đang trỏ tới còn quyền "Bất kỳ ai" không.',
].join('\n');

/**
 * Quyet dinh mo / sua / dong issue. Tach rieng de thu duoc bang client gia.
 * Tra ve danh sach viec da lam (de in log).
 */
export async function xuLy({ ketQua, ngayChungChi, homNay, gh, bao, bayGio = new Date() }) {
  const viec = [];
  const mo = await gh.dangMo();
  const suCo = mo.find((i) => i.title.startsWith(`${TIEN_TO} Sự cố`));
  const hong = ketQua.filter((k) => !k.ok);
  const tap = hong.map((k) => k.ten).join(', ');

  const lienKet = (i) => (i && i.html_url) || `https://github.com/${process.env.GITHUB_REPOSITORY || `${CHU_REPO}/chillxomleo`}/issues`;
  // Gui Telegram SAU khi co issue de tin mang duoc link. Gui hong thi ghi vao issue —
  // email van toi, va nhin issue la biet kenh Telegram dang dut.
  const guiTin = async (issue, tin) => {
    const kq = await bao(`${tin}\n${lienKet(issue)}`);
    viec.push(`  ${kq.ghi}`);
    if (!kq.ok && issue && issue.number) await gh.binhLuan(issue.number, `⚠️ Không báo được qua Telegram — ${kq.ghi}`);
  };

  if (hong.length > 0 && !suCo) {
    const issue = await gh.tao(`${TIEN_TO} Sự cố: ${tap}`, [
      `@${CHU_REPO} máy giám sát thấy **${hong.length}/${ketQua.length} mục hỏng** lúc ${gioVN(bayGio)} (giờ VN), mỗi mục đã thử ${SO_LAN_THU} lần.`,
      '', bangKetQua(ketQua), '', HUONG_DAN, '',
      'Lên lại thì issue này tự đóng.',
      `<!-- dang-hong: ${tap} -->`,
    ].join('\n'));
    viec.push(`mở issue sự cố (${tap})`);
    await guiTin(issue, [`🔴 Web ${QUAN} có sự cố — ${gioVN(bayGio)}`,
      ...hong.map((k) => `• ${k.ten}: ${k.loi}`)].join('\n'));
  } else if (hong.length > 0 && suCo) {
    const cu = ((suCo.body || '').match(DAU_HONG) || [])[1];
    if (cu !== tap) {
      await gh.sua(suCo.number, {
        title: `${TIEN_TO} Sự cố: ${tap}`,
        body: (suCo.body || '').replace(DAU_HONG, `<!-- dang-hong: ${tap} -->`),
      });
      await gh.binhLuan(suCo.number, `Danh sách mục hỏng đổi lúc ${gioVN(bayGio)}: **${tap}**\n\n${bangKetQua(ketQua)}`);
      viec.push(`cập nhật issue #${suCo.number} (${cu} → ${tap})`);
      await guiTin(suCo, [`🟠 Web ${QUAN}: mục đang hỏng đổi — ${gioVN(bayGio)}`, ...hong.map((k) => `• ${k.ten}: ${k.loi}`)].join('\n'));
    } else {
      viec.push(`issue #${suCo.number} vẫn mở, không đổi`);
    }
  } else if (suCo) {
    const phut = Math.round((bayGio - new Date(suCo.created_at)) / 60000);
    await gh.binhLuan(suCo.number, `✅ Cả ${ketQua.length} mục đã lên lại lúc ${gioVN(bayGio)} — sự cố kéo dài khoảng **${phut} phút** (tính từ lúc máy kiểm phát hiện).`);
    await gh.dong(suCo.number);
    viec.push(`đóng issue #${suCo.number} sau ${phut} phút`);
    await guiTin(suCo, `✅ Web ${QUAN} đã lên lại — ${gioVN(bayGio)}, sự cố kéo dài khoảng ${phut} phút.`);
  }

  // Nhac chung chi — null nghia la khong doc duoc, viec do cac muc trang web da bao.
  const nhacCC = mo.find((i) => i.title.startsWith(`${TIEN_TO} Nhắc: chứng chỉ`));
  if (ngayChungChi != null && ngayChungChi < NHAC_CHUNG_CHI_DUOI && !nhacCC) {
    const issue = await gh.tao(`${TIEN_TO} Nhắc: chứng chỉ HTTPS còn ${ngayChungChi} ngày`, [
      `@${CHU_REPO} chứng chỉ HTTPS của ${MIEN} còn **${ngayChungChi} ngày**.`,
      'Chứng chỉ này do Cloudflare cấp (web đi qua mây cam) và vốn tự gia hạn từ lúc còn ~30 ngày — tụt dưới 20 ngày là quá trình tự gia hạn đang kẹt.',
      'Xem Cloudflare → SSL/TLS → Edge Certificates có báo lỗi không; chế độ SSL hay DNS vừa bị đổi không.',
    ].join('\n'));
    viec.push(`mở nhắc chứng chỉ (${ngayChungChi} ngày)`);
    await guiTin(issue, `⚠️ Chứng chỉ HTTPS của ${MIEN} còn ${ngayChungChi} ngày — tự gia hạn đang kẹt, cần xem.`);
  } else if (ngayChungChi != null && ngayChungChi >= NHAC_CHUNG_CHI_DUOI && nhacCC) {
    await gh.binhLuan(nhacCC.number, `✅ Chứng chỉ đã gia hạn — còn ${ngayChungChi} ngày.`);
    await gh.dong(nhacCC.number);
    viec.push(`đóng nhắc chứng chỉ #${nhacCC.number}`);
  }

  // Nhac ten mien — han ghi tay, nen tieu de mang ngay de biet dang nhac han nao.
  const conLai = soNgayToi(HAN_TEN_MIEN, homNay);
  const nhacTM = mo.find((i) => i.title.startsWith(`${TIEN_TO} Nhắc: tên miền`));
  if (conLai <= NHAC_TEN_MIEN_TRUOC && !nhacTM) {
    const issue = await gh.tao(`${TIEN_TO} Nhắc: tên miền hết hạn ${ngayVN(HAN_TEN_MIEN)}`, [
      `@${CHU_REPO} tên miền **${MIEN}** hết hạn **${ngayVN(HAN_TEN_MIEN)}** — còn **${conLai} ngày**.`,
      'Hết hạn là cả web biến mất khỏi Google lẫn khách. Gia hạn ở iNET (nên gia hạn nhiều năm + bật tự gia hạn).',
      `Gia hạn xong: sửa \`HAN_TEN_MIEN\` trong \`tools/giam-sat-uptime.mjs\` sang ngày hết hạn mới rồi đẩy lên — issue này tự đóng.`,
    ].join('\n'));
    viec.push(`mở nhắc tên miền (còn ${conLai} ngày)`);
    await guiTin(issue, `⚠️ Tên miền ${MIEN} hết hạn ${ngayVN(HAN_TEN_MIEN)} — còn ${conLai} ngày. Gia hạn ở iNET.`);
  } else if (conLai > NHAC_TEN_MIEN_TRUOC && nhacTM) {
    await gh.binhLuan(nhacTM.number, `✅ Hạn tên miền đã cập nhật thành ${ngayVN(HAN_TEN_MIEN)} (còn ${conLai} ngày).`);
    await gh.dong(nhacTM.number);
    viec.push(`đóng nhắc tên miền #${nhacTM.number}`);
  }

  return viec;
}

async function main() {
  const muc = danhSachMuc();
  const [ketQua, ngayChungChi] = await Promise.all([Promise.all(muc.map(kiemMot)), soNgayChungChi()]);
  const homNay = ngayHomNayVN();

  console.log(`Giám sát ${MIEN} · ${gioVN()} (giờ VN)\n`);
  for (const k of ketQua) {
    console.log(k.ok ? `✅ ${k.ten} — ${k.ms} ms${k.lanThu > 1 ? ` (lần ${k.lanThu})` : ''}` : `🔴 ${k.ten} — ${k.loi}`);
  }
  console.log(`\nChứng chỉ HTTPS: ${ngayChungChi == null ? 'không đọc được' : `còn ${ngayChungChi} ngày`}`);
  console.log(`Tên miền: hết hạn ${ngayVN(HAN_TEN_MIEN)} (ghi tay) — còn ${soNgayToi(HAN_TEN_MIEN, homNay)} ngày`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, ['## Giám sát uptime', '', bangKetQua(ketQua), '',
      `Chứng chỉ còn ${ngayChungChi ?? '?'} ngày · tên miền còn ${soNgayToi(HAN_TEN_MIEN, homNay)} ngày`, ''].join('\n'));
  }

  if (CHI_THU) {
    console.log('\n(chế độ --thu: không mở/đóng issue, không nhắn Telegram)');
    return;
  }

  // Bam "Run workflow" tay = muon biet duong bao con thong -> luon gui mot tin tom tat.
  // Gui hong thi rot workflow cho thay do ngay trong tab Actions.
  if (process.env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
    const soDat = ketQua.filter((k) => k.ok).length;
    const kq = await nhanTelegram([
      `🧪 Thử máy giám sát web ${QUAN} (chạy tay) — ${gioVN()}`,
      `${soDat}/${ketQua.length} mục đạt${soDat === ketQua.length ? ' ✅' : ''}`,
      ...ketQua.filter((k) => !k.ok).map((k) => `• ${k.ten}: ${k.loi}`),
      `Chứng chỉ còn ${ngayChungChi ?? '?'} ngày · tên miền còn ${soNgayToi(HAN_TEN_MIEN, homNay)} ngày`,
    ].join('\n'));
    console.log(`\nTin thử: ${kq.ghi}`);
    if (!kq.ok) process.exitCode = 1;
  }

  if (ketQua.some((k) => !k.ok) && !(await mayKiemConMang())) {
    console.log('\n⚠️  Máy kiểm không ra được Internet (google.com cũng không gọi được) → bỏ qua lượt này, không báo động.');
    return;
  }

  try {
    const viec = await xuLy({ ketQua, ngayChungChi, homNay, gh: ghClient(), bao: nhanTelegram });
    console.log('\n' + (viec.length ? viec.map((v) => `→ ${v}`).join('\n') : '→ không có gì phải báo'));
  } catch (e) {
    console.error(`\n❌ Không mở/đóng được issue: ${e.message}`);
    console.error('   Cố tình để workflow rớt cho GitHub gửi mail thay.');
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`❌ ${e.stack || e.message}`);
    process.exit(1);
  });
}
