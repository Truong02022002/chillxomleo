# Kế hoạch đo lường & hợp đồng dữ liệu — xomleo.vn

Bản mô tả chính thức của những gì site gửi về Google Analytics 4: tên sự kiện, điều
kiện bắn, tham số và giá trị hợp lệ. Sửa code đo lường trong `js/main.js` thì sửa cả
file này; báo cáo GA4 và Custom Definitions bên phía Google đều dựa trên hợp đồng ở đây.

Cập nhật: 17-09-2026.

## 1. Site đo bằng gì

**Google tag (gtag.js) gắn thẳng vào trang — KHÔNG dùng Google Tag Manager.**

Không có container GTM nào trong repo lẫn trên bản live (đã kiểm 17-09-2026: 0/137
trang có `GTM-`, bản live không có Zaraz hay script chèn ở tầng Cloudflare). Mọi sự
kiện đều do `js/main.js` gọi `gtag('event', ...)` trực tiếp.

Đây là lựa chọn phù hợp với site này: site tĩnh, một người quản trị, năm sự kiện cố
định, không có thẻ quảng cáo hay thẻ bên thứ ba nào cần bật/tắt theo chiến dịch. Thêm
GTM lúc này chỉ thêm một lớp phải quản trị mà không giải quyết vấn đề nào đang có.

**Nếu sau này thật sự cần GTM** (ví dụ chạy Google Ads / Meta Pixel và muốn bật tắt
thẻ mà không phải đụng code), phải xử lý trước ba việc:

- **CSP sẽ chặn Custom HTML tag.** Mỗi trang khai `script-src 'self' 'sha256-...'
  https://www.googletagmanager.com`, không có `'unsafe-inline'`. Container GTM tải
  được (đúng domain), thẻ dựng sẵn của Google cũng chạy được, nhưng mọi **Custom
  HTML / Custom JavaScript** đều bị chặn vì không có nonce. Hash CSP do
  `tools/csp-hash.mjs` sinh theo từng trang nên không thể khai trước hash cho đoạn mã
  mà GTM chèn lúc chạy.
- **Chế độ Preview của Tag Assistant cũng chèn script** nên có thể vướng CSP; phải thử
  trên một trang trước khi kết luận thẻ hỏng.
- **Hàng đợi dataLayer hiện không theo khuôn GTM.** Khi `gtag` chưa tồn tại,
  `js/main.js` đẩy mảng `['event', tên, payload]`; GTM đọc `dataLayer` theo khuôn đối
  tượng `{event: 'tên', ...}`. Chuyển sang GTM thì phải đổi nhánh dự phòng này.

## 2. Property nào đang nhận dữ liệu

| Mã | Khai ở đâu | Ghi chú |
|---|---|---|
| `G-YWGENK065S` | script nội tuyến trong `<head>` của 127 trang | Property chính |
| `G-1YNW7BWD6W` | **Không có trong repo.** Đến từ *connected site tag* cấu hình trong Google Tag admin | Chưa xác nhận là có chủ đích |

Mọi lượt xem trang vì thế gửi `/g/collect` tới **hai** property. Kiểm lại bất cứ lúc nào:

    curl -s "https://www.googletagmanager.com/gtag/js?id=G-YWGENK065S" | grep -c "G-1YNW7BWD6W"

Khác 0 nghĩa là connected tag vẫn còn (kiểm 17-09-2026: vẫn còn). Tìm trong repo sẽ
luôn ra rỗng — đừng kết luận "site chỉ có một mã GA4" từ kết quả grep.

10 trang còn lại là **stub chuyển hướng** (`<title>Đang chuyển hướng…</title>`), cố ý
không gắn thẻ GA: chúng chuyển tiếp ngay nên một `page_view` ở đó chỉ làm nhiễu số liệu.
Hệ quả cần biết: lưu lượng vào các URL cũ thời WordPress không hiện trong GA4, muốn xem
thì tra Google Search Console.

## 3. Bảng sự kiện

Code: `js/main.js`, khối `XL_DO`. Một thao tác chỉ bắn **một** sự kiện — bộ lắng nghe uỷ
quyền `return` ngay sau lần khớp đầu tiên.

| Sự kiện | Bắn khi | Tham số riêng | Key Event? |
|---|---|---|---|
| `click_call` | bấm link `tel:` | `contact_method: 'phone'` | Nên |
| `chat_open` | bấm link `zalo.me` hoặc `m.me`/`messenger.com` | `chat_channel`: `zalo` \| `messenger` | Nên |
| `click_directions` | bấm link Google Maps (`google.*/maps`, `goo.gl/maps`, `maps.app.goo.gl`) | `map_target: 'google_maps'` | Nên |
| `click_booking_cta` | bấm nút trỏ tới `#booking` | không có | **Không** — mới là ý định, chưa phải khách hàng tiềm năng |
| `generate_lead` | form đặt bàn gửi được request đi | `form_id`, `lead_type`, `guests` (số), `occasion` | Có |

`occasion` chỉ nhận: `none`, `birthday`, `anniversary`, `proposal`, `other`. Lựa chọn
tiếng Việt lẫn tiếng Anh trong form đều quy về cùng bộ giá trị này để hai bản ngôn ngữ
gộp chung được trong báo cáo.

`page_view` do gtag tự bắn. Các sự kiện tự động khác (cuộn, click ra ngoài, tải file…)
tuỳ thiết lập Enhanced measurement trong GA4 admin — không điều khiển bằng code ở đây.

