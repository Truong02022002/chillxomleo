// Bộ chọn ngôn ngữ (menu thả xuống 7 thứ tiếng) + khối hreflang + og:locale:alternate.
// CHỈ dùng regex, không cần parse5: tools/dang-bai-theo-lich.mjs gọi file này trong GitHub Actions
// (nơi không cài gì), để bài đăng theo lịch có bộ chọn đúng của chính nó thay vì của bài làm khung.
//
// `ban` = { vi: '/x/', en: '/x-en/', zh: '/zh/x/' | null, ... } — đường dẫn bản cùng nội dung ở từng
// thứ tiếng; null = chưa có bản đó → bộ chọn dẫn về trang chủ của thứ tiếng đó, và KHÔNG khai hreflang.
import { TAT_CA, MIEN } from './cau-hinh.mjs';

const TRANG_CHU = { vi: '/', en: '/en/', zh: '/zh/', ko: '/ko/', ja: '/ja/', ru: '/ru/', th: '/th/' };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const DIA_CAU = '<svg class="cnn-dia-cau" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
const MUI = '<svg class="cnn-mui" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>';

function dsLink(hienTai, ban) {
  return TAT_CA.map((n) => {
    const href = ban[n.ma] || TRANG_CHU[n.ma];
    const dang = n.ma === hienTai ? ' aria-current="true"' : '';
    return `<li><a href="${href}" hreflang="${n.hreflang}" lang="${n.lang}"${dang}>${n.ten}</a></li>`;
  }).join('');
}

// kieu 'may-tinh': nút tròn có quả địa cầu + mã (VI) mở danh sách thả xuống, như ảnh mẫu.
// kieu 'di-dong': trong menu toàn màn hình của điện thoại — bày sẵn 7 nút, khỏi bấm hai lần.
export function dungBoChon({ hienTai, ban, kieu }) {
  const n = TAT_CA.find((x) => x.ma === hienTai);
  if (kieu === 'di-dong') {
    return `<ul class="cnn-luoi" translate="no" aria-label="${esc(n.nhanChon)}">${dsLink(hienTai, ban)}</ul>`;
  }
  // Tên đọc ra bắt đầu bằng đúng chữ hiển thị (WCAG 2.5.3): "VI – Ngôn ngữ: Tiếng Việt".
  return `<details class="chon-ngon-ngu" translate="no"><summary class="cnn-nut" aria-label="${n.nhan} – ${esc(n.nhanChon)}: ${esc(n.ten)}">${DIA_CAU}<span class="cnn-ma">${n.nhan}</span>${MUI}</summary><ul class="cnn-ds">${dsLink(hienTai, ban)}</ul></details>`;
}

// Thay MỌI bộ chọn trong trang — kiểu cũ (div.lang-switcher "VN | EN") lẫn kiểu mới.
export function thayBoChon(html, { hienTai, ban }) {
  let so = 0;
  const moi = html
    .replace(/<div\b[^>]*\blang-switcher\b[^>]*>[\s\S]*?<\/div>/g, (m) => { so++; return dungBoChon({ hienTai, ban, kieu: /justify-center/.test(m.slice(0, m.indexOf('>'))) ? 'di-dong' : 'may-tinh' }); })
    .replace(/<details class="chon-ngon-ngu"[\s\S]*?<\/details>/g, () => { so++; return dungBoChon({ hienTai, ban, kieu: 'may-tinh' }); })
    .replace(/<ul class="cnn-luoi"[\s\S]*?<\/ul>/g, () => { so++; return dungBoChon({ hienTai, ban, kieu: 'di-dong' }); });
  return { html: moi, so };
}

// Khối <link rel="alternate" hreflang> — chỉ các bản đang có; x-default = bản Việt.
export function khoiHreflang(ban, thut = '  ', nl = '\n') {
  const dong = TAT_CA.filter((n) => ban[n.ma]).map((n) => `<link rel="alternate" hreflang="${n.hreflang}" href="${MIEN}${ban[n.ma]}" />`);
  if (ban.vi) dong.push(`<link rel="alternate" hreflang="x-default" href="${MIEN}${ban.vi}" />`);
  return dong.map((d, i) => (i ? thut : '') + d).join(nl);
}

export function thayHreflang(html, ban) {
  const re = /([ \t]*)<link rel="alternate" hreflang="[^"]+" href="[^"]*" ?\/?>(?:\r?\n[ \t]*<link rel="alternate" hreflang="[^"]+" href="[^"]*" ?\/?>)*/;
  const m = re.exec(html);
  if (!m) return { html, so: 0 };
  const nl = /\r\n/.test(m[0]) ? '\r\n' : '\n';
  return { html: html.slice(0, m.index) + m[1] + khoiHreflang(ban, m[1], nl) + html.slice(m.index + m[0].length), so: 1 };
}

// og:locale:alternate: một thẻ cho mỗi bản khác đang có.
export function thayOgLocale(html, hienTai, ban) {
  const re = /([ \t]*)<meta property="og:locale:alternate" content="[^"]*" ?\/?>(?:\r?\n[ \t]*<meta property="og:locale:alternate" content="[^"]*" ?\/?>)*/;
  const m = re.exec(html);
  if (!m) return { html, so: 0 };
  const nl = /\r\n/.test(m[0]) ? '\r\n' : '\n';
  const khoi = TAT_CA.filter((n) => n.ma !== hienTai && ban[n.ma]).map((n, i) => (i ? m[1] : '') + `<meta property="og:locale:alternate" content="${n.locale}" />`).join(nl);
  return { html: html.slice(0, m.index) + m[1] + khoi + html.slice(m.index + m[0].length), so: 1 };
}
