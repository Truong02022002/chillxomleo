// Gom mọi đoạn cần dịch của các trang tiếng Việt vào tools/dich/nguon.json.
//   node tools/dich/tach.mjs            ghi nguon.json + in thống kê
//   node tools/dich/tach.mjs --kiem     chỉ in thống kê và số đoạn còn thiếu bản dịch từng thứ tiếng
// Chạy lại sau mỗi lần sửa trang tiếng Việt: đoạn đổi chữ thì đổi id → kho bản dịch báo thiếu.
import fs from 'node:fs';
import path from 'node:path';
import { THU_MUC_DICH, MOI, trangViet, fileCua, capTiengAnh } from './cau-hinh.mjs';
import { tachTrang, chuoiLd, nenDichLd, boMa, maDoan, taoTraLd } from './doan.mjs';

const chiKiem = process.argv.includes('--kiem');
const trang = [];
const doan = {};
const them = (id, vi, loai, duong) => {
  if (!doan[id]) doan[id] = { vi, loai, trang: [] };
  if (!doan[id].trang.includes(duong)) doan[id].trang.push(duong);
};

const banTach = [];
for (const duong of trangViet()) {
  const file = fileCua(duong);
  const src = fs.readFileSync(file, 'utf8');
  const t = tachTrang(src);
  banTach.push({ duong, src, t });
}

// Chuỗi JSON-LD trùng chữ với một đoạn hiển thị (câu hỏi FAQ, nhãn breadcrumb, mô tả meta…) thì
// lấy bản dịch của chính đoạn đó — hai bên phải khớp từng chữ như bản Việt.
const theoChu = new Map();
for (const { t } of banTach) for (const d of t.doan) if (!theoChu.has(boMa(d.nguon))) theoChu.set(boMa(d.nguon), d.id);

for (const { duong, src, t } of banTach) {
  const ids = [];
  const tra = taoTraLd(t.doan);
  for (const d of t.doan) { them(d.id, d.nguon, d.loai, duong); ids.push(d.id); }
  for (const k of t.ld) {
    let j;
    try { j = JSON.parse(k.json); } catch (e) { console.error(`JSON-LD hỏng ở ${duong}: ${e.message}`); process.exitCode = 1; continue; }
    chuoiLd(j, (s, khoa) => {
      if (!nenDichLd(s, khoa)) return;
      const chu = s.replace(/\s+/g, ' ').trim();
      if (tra(chu) || theoChu.has(chu)) return;
      const id = maDoan(chu);
      them(id, chu, 'ld', duong);
      ids.push(id);
    });
  }
  for (const s of t.js) { them(s.id, s.nguon, 'js', duong); ids.push(s.id); }
  trang.push({ duong, en: capTiengAnh(src), doan: [...new Set(ids)] });
}

const tong = Object.values(doan).reduce((a, d) => a + d.vi.length, 0);
console.log(`${trang.length} trang, ${Object.keys(doan).length} đoạn khác nhau, ${tong.toLocaleString('vi')} ký tự nguồn`);
const theoLoai = {};
for (const d of Object.values(doan)) theoLoai[d.loai] = (theoLoai[d.loai] || 0) + 1;
console.log('theo loại:', theoLoai);

for (const n of MOI) {
  const f = path.join(THU_MUC_DICH, 'kho', `${n.ma}.json`);
  const kho = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
  const thieu = Object.keys(doan).filter((id) => !(id in kho));
  console.log(`${n.ma}: có ${Object.keys(doan).length - thieu.length}, thiếu ${thieu.length}`);
}

if (!chiKiem) {
  fs.writeFileSync(path.join(THU_MUC_DICH, 'nguon.json'), JSON.stringify({ trang, doan }, null, 1) + '\n');
  console.log('đã ghi tools/dich/nguon.json');
}
