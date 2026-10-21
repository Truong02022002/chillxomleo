// Kiểm một gói bản dịch trước khi gộp vào kho.
//   node tools/dich/kiem-ban-dich.mjs <ma> <viec-NN> [viec-MM ...]
// LỖI (thoát mã 1): JSON hỏng, thiếu/thừa id, mã thẻ <a1>…</a1> / <br2/> không khớp nguồn,
// biến {0} của chuỗi script không khớp. CẢNH BÁO: có vẻ chưa dịch (không thấy chữ của ngôn ngữ
// đích), sót chữ tiếng Việt ngoài các tên riêng được giữ, độ dài lệch bất thường.
import fs from 'node:fs';
import path from 'node:path';
import { THU_MUC_DICH, MOI } from './cau-hinh.mjs';

const [ma, ...goi] = process.argv.slice(2);
if (!MOI.some((n) => n.ma === ma) || !goi.length) {
  console.error('Cách dùng: node tools/dich/kiem-ban-dich.mjs <zh|ko|ja|ru|th> <viec-NN> [...]');
  process.exit(2);
}

const CHU_DICH = {
  zh: /\p{Script=Han}/u,
  ja: /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u,
  ko: /\p{Script=Hangul}/u,
  ru: /\p{Script=Cyrillic}/u,
  th: /\p{Script=Thai}/u,
}[ma];
// Tên riêng được phép để nguyên tiếng Việt (xem tools/dich/HUONG-DAN.md).
const TEN_GIU = [
  'Tiệm Nướng & Chill Xóm Lèo', 'Trạm Dừng Chill', 'Xóm Lèo', '113 Huỳnh Tấn Phát', 'Huỳnh Tấn Phát',
  'Phường Xuân Trường - Đà Lạt, Lâm Đồng', 'Phường Xuân Trường', 'Xuân Trường', 'Trại Mát', 'Đơn Dương', 'Lâm Đồng', 'Đà Lạt',
];
const DAU_VIET = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const RE_MA = /<(\/?)([a-z][a-z0-9]*?)(\d+)(\/?)>/g;

function dsMa(s) {
  return [...s.matchAll(RE_MA)].map((m) => (m[1] ? '/' : '') + m[2] + m[3] + (m[4] ? '/' : '')).sort();
}
function longDung(s) {
  const ngan = [];
  for (const m of s.matchAll(RE_MA)) {
    if (m[4]) continue;
    const k = m[2] + m[3];
    if (!m[1]) ngan.push(k);
    else if (ngan.pop() !== k) return false;
  }
  return ngan.length === 0;
}

let tongLoi = 0, tongCanh = 0;
for (const g of goi) {
  const fNguon = path.join(THU_MUC_DICH, 'viec', `${g}.json`);
  const fDich = path.join(THU_MUC_DICH, 'ban-dich', ma, `${g}.json`);
  const loi = [], canh = [];
  let nguon, dich;
  try { nguon = JSON.parse(fs.readFileSync(fNguon, 'utf8')).doan; } catch (e) { console.error(`${g}: không đọc được gói nguồn ${fNguon}: ${e.message}`); tongLoi++; continue; }
  try { dich = JSON.parse(fs.readFileSync(fDich, 'utf8')); } catch (e) { console.error(`${g}: JSON bản dịch hỏng hoặc chưa có (${fDich}): ${e.message}`); tongLoi++; continue; }
  const ids = new Set(nguon.map((d) => d.id));
  for (const d of nguon) {
    const t = dich[d.id];
    if (typeof t !== 'string' || !t.trim()) { loi.push(`${d.id} thiếu bản dịch`); continue; }
    const a = dsMa(d.vi), b = dsMa(t);
    if (a.join() !== b.join()) loi.push(`${d.id} mã thẻ lệch — nguồn [${a.join(' ')}] / dịch [${b.join(' ')}]`);
    else if (!longDung(t)) loi.push(`${d.id} mã thẻ lồng sai thứ tự`);
    if (d.loai === 'js') {
      const ba = (d.vi.match(/\{\d+\}/g) || []).sort().join(), bb = (t.match(/\{\d+\}/g) || []).sort().join();
      if (ba !== bb) loi.push(`${d.id} biến {n} lệch: ${ba} / ${bb}`);
    }
    if ((d.loai === 'tt' || d.loai === 'ld') && /<[a-z]/i.test(t)) loi.push(`${d.id} chuỗi thuộc tính/JSON-LD không được có thẻ`);
    if (/<(?!\/?[a-z][a-z0-9]*?\d+\/?>)[a-z\/][^>]*>/i.test(t.replace(RE_MA, ''))) canh.push(`${d.id} có thẻ HTML lạ (không phải mã <a1>)`);
    // Cảnh báo
    // Giá "209.000đ", "250k", "1.200.000 VNĐ" giữ nguyên theo hướng dẫn — không tính là sót chữ Việt.
    // (Tiếng Nhật/Trung viết liền giá với chữ: "10.000đほど" — nên "đ" không cần đứng cuối từ.)
    let conLai = t.replace(RE_MA, ' ').replace(/\d[\d.,]*\s?(?:đồng|đ|VNĐ|VND)/gu, ' ').replace(/\d[\d.,]*\s?[Kk](?![a-zA-Z])/g, ' ');
    for (const ten of TEN_GIU) conLai = conLai.split(ten).join(' ');
    conLai = conLai.replace(/[（(][^()（）]*[)）]/g, ' ');
    const tuViet = conLai.split(/[\s,.;:!?·•—–\-/«»"“”'’()（）、，。：；！？「」『』]+/).filter((w) => DAU_VIET.test(w));
    if (tuViet.length >= 2) canh.push(`${d.id} còn chữ Việt: ${tuViet.slice(0, 6).join(' ')} — «${t.slice(0, 80)}»`);
    const chuNguon = d.vi.replace(RE_MA, '').replace(/[^\p{L}]/gu, '');
    if (chuNguon.length >= 6 && !CHU_DICH.test(t) && !TEN_GIU.some((x) => d.vi.includes(x) && d.vi.replace(RE_MA, '').trim() === x)) canh.push(`${d.id} có vẻ chưa dịch: «${t.slice(0, 80)}»`);
    const tiLe = t.replace(RE_MA, '').length / Math.max(1, d.vi.replace(RE_MA, '').length);
    if (d.vi.length > 40 && (tiLe < 0.15 || tiLe > 3)) canh.push(`${d.id} độ dài lệch ×${tiLe.toFixed(2)}`);
  }
  for (const id of Object.keys(dich)) if (!ids.has(id)) loi.push(`${id} không có trong gói nguồn`);
  console.log(`${ma} ${g}: ${nguon.length} đoạn — ${loi.length} lỗi, ${canh.length} cảnh báo`);
  for (const x of loi) console.log('  LỖI   ' + x);
  for (const x of canh) console.log('  c.báo ' + x);
  tongLoi += loi.length; tongCanh += canh.length;
}
process.exitCode = tongLoi ? 1 : 0;
