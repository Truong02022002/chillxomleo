#!/usr/bin/env node
/**
 * THEO DOI DOT CAP NHAT GOOGLE — doc Search Status Dashboard (status.search.google.com/incidents.json, muc
 * Ranking) moi ngay, bao qua issue + Telegram (chung bot giam sat, xem tools/giam-sat-uptime.md) khi:
 *   - dot dang ghi trong tools/dot-cap-nhat-google.json voi xong = null da bao xong ngay D -> nhac: giu yen
 *     site toi het D+7, xuat GSC ky sau D+1 -> D+7 + file 6 thang tu D+10, lenh chay doi-chieu-cap-nhat;
 *   - co dot Ranking moi chua co trong file (bat dau trong 60 ngay qua) -> nhac them vao file, giu yen site;
 *   - ngay xong trong file lech voi dashboard.
 * Moi su kien MOT issue (tieu de mang id dot + loai su kien): issue cung tieu de da co (mo hay dong) thi
 * khong bao lai. Script KHONG commit gi — nguoi dien ngay vao json la chu site hoac Claude.
 * Ngay tinh theo gio US/Pacific nhu dashboard va Search Console (xem _ghi_chu trong json).
 *
 * Dung:
 *   node tools/theo-doi-dot-google.mjs --thu [--tu-file <incidents.json>] [--hom-nay YYYY-MM-DD]
 *        chi in ra, khong mo issue, khong nhan tin
 *   (GitHub Actions, theo-doi-dot-google.yml) node tools/theo-doi-dot-google.mjs
 *        bam "Run workflow" tay -> luon gui mot tin tom tat de thu duong bao
 * Bien moi truong: GITHUB_TOKEN, GITHUB_REPOSITORY (Actions tu co), TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (tuy chon).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nhanTelegram } from './giam-sat-uptime.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NGUON = 'https://status.search.google.com/incidents.json';
const UA = 'xomleo-theo-doi-dot-google/1.0 (+https://github.com/Truong02022002/chillxomleo)';
export const TIEN_TO = '[dot-google]';
// Bot Telegram dung chung voi Tram Dung Chill: tin cua quan nao mo dau bang ten quan do. Issue gan @chu repo
// de GitHub chac chan gui email (kenh du phong khi Telegram hong), giong giam-sat-uptime.
const QUAN = 'Xóm Lèo';
const CHU_REPO = 'Truong02022002';
const thamSo = (ten) => { const i = process.argv.indexOf(ten); return i > 0 ? process.argv[i + 1] : null; };
const THANG = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
const congNgay = (s, n) => new Date(Date.parse(s + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const soNgay = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
// en-CA cho dang YYYY-MM-DD
export const ngayPacific = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

// Ngay xong: uu tien cau "The rollout was complete as of October 8, 2026." trong ban cap nhat (dung ngay Google
// cong bo); khong co thi lay "end" doi sang gio Pacific.
export function ngayXong(inc) {
  const chu = [inc.most_recent_update && inc.most_recent_update.text, ...(inc.updates || []).map((u) => u && u.text)].filter(Boolean);
  for (const t of chu) {
    const m = t.match(/complete[d]? as of ([A-Z][a-z]+) (\d{1,2}), (\d{4})/);
    if (m && THANG[m[1]]) return `${m[3]}-${String(THANG[m[1]]).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }
  return inc.end ? ngayPacific(inc.end) : null;
}

const laRanking = (inc) => inc.service_name === 'Ranking' || (inc.affected_products || []).some((p) => p && p.title === 'Ranking');
// CLAUDE.md muc 4 chi bat giu yen site voi core / spam update; dot khac (vd Discover) chi ghi chu
const laCoreSpam = (ten) => /core update|spam update/i.test(String(ten || ''));
// id dot lay tu URL nguon (chiu duoc ?hl=vi, dau / cuoi)
export const idCua = (nguon) => (String(nguon || '').match(/incidents\/([A-Za-z0-9]+)/) || [])[1] || null;
const lenhDoiChieu = (key) => `node tools/doi-chieu-cap-nhat.mjs --dot ${key} --truoc <kỳ trước>.zip --sau <kỳ sau>.zip --ca-ky <6 tháng>.zip --ra <thư mục ngoài repo>`;

// So dashboard voi json -> danh sach su kien can bao
export function xetSuKien(incidents, dsDot, homNay) {
  const viec = [];
  const theoId = new Map(dsDot.map((d) => [idCua(d.nguon), d]).filter(([id]) => id));
  for (const inc of incidents) {
    if (!inc || !inc.id || !inc.begin || !laRanking(inc)) continue;
    const batDau = ngayPacific(inc.begin), xong = ngayXong(inc), link = `https://status.search.google.com/incidents/${inc.id}`;
    const d = theoId.get(inc.id);
    if (!d) {
      if (soNgay(batDau, homNay) > 60) continue; // dot cu tu truoc khi co file: bo qua
      viec.push({ loai: 'moi', id: inc.id, tieuDe: `${TIEN_TO} Đợt mới: ${inc.external_desc} (bắt đầu ${batDau})`, dong: [
        `⚠️ ${QUAN} · Google bắt đầu đợt "${inc.external_desc}" ngày ${batDau} (giờ Pacific)${xong ? `, đã xong ${xong}` : ''}.`,
        `• Thêm vào tools/dot-cap-nhat-google.json (batDau ${batDau}, xong ${xong ? xong : 'null'}, nguon ${link}).`,
        `• Search Console → Hiệu suất: bấm chuột phải ngày ${batDau} → Add annotation.`,
        laCoreSpam(inc.external_desc)
          ? `• Giữ yên site từ nay tới hết 7 ngày sau khi xong (CLAUDE.md mục 4): không sửa hàng loạt, không đổi URL / title / H1.`
          : `• Đợt này không phải core / spam update — CLAUDE.md mục 4 không bắt giữ yên site; chủ quyết có giữ hay không.`,
        `• Xuất GSC kỳ trước ${congNgay(batDau, -7)} → ${congNgay(batDau, -1)} (một file 7 ngày, sau khi qua ít nhất 3 ngày).`,
        `Nguồn: ${link}`,
      ] });
    } else if (!d.xong && xong) {
      viec.push({ loai: 'xong', id: inc.id, tieuDe: `${TIEN_TO} Đã xong: ${d.ten} (${xong})`, dong: [
        `✅ ${QUAN} · Google báo xong đợt "${d.ten}" ngày ${xong} (giờ Pacific).`,
        laCoreSpam(d.ten) ? `• Giữ yên site tới hết ${congNgay(xong, 7)}.` : `• Đợt này không phải core / spam update — không bắt giữ yên site.`,
        `• Kỳ sau: ${congNgay(xong, 1)} → ${congNgay(xong, 7)}. Từ ${congNgay(xong, 10)} xuất GSC: kỳ sau (một file 7 ngày) + một file 6 tháng qua.`,
        `• Điền "xong": "${xong}" cho key ${d.key} trong tools/dot-cap-nhat-google.json, rồi chạy:`,
        `  ${lenhDoiChieu(d.key)}`,
        `Quy trình: tools/do-luong.md mục 13. Nguồn: ${link}`,
      ] });
    } else if (d.xong && xong && d.xong !== xong) {
      viec.push({ loai: 'lech', id: inc.id, tieuDe: `${TIEN_TO} Ngày xong lệch: ${d.ten} (file ${d.xong}, dashboard ${xong})`, dong: [
        `ℹ️ ${QUAN} · Đợt "${d.ten}": tools/dot-cap-nhat-google.json ghi xong ${d.xong}, dashboard ghi ${xong}. Sửa file theo dashboard.`,
        `Nguồn: ${link}`,
      ] });
    }
  }
  return viec;
}

export function ghClient() {
  const repo = process.env.GITHUB_REPOSITORY, token = process.env.GITHUB_TOKEN;
  if (!repo || !token) throw new Error('Thiếu GITHUB_REPOSITORY / GITHUB_TOKEN (chạy ngoài Actions thì dùng --thu)');
  const goi = async (method, duong, body) => {
    const res = await fetch(`https://api.github.com/repos/${repo}${duong}`, {
      method, body: body ? JSON.stringify(body) : undefined,
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': UA },
    });
    if (!res.ok) throw new Error(`GitHub API ${method} ${duong} → ${res.status} ${await res.text()}`);
    return res.json();
  };
  return {
    // Ca issue da dong: su kien da bao mot lan thi thoi. Bot github-actions[bot] dung chung voi giam-sat va
    // sao-bai nen doc het moi trang (100 issue / trang), khong chi trang dau.
    daCo: async () => {
      const ten = [];
      for (let trang = 1; trang <= 50; trang++) {
        const ds = await goi('GET', `/issues?state=all&per_page=100&page=${trang}&creator=` + encodeURIComponent('github-actions[bot]'));
        for (const i of ds) if (!i.pull_request && i.title.startsWith(TIEN_TO)) ten.push(i.title);
        if (ds.length < 100) break;
      }
      return ten;
    },
    tao: (title, body) => goi('POST', '/issues', { title, body }),
    binhLuan: (so, body) => goi('POST', `/issues/${so}/comments`, { body }),
  };
}

// Doc dashboard, thu lai 3 lan cach 20 giay (mot lan chop mang khong lam workflow do)
export async function docDashboard(lan = 3, cho = 20000) {
  let loi;
  for (let k = 1; k <= lan; k++) {
    try {
      const res = await fetch(NGUON, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`Dashboard trả ${res.status}`);
      return await res.json();
    } catch (e) { loi = e; if (k < lan) await new Promise((r) => setTimeout(r, cho)); }
  }
  throw loi;
}

async function main() {
  const chiThu = process.argv.includes('--thu');
  const homNay = thamSo('--hom-nay') || new Date().toISOString().slice(0, 10);
  const tuFile = thamSo('--tu-file');
  const incidents = tuFile ? JSON.parse(fs.readFileSync(tuFile, 'utf8')) : await docDashboard();
  if (!Array.isArray(incidents)) throw new Error('incidents.json không phải mảng — dashboard đổi định dạng?');
  const dsDot = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/dot-cap-nhat-google.json'), 'utf8')).dot;
  const viec = xetSuKien(incidents, dsDot, homNay);
  const dangChay = dsDot.filter((d) => !d.xong).map((d) => `${d.ten} (từ ${d.batDau})`);
  console.log(`Dashboard: ${incidents.filter(laRanking).length} đợt Ranking · trong file đang chạy: ${dangChay.join(', ') || 'không'} · sự kiện cần báo: ${viec.length}`);
  for (const v of viec) console.log(`\n${v.tieuDe}\n${v.dong.join('\n')}`);
  if (chiThu) { console.log('\n(chế độ --thu: không mở issue, không nhắn Telegram)'); return; }

  if (process.env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
    const kq = await nhanTelegram([`🧪 ${QUAN} · Thử theo dõi đợt cập nhật Google (chạy tay) — ${homNay}`, `Đang chạy theo file: ${dangChay.join(', ') || 'không'}`, `Sự kiện cần báo: ${viec.length}`, `https://github.com/${process.env.GITHUB_REPOSITORY || `${CHU_REPO}/chillxomleo`}/actions/workflows/theo-doi-dot-google.yml`].join('\n'));
    console.log(`Tin thử: ${kq.ghi}`);
    if (!kq.ok) process.exitCode = 1;
  }
  if (!viec.length) return;
  const gh = ghClient();
  const daCo = new Set(await gh.daCo());
  for (const v of viec) {
    if (daCo.has(v.tieuDe)) { console.log(`Đã báo trước đây: ${v.tieuDe}`); continue; }
    const issue = await gh.tao(v.tieuDe, [`@${CHU_REPO}`, ...v.dong].join('\n\n'));
    const kq = await nhanTelegram([...v.dong, issue.html_url].join('\n'));
    console.log(`Mở ${issue.html_url} · ${kq.ghi}`);
    // Telegram hong: ghi vao issue VA cho workflow do de GitHub gui mail
    if (!kq.ok) { await gh.binhLuan(issue.number, `⚠️ Không báo được qua Telegram — ${kq.ghi}`); process.exitCode = 1; }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`❌ ${e.stack || e.message}`); process.exit(1); });
}
