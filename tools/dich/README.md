# Bộ dịch đa ngôn ngữ — /zh/ /ko/ /ja/ /ru/ /th/

Thêm ngày 21-10-2026. Ngoài bản Việt (gốc) và bản Anh (viết tay, `-en/`), mọi trang tiếng Việt trong
sitemap có 5 bản dịch ở `/zh/<đường-dẫn-Việt>`, `/ko/…`, `/ja/…`, `/ru/…`, `/th/…` (trang chủ: `/zh/`).

**Trang dịch là file sinh ra.** Đừng sửa tay trong `zh/ ko/ ja/ ru/ th/` — lần dựng sau ghi đè. Sửa bản
Việt, hoặc sửa bản dịch trong `tools/dich/kho/<ma>.json`, rồi dựng lại.

## Cách hoạt động

1. `doan.mjs` tách trang Việt thành **đoạn**: chữ giữa hai thẻ khối (thẻ nội dòng thành mã `<a1>…</a1>`,
   `<br2/>`), thuộc tính có chữ (alt, aria-label, meta description…), chuỗi JSON-LD, chuỗi trong script
   ô tìm kiếm blog. Mỗi đoạn có id = sha1 của chữ nguồn → đoạn trùng giữa các trang chỉ dịch một lần.
2. `kho/<ma>.json` = `{ id: bản dịch }`. Đây là thứ duy nhất cần giữ (được commit).
3. `dung.mjs` lấy trang Việt, thay từng đoạn bằng bản dịch đúng vị trí (CSS nhúng, script, thuộc tính khác
   giữ nguyên từng byte), đổi link nội bộ sang bản cùng thứ tiếng, sửa `lang`, canonical, og:url,
   og:locale, hreflang, JSON-LD (inLanguage, @id/url của trang), chèn `js/ngon-ngu.js` (chữ do JS sinh ra),
   rồi cập nhật bộ chọn ngôn ngữ + hreflang của trang Việt/Anh và `sitemap.xml`.
   Câu hỏi/trả lời FAQ trong JSON-LD được lấy từ chính bản dịch của đoạn hiển thị để khớp chữ
   (`tools/kiem-schema.mjs` luật faq-an).

Trang thiếu bản dịch (dù một đoạn) thì **không dựng** và bị báo; bộ chọn ngôn ngữ của trang đó dẫn về
trang chủ thứ tiếng kia, không khai hreflang cho thứ tiếng đó.

## Cài một lần

```
cd tools/dich && npm install --no-save --no-package-lock parse5@7.3.0
```
(`bo-chon.mjs` không cần parse5 — `dang-bai-theo-lich.mjs` / `tao-bai-nhap.mjs` dùng nó trong CI.)

## Sửa nội dung tiếng Việt / đăng bài mới → cập nhật bản dịch

```
node tools/dich/tach.mjs                 # gom đoạn → nguon.json, in số đoạn thiếu từng thứ tiếng
node tools/dich/chia-viec.mjs            # gói đoạn thiếu → tools/dich/viec/viec-NN.json
#   dịch từng gói theo tools/dich/HUONG-DAN.md → tools/dich/ban-dich/<ma>/viec-NN.json
node tools/dich/kiem-ban-dich.mjs zh viec-01    # tới khi 0 lỗi
node tools/dich/gop.mjs                  # gộp vào kho/<ma>.json
node tools/dich/dung.mjs                 # dựng trang + bộ chọn + hreflang + sitemap
node tools/csp-hash.mjs --write          # hash script nội tuyến (blog search dịch → hash mới)
node tools/kiem-sitemap.mjs --sua
node tools/kiem-schema.mjs && node tools/audit-links.mjs && node tools/build-css.js && node tools/cache-bust.js
```

`node tools/dich/dung.mjs --kiem` chỉ in độ phủ. Bài mới đăng theo lịch lên sóng với VI/EN; 5 bản dịch
chưa có cho tới khi chạy quy trình trên (bộ chọn tạm dẫn về trang chủ từng thứ tiếng).

Đổi CSS (`css/style.css`) thì `build-css.js --write` nhét CSS vào cả trang dịch — không cần dựng lại.
Đổi chữ do JS sinh ra: thêm câu tiếng Anh qua `dichJs('...')` (main.js) / `t('...')` (ve-tau.js,
mua-le.js), bổ sung bản dịch vào `js/ngon-ngu.js`, rồi `build-js.js --write` + `cache-bust.js --write`.

`tools/chuan-hoa-giao-dien.mjs` bỏ qua 5 thư mục dịch (chuẩn hoá bản Việt rồi dựng lại).
