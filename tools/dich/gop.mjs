// Gộp các gói bản dịch đã kiểm vào kho tools/dich/kho/<ma>.json (kho được commit; dung.mjs đọc kho).
//   node tools/dich/gop.mjs [zh,ko,...]
// Đoạn có lỗi mã thẻ / biến bị bỏ qua và in ra; các đoạn đúng trong cùng gói vẫn được gộp.
import fs from 'node:fs';
import path from 'node:path';
import { THU_MUC_DICH, MOI } from './cau-hinh.mjs';

const MA = (process.argv[2] || MOI.map((n) => n.ma).join(',')).split(',');
const RE_MA = /<(\/?)([a-z][a-z0-9]*?)(\d+)(\/?)>/g;
const dsMa = (s) => [...s.matchAll(RE_MA)].map((m) => m[0]).sort().join(' ');
const { doan } = JSON.parse(fs.readFileSync(path.join(THU_MUC_DICH, 'nguon.json'), 'utf8'));

for (const ma of MA) {
  const fKho = path.join(THU_MUC_DICH, 'kho', `${ma}.json`);
  const kho = fs.existsSync(fKho) ? JSON.parse(fs.readFileSync(fKho, 'utf8')) : {};
  const thuMuc = path.join(THU_MUC_DICH, 'ban-dich', ma);
  if (!fs.existsSync(thuMuc)) { console.log(`${ma}: chưa có thư mục ban-dich`); continue; }
  let them = 0, doi = 0, bo = 0;
  for (const f of fs.readdirSync(thuMuc).filter((f) => f.endsWith('.json')).sort()) {
    let dich;
    try { dich = JSON.parse(fs.readFileSync(path.join(thuMuc, f), 'utf8')); } catch (e) { console.log(`${ma}/${f}: JSON hỏng, bỏ cả gói`); continue; }
    for (const [id, t] of Object.entries(dich)) {
      const d = doan[id];
      if (!d || typeof t !== 'string' || !t.trim()) { bo++; continue; }
      if (dsMa(d.vi) !== dsMa(t)) { console.log(`${ma}/${f}: ${id} mã thẻ lệch, bỏ`); bo++; continue; }
      if (d.loai === 'js' && (d.vi.match(/\{\d+\}/g) || []).sort().join() !== (t.match(/\{\d+\}/g) || []).sort().join()) { bo++; continue; }
      const sach = t.replace(/\s+/g, ' ').trim();
      if (!(id in kho)) them++; else if (kho[id] !== sach) doi++;
      kho[id] = sach;
    }
  }
  const sapXep = Object.fromEntries(Object.keys(kho).sort().map((k) => [k, kho[k]]));
  fs.mkdirSync(path.dirname(fKho), { recursive: true });
  fs.writeFileSync(fKho, JSON.stringify(sapXep, null, 1) + '\n');
  const conThieu = Object.keys(doan).filter((id) => !(id in kho)).length;
  console.log(`${ma}: +${them} mới, ${doi} sửa, ${bo} bỏ — kho ${Object.keys(kho).length} đoạn, còn thiếu ${conThieu}/${Object.keys(doan).length}`);
}