## 4. Tham số gắn kèm mọi sự kiện

| Tham số | Giá trị |
|---|---|
| `page_type` | `home`, `menu`, `blog_index`, `blog_post`, `directions`, `policy`, `about`, `other` |
| `intent_stage` | `action` (trang `menu`, `directions`) · `consideration` (trang chủ và URL chứa `xom-leo`/`tiem-nuong`/`quan-nuong`/`dat-tiec`) · `awareness` (còn lại) |
| `page_language` | lấy từ `<html lang>`: `vi` hoặc `en` |
| `cta_position` | `navbar`, `hero`, `floating`, `footer`, `booking_form`, `article_body`, `article_aside`, `mobile_menu`, `toast`, `main`, `other` |

`intent_stage` là giai đoạn của **trang** nơi hành vi xảy ra, không phải của hành vi —
nhờ vậy trả lời được "bao nhiêu cuộc gọi đến từ bài du lịch chung".

`cta_position` đọc từ DOM lúc bấm, bám vào landmark có thật. Hai chỗ đã bẫy một lần:
trang chủ/menu/blog **không có thẻ `<header>`** (thanh điều hướng là `<nav id="navbar">`),
và `[class*="hero"]` khớp luôn `<body class="home-hero-dark">`. Đổi cấu trúc các khối này
thì phải chạy lại phép thử.

## 5. Dữ liệu không bao giờ gửi vào GA4

Tên khách, số điện thoại, ghi chú, ngày giờ đặt bàn cụ thể — **không** tham số nào mang
các trường đó. `generate_lead` chỉ gửi ngữ cảnh: loại trang, vị trí nút, số khách, dịp.
Một phép thử trong `tools/kiem-do-luong.mjs` khoá điều này lại.

Dữ liệu đặt bàn thật đi thẳng tới Google Apps Script của quán (`script.google.com`, khai
trong `connect-src` và `form-action` của CSP) rồi sang Zalo — không qua GA4.

## 6. Giới hạn đã biết của số liệu

- **Phiên ngắn bị thiếu có hệ thống.** Khách không chạm/cuộn thì `gtag/js` chỉ tải sau
  5,0–8,1 giây (script nội tuyến đợi FCP rồi đợi CPU rảnh — đánh đổi cố ý để giữ điểm
  PSI, xem `dad65de0`). Ai rời trang trước mốc đó thì GA4 không nhận gì, mất cả
  `page_view` lẫn phiên. Hệ quả: mọi tỉ lệ chuyển đổi (lead / phiên) **đẹp hơn thực tế**.
- **`generate_lead` chỉ chắc "request đi được".** Fetch tới Apps Script dùng
  `mode: 'no-cors'` nên trình duyệt không cho đọc mã trạng thái; Apps Script trả 500 thì
  sự kiện vẫn bắn. Muốn chắc chắn phải sửa Apps Script trả CORS rồi đọc `res.ok`.
- **Số liệu chia cho hai property** chừng nào connected tag ở mục 2 còn đó.

## 7. Kiểm lại trước khi publish

    node tools/kiem-do-luong.mjs        # 18 phép thử, Chrome headless
    node tools/kiem-do-luong.mjs --giu  # giữ Chrome lại để tự xem

Phép thử chặn mọi request tới Google ở tầng CDP và trả 200 giả cho endpoint Apps Script
nên **không làm bẩn dữ liệu thật, không tạo đơn đặt bàn nào**.

`.github/workflows/kiem-do-luong.yml` chạy bộ này sau mỗi push có đổi `js/` hoặc `.html`,
kèm hai phép kiểm "tham chiếu chết": `tools/build-js.js` (bản `.min` còn khớp file nguồn)
và `tools/cache-bust.js` (các trang còn trỏ đúng hash nội dung của JS).

## 8. Việc nằm trong GA4 admin, không sửa bằng code được

- Đánh dấu Key Event cho `click_call`, `chat_open`, `click_directions`, `generate_lead`
  (**không** đánh dấu `click_booking_cta`).
- Đăng ký Custom Definitions cho `page_type`, `intent_stage`, `page_language`,
  `cta_position`, `chat_channel`, `occasion` — chưa đăng ký thì báo cáo không lọc được
  theo các tham số này.
- Tạo internal traffic filter để lượt truy cập của quán không lẫn vào số liệu.
- Xem DebugView xác nhận GA4 nhận đúng tên và tham số.
- Xử lý connected site tag `G-1YNW7BWD6W` ở mục 2 — giữ hay gỡ.
- Kiểm quyền: ít nhất hai tài khoản có quyền quản trị, bật xác minh hai bước, gỡ quyền
  của người không còn cộng tác.

## 9. Quy tắc khi sửa khối đo lường

1. **Đừng đổi tên sự kiện hay tham số đã có** — báo cáo GA4, Key Event và Custom
   Definitions đều gãy theo, và dữ liệu cũ không đổi tên ngược lại được.
2. Sự kiện tuỳ chỉnh viết `snake_case`, bắt đầu bằng động từ; ưu tiên tên khuyến nghị
   của GA4 khi có.
3. Không gửi dữ liệu nhận dạng cá nhân vào GA4.
4. Sửa xong chạy `node tools/kiem-do-luong.mjs`; đổi `js/main.js` thì chạy tiếp
   `node tools/build-js.js --write` rồi `node tools/cache-bust.js --write`.
