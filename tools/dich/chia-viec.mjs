// Chia các đoạn CHƯA có bản dịch thành từng gói cho người/agent dịch.
//   node tools/dich/chia-viec.mjs [--co 30000] [--ma zh,ko]   (mặc định: đủ 5 thứ tiếng)
// Ghi tools/dich/viec/viec-NN.json (đoạn thiếu ở ÍT NHẤT một thứ tiếng được chọn) và in ra gói nào
// thiếu ở tiếng nào. Bản dịch trả về đặt ở tools/dich/ban-dich/<ma>/viec-NN.json dạng
// { "<id>": "<bản dịch>" }, kiểm bằng kiem-ban-dich.mjs rồi gộp vào kho bằng gop.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { THU_MUC_DICH, MOI } from './cau-hinh.mjs';

const thamSo = (ten, md) => { const i = process.argv.indexOf(ten); return i > 0 ? process.argv[i + 1] : md; };
const CO = Number(thamSo('--co', 30000));
const MA = thamSo('--ma', MOI.map((n) => n.ma).join(',')).split(',');

const { trang, doan } = JSON.parse(fs.readFileSync(path.join(THU_MUC_DICH, 'nguon.json'), 'utf8'));
const kho = Object.fromEntries(MA.map((ma) => {
  const f = path.join(THU_MUC_DICH, 'kho', `${ma}.json`);
  return [ma, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}];
}));

// Thứ tự: theo trang trong sitemap, mỗi đoạn nằm ở trang ĐẦU TIÊN có nó — nên phần đầu trang
// chung (menu, chân trang) rơi vào gói 1 cùng trang chủ.
const daXep = new Set();
const thuTu = [];
for (const t of trang) for (const id of t.doan) {
  if (daXep.has(id)) continue;
  daXep.add(id);
  if (MA.some((ma) => !(id in kho[ma]))) thuTu.push({ id, trang: t.duong });
}

const thuMuc = path.join(THU_MUC_DICH, 'viec');
fs.rmSync(thuMuc, { recursive: true, force: true });
fs.mkdirSync(thuMuc, { recursive: true });
let goi = [], co = 0, so = 0;
const ghi = () => {
  if (!goi.length) return;
  so++;
  const ten = `viec-${String(so).padStart(2, '0')}`;
  fs.writeFileSync(path.join(thuMuc, ten + '.json'), JSON.stringify({ goi: ten, doan: goi }, null, 1) + '\n');
  const thieu = MA.filter((ma) => goi.some((d) => !(d.id in kho[ma])));
  console.log(`${ten}: ${goi.length} đoạn, ${co.toLocaleString('vi')} ký tự, trang ${[...new Set(goi.map((d) => d.trang))].join(' ')}  [thiếu: ${thieu.join(',')}]`);
  goi = []; co = 0;
};
for (const { id, trang: tr } of thuTu) {
  const d = doan[id];
  goi.push({ id, trang: tr, loai: d.loai, vi: d.vi });
  co += d.vi.length;
  if (co >= CO) ghi();
}
ghi();
console.log(`${thuTu.length} đoạn cần dịch, ${so} gói`);
