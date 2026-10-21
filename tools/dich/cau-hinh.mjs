// Cấu hình chung của bộ dịch đa ngôn ngữ (thêm 21-10-2026).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const THU_MUC_DICH = path.join(ROOT, 'tools', 'dich');
export const MIEN = 'https://xomleo.vn';

// Hai ngôn ngữ gốc viết tay + năm ngôn ngữ dựng từ bản Việt bằng tools/dich/dung.mjs.
export const GOC = [
  { ma: 'vi', hreflang: 'vi', lang: 'vi', locale: 'vi_VN', ten: 'Tiếng Việt', nhan: 'VI', nhanChon: 'Ngôn ngữ' },
  { ma: 'en', hreflang: 'en', lang: 'en', locale: 'en_US', ten: 'English', nhan: 'EN', nhanChon: 'Language' },
];
export const MOI = [
  { ma: 'zh', hreflang: 'zh-Hans', lang: 'zh-Hans', locale: 'zh_CN', ten: '中文', nhan: 'ZH', nhanChon: '语言', tenViet: 'tiếng Trung giản thể' },
  { ma: 'ko', hreflang: 'ko', lang: 'ko', locale: 'ko_KR', ten: '한국어', nhan: 'KO', nhanChon: '언어', tenViet: 'tiếng Hàn' },
  { ma: 'ja', hreflang: 'ja', lang: 'ja', locale: 'ja_JP', ten: '日本語', nhan: 'JA', nhanChon: '言語', tenViet: 'tiếng Nhật' },
  { ma: 'ru', hreflang: 'ru', lang: 'ru', locale: 'ru_RU', ten: 'Русский', nhan: 'RU', nhanChon: 'Язык', tenViet: 'tiếng Nga' },
  { ma: 'th', hreflang: 'th', lang: 'th', locale: 'th_TH', ten: 'ไทย', nhan: 'TH', nhanChon: 'ภาษา', tenViet: 'tiếng Thái' },
];
export const TAT_CA = [...GOC, ...MOI];
export const MA_MOI = MOI.map((n) => n.ma);
export const RE_TIEN_TO_MOI = new RegExp(`^/(${MA_MOI.join('|')})/`);

export const fileCua = (duong) => path.join(ROOT, duong === '/' ? '' : decodeURI(duong).slice(1), 'index.html');
export const duongMoi = (ma, duongVi) => `/${ma}${duongVi}`;

// Trang tiếng Việt cần có năm bản dịch = mọi URL tiếng Việt trong sitemap. Bài mới đăng theo lịch
// tự vào danh sách này; chạy dung.mjs khi chưa có bản dịch thì nó báo thiếu và KHÔNG dựng trang đó.
export function trangViet() {
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const ds = [...sm.matchAll(/<loc>https:\/\/xomleo\.vn([^<]*)<\/loc>/g)].map((m) => m[1]);
  return ds.filter((p) => !/-en\/$/.test(p) && !p.startsWith('/en/') && !RE_TIEN_TO_MOI.test(p));
}

// Cặp tiếng Anh của một trang Việt, đọc từ <link rel="alternate" hreflang="en">.
export function capTiengAnh(html) {
  const m = html.match(/<link rel="alternate" hreflang="en" href="https:\/\/xomleo\.vn([^"]+)"/);
  return m ? m[1] : null;
}
