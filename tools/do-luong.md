# Kế hoạch đo lường & hợp đồng dữ liệu — xomleo.vn

Bản mô tả chính thức của những gì site gửi về Google Analytics 4: tên sự kiện, điều
kiện bắn, tham số và giá trị hợp lệ. Sửa code đo lường trong `js/main.js` thì sửa cả
file này; báo cáo GA4 và Custom Definitions bên phía Google đều dựa trên hợp đồng ở đây.

Cập nhật: 19-11-2026. Người chịu trách nhiệm: chủ site (GitHub `Truong02022002`). Lịch sử
thay đổi ở mục 12.

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
| `click_call` | bấm link `tel:` | `contact_method: 'phone'` | **Không** — ý định |
| `chat_open` | bấm link `zalo.me` hoặc `m.me`/`messenger.com` | `chat_channel`: `zalo` \| `messenger` | **Không** — ý định |
| `click_directions` | bấm link Google Maps (`google.*/maps`, `goo.gl/maps`, `maps.app.goo.gl`) | `map_target: 'google_maps'` | **Không** — ý định |
| `click_booking_cta` | bấm nút trỏ tới `#booking` | không có | **Không** — ý định |
| `generate_lead` | webhook Apps Script **trả lời xác nhận** đã nhận đơn đặt bàn; cùng SĐT + ngày đặt chỉ tính **một lần trong 24 giờ** trên cùng trình duyệt (26-10-2026, mục 6) | `form_id`, `lead_type`, `guests` (số), `occasion` | **Có — Key Event duy nhất** |
| `save_ticket` | bấm "Lưu phiếu" (phiếu "Yêu cầu đặt bàn"; trước 29-10-2026 là "Lưu vé tàu" / "Vé đặt bàn") trong thông báo đặt bàn thành công (từ 05-10-2026, `js/ve-tau.js`) — giữ tên event cũ để số liệu GA4 liền mạch | `method`: `share` (điện thoại, bảng chia sẻ) \| `download` (tải PNG); bấm rồi huỷ chia sẻ thì không bắn | **Không** — đo xem khách có mang vé đi khoe không |
| `rate_page` | Apps Script **xác nhận** đã nhận phiếu chấm sao ở khối "Bài viết / Trang này có ích…" cuối 322 trang (từ 28-10-2026, `tools/sao/`); mỗi máy một lần mỗi bài vì phiếu nhớ trong localStorage và nút khoá lại; phiếu bị từ chối hay mất mạng thì không bắn | `rating` (số 1–5) | **Không** — cho biết khách dừng ở bài vì đã tìm được thông tin (4–5) hay chưa (1–2), xem mục 8 |

**Vì sao chỉ một Key Event** (mục 280-281). Bấm số điện thoại chưa có nghĩa là cuộc gọi
kết nối, mở Zalo chưa có nghĩa là có hội thoại, bấm chỉ đường chưa có nghĩa là khách tới.
GA4 cộng mọi Key Event vào chung một cột "Key events" ở báo cáo nguồn truy cập, nên trộn
bốn loại ý định với một loại lead thì con số "chuyển đổi" phồng lên mà không biết phồng từ
đâu. Ba sự kiện click vẫn được ghi đủ — xem ở *Báo cáo → Tương tác → Sự kiện*, hoặc
*Khám phá* với chiều `page_type`/`cta_position`. Số cuộc gọi và hội thoại **thật** chỉ có
trong nhật ký điện thoại của quán và hộp thư Zalo/Messenger, đối soát ở mục 11.

Site không dùng số điện thoại động (call tracking): mọi link `tel:` trên 88 trang, link
Zalo và schema `telephone` (`+84764527336`) là **cùng một số** 076 452 7336 (kiểm
19-09-2026). Số trên Google Business Profile chưa đối chiếu được từ repo — chủ site xem lại
cho khớp. Nếu sau này dùng số động thì chỉ thay số **hiển thị**; schema và GBP giữ số chuẩn.
Số của homestay/quán cà phê khác trong bài du lịch chỉ là chữ, không có link `tel:`, nên
`click_call` không đếm nhầm cuộc gọi tới nơi khác.

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

**`content_group` — bậc DLN của trang** (từ 22-09-2026). Không do `js/main.js` gửi: đoạn GA
nội tuyến đọc thuộc tính `<html data-dln>` rồi đặt vào lệnh `config`, nên nó đi theo **cả
`page_view`** lẫn mọi sự kiện trên trang. Đã kiểm bằng gtag.js thật (chặn hit trước khi rời
máy): `ep.content_group` có trong hit `page_view` và `click_call` gửi tới cả hai property.

| Giá trị | Bậc | Trang (22-09-2026, VI và EN cùng bậc) |
|---|---|---|
| `1-orient` | O — định hướng | 27 bài địa điểm, cẩm nang, lịch trình |
| `2-choose` | C — lựa chọn | 7 bài giúp chọn: nhóm đông, đặt tiệc sinh nhật, ăn sáng, cà phê, chợ đêm, món ngon, homestay |
| `3-prove` | P — chứng minh | `/about/` và 3 bài về chính quán |
| `4-rate` | R — đánh giá chi phí | `/menu/` |
| `5-act` | A — hành động | trang chủ (có form) và `/duong-di/` |
| `hub` · `legal` · `404` | ngoài thang | `/blog/` · 2 trang pháp lý · trang 404 |

Chữ số đầu để GA4 xếp đúng thứ tự O → A khi sắp theo tên. Đây là chiều có sẵn của GA4
("Content group") nên **không cần** đăng ký Custom Definition. Xem ở *Báo cáo → Tương tác →
Trang và màn hình*, đổi chiều chính sang "Content group": có lượt xem, thời gian tương tác
trung bình và tỉ lệ tương tác (= 1 − tỉ lệ thoát) của từng bậc.

⚠ **Đừng đọc cột Key events theo Content group rồi kết luận "bậc A chuyển đổi 100%".** Form
đặt bàn chỉ nằm ở trang chủ nên mọi `generate_lead` đều mang `5-act`. Muốn biết bậc nào
dẫn khách tới lead thì dùng *Khám phá → Phễu*, mỗi bước là `page_view` có Content group =
một bậc, bước cuối là `generate_lead` (xem mục 8). Còn ba sự kiện ý định (`click_call`,
`chat_open`, `click_directions`) xảy ra ở mọi trang, nên đếm thẳng theo Content group là đúng.

Bảng giá trị nằm ở `tools/bac-dln.mjs`. `tools/audit-links.mjs` chặn trang có thẻ GA mà thiếu
hoặc sai bậc, và cặp VI/EN lệch bậc. Bài mới khai `bac` (`O`/`C`/`P`/`R`/`A`) trong
`hang-doi/lich-dang.json`; script đăng bài ghi thuộc tính lúc đăng và dừng nếu thiếu. Gán bậc
theo dàn ý h2/h3 chứ không theo tiêu đề: `/quan-nuong-da-lat-thien-duong-cua-du-khach/` đọc
tiêu đề tưởng bài so sánh (C) nhưng cả 4 h2 đều nói về quán, tức là P.

`intent_stage` là bản cũ, đoán 3 mức theo URL (16-09-2026). Giữ nguyên để khỏi gãy dữ liệu đã
có; phân tích theo bậc thì dùng `content_group`. Hai chiều lệch nhau ở vài trang, ví dụ
`/about/` là `3-prove` nhưng `intent_stage=awareness`, còn trang chủ là `5-act` nhưng
`intent_stage=consideration`.

`cta_position` đọc từ DOM lúc bấm, bám vào landmark có thật. Hai chỗ đã bẫy một lần:
trang chủ/menu/blog **không có thẻ `<header>`** (thanh điều hướng là `<nav id="navbar">`),
và `[class*="hero"]` khớp luôn `<body class="home-hero-dark">`. Đổi cấu trúc các khối này
thì phải chạy lại phép thử.

## 5. Dữ liệu không bao giờ gửi vào GA4

Tên khách, số điện thoại, ghi chú, ngày giờ đặt bàn cụ thể — **không** tham số nào mang
các trường đó. `generate_lead` chỉ gửi ngữ cảnh: loại trang, vị trí nút, số khách, dịp.
Một phép thử trong `tools/kiem-do-luong.mjs` khoá điều này lại.

Dữ liệu đặt bàn thật đi thẳng tới Google Apps Script của quán (`script.google.com`, khai
trong `connect-src` của CSP) bằng `fetch` rồi sang Zalo — không qua GA4. CSP đặt
`form-action 'none'` (07-10-2026): form không có `action`, nên khi `main.min.js` không tải
được thì trình duyệt sẽ tự gửi GET về chính trang, đẩy tên + SĐT lên URL (lịch sử, log
Cloudflare, cache SW). Có thêm form gửi kiểu truyền thống thì phải mở lại `form-action`.

## 6. Giới hạn đã biết của số liệu

- **Phiên ngắn bị thiếu có hệ thống.** Khách không chạm/cuộn thì `gtag/js` chỉ tải sau
  5,0–8,1 giây (script nội tuyến đợi FCP rồi đợi CPU rảnh — đánh đổi cố ý để giữ điểm
  PSI, xem `dad65de0`). Ai rời trang trước mốc đó thì GA4 không nhận gì, mất cả
  `page_view` lẫn phiên. Hệ quả: mọi tỉ lệ chuyển đổi (lead / phiên) **đẹp hơn thực tế**.
- **`generate_lead` trước và sau 19-09-2026 là hai định nghĩa khác nhau.** Trước đó
  fetch dùng `mode: 'no-cors'`, không đọc được trả lời: sự kiện bắn khi "request đi
  được", kể cả lúc Apps Script trả 500. Từ 19-09-2026 form đọc trả lời JSON của webhook
  (webhook có `Access-Control-Allow-Origin: *`) và chia ba nhánh:

  | Trả lời của webhook | Khách thấy | GA4 |
  |---|---|---|
  | JSON, `status`/`result` không chứa `err`/`fail`/`invalid` | "Đã gửi" | `generate_lead` |
  | JSON báo lỗi, HTTP lỗi, hoặc mất mạng | **Báo lỗi** + nút gọi/Zalo, dữ liệu giữ nguyên, gửi lại được ngay | không gì |
  | Không đọc được trả lời nhưng GET tới webhook vẫn thông | "Đã gửi" (đơn nhiều khả năng đã tới; báo lỗi thì khách gửi lại thành đơn trùng) | không gì |

  Trước 19-09-2026, mất mạng cũng hiện "Đã gửi": khách tưởng đã đặt được bàn mà quán
  không nhận được gì.
- ⚠ **Nhánh "xác nhận" mới kiểm với webhook giả lập.** Kiểm với `doPost` thật thì phải
  gửi một đơn thật, nên chưa làm. `doGet` của cùng webhook trả JSON nên nhiều khả năng
  `doPost` cũng vậy. Nếu không, mọi đơn rơi vào nhánh thứ ba: khách vẫn thấy "Đã gửi"
  nhưng `generate_lead` về 0. Cách kiểm và cách sửa ở mục 8.
- **Chống trùng đơn (26-10-2026).** Khoá 30 giây cũ chỉ chặn bấm liên tay trong một tab;
  khách sốt ruột gửi lại sau vài phút hoặc mở tab khác thì quán nhận 2 đơn, GA4 đếm 2 lead.
  Nay `js/main.js` nhớ vân tay (SHA-256, không lưu SĐT thô) của đơn **đã được webhook xác
  nhận** trong 24 giờ, ở `localStorage` khoá `xomleo_don_da_gui`:

  | Khách gửi lại trong 24 giờ | Đơn | GA4 |
  |---|---|---|
  | Y hệt (SĐT + ngày + giờ + số khách) | **không gửi**, báo "Đơn này đã gửi lúc HH:MM…" | không gì |
  | Cùng SĐT + ngày, đổi giờ hoặc số khách | gửi (quán cần biết thay đổi) | không tính thêm lead |
  | Khác ngày | gửi | `generate_lead` |

  Đơn rơi vào nhánh "không đọc được trả lời" **không** được ghi vân tay — đơn đó có thể chưa
  tới, chặn gửi lại là mất đơn. Giới hạn: chỉ chống trùng trên cùng trình duyệt; khách gửi từ
  hai máy vẫn ra hai dòng trong sheet (lọc theo SĐT + ngày ở Apps Script nếu cần).
- **Dòng "đã gửi" còn lại dưới nút (29-10-2026).** Thông báo "Đã gửi" đóng (bấm X, Esc, hoặc
  tự tắt sau 8 giây khi vé tàu không tải được) thì form reset, nhưng dưới nút còn dòng
  `#booking-trang-thai.o-xong` "Đơn này đã gửi lúc HH:MM…" (cùng câu với dòng 1 bảng trên, màu
  nhãn + dấu tích, không phải kiểu lỗi). Trước đó đóng xong là không còn dấu vết: khách quay lại,
  hoặc agent AI đặt bàn hộ chụp màn hình chậm hơn 8 giây, thấy form trống và tưởng chưa gửi được.
  Không bắn event nào.
- **Số liệu chia cho hai property** chừng nào connected tag ở mục 2 còn đó.

## 7. Kiểm lại trước khi publish

    node tools/kiem-do-luong.mjs        # 41 phép thử, Chrome headless
    node tools/kiem-do-luong.mjs --giu  # giữ Chrome lại để tự xem

Phép thử chặn mọi request tới Google ở tầng CDP và trả 200 giả cho endpoint Apps Script
nên **không làm bẩn dữ liệu thật, không tạo đơn đặt bàn nào**.

`.github/workflows/kiem-do-luong.yml` chạy bộ này sau mỗi push có đổi `js/` hoặc `.html`,
kèm hai phép kiểm "tham chiếu chết": `tools/build-js.js` (bản `.min` còn khớp file nguồn)
và `tools/cache-bust.js` (các trang còn trỏ đúng hash nội dung của JS).

**Giám sát hằng tuần trên site thật** — `.github/workflows/giam-sat-do-luong.yml` chạy
`node tools/giam-sat-live.mjs` 11:00 thứ Hai (giờ VN), hỏng thì GitHub gửi mail. Bộ ở trên
chỉ kiểm file trong repo và giả lập webhook; bộ này bắt những hỏng hóc không đi kèm commit
nào:

- webhook đặt bàn còn trả `{"status":"ok"}` kèm header CORS (chỉ hỏi bằng GET, không gửi đơn);
- 4 trang sống tải thẻ `G-YWGENK065S` đúng một lần, trỏ cùng bản `main.min.js` với repo,
  và bản JS đó khớp repo từng byte (bắt Pages kẹt deploy / Cloudflare giữ bản cũ);
- không có thẻ theo dõi nào ngoài hợp đồng này (Pixel, Clarity, Hotjar, TikTok, Zaraz,
  beacon Cloudflare, GTM) — thêm công cụ thì sửa mục 10 và danh sách `TRACKER_NGOAI` trước;
- in ra các property mà `gtag.js` đang gửi tới, để thấy ngay khi connected tag đổi.

## 8. Việc nằm trong GA4 admin, không sửa bằng code được

- Đánh dấu Key Event **chỉ cho `generate_lead`** (lý do ở mục 3). Nếu đã lỡ đánh dấu
  `click_call`, `chat_open` hoặc `click_directions` theo bản hướng dẫn 17-09-2026 thì bỏ
  đánh dấu — bản đó khuyên sai.
- **Sau lần deploy 19-09-2026, gửi một đơn thử** để xác nhận nhánh "xác nhận" chạy với
  `doPost` thật: mở trang chủ, F12 → tab Network, gửi form với tên `TEST - bỏ qua`, bấm vào
  request `exec` và xem tab Response. Thấy JSON kiểu `{"status":"success"}` và
  `generate_lead` hiện trong DebugView là đạt. Nếu Response không phải JSON thì sửa cuối
  `doPost` thành
  `return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);`
  (khối `catch` trả `status: 'error'`), rồi triển khai lại **đúng deployment cũ** để URL
  `/exec` không đổi.
- Tạo cảnh báo trong GA4 (*Insights → Tạo insight tuỳ chỉnh*, gửi email): `page_view`
  theo tuần giảm hơn 50% so với tuần trước, và `generate_lead` có biến động bất thường.
  Bộ giám sát hằng tuần ở mục 7 chỉ biết hệ thống còn chạy, không biết số liệu có sụt không.
- Đăng ký Custom Definitions cho `page_type`, `intent_stage`, `page_language`,
  `cta_position`, `chat_channel`, `occasion`, `rating` — chưa đăng ký thì báo cáo không lọc
  được theo các tham số này. `rating` đăng ký dạng chiều (dimension) phạm vi sự kiện để lọc
  được "4–5 sao" / "1–2 sao" trong Path exploration. **`guests` đăng ký dạng chỉ số tuỳ chỉnh
  (custom metric, phạm vi sự kiện, đơn vị Tiêu chuẩn)** — cộng được "số khách đã đặt" theo
  nguồn, là con số gần doanh thu nhất mà site có (xem mục 11, CPL / CAC / ROAS).
- Tạo sẵn một exploration **Phễu DLN** (*Khám phá → Phễu*, bật "phễu mở"): bước 1 đến 5 là
  `page_view` với Content group lần lượt `1-orient` … `5-act`, bước cuối `generate_lead`. Đây
  là chỗ duy nhất thấy được khách đi qua các bậc nào trước khi đặt bàn (lý do ở mục 4).
  `content_group` không cần đăng ký. Chỉ có số từ 22-09-2026 trở đi.
- **Đọc *Khám phá → Khám phá đường dẫn* (Path exploration) cho đúng.** Phễu DLN ở trên cho
  thấy khách *có* đi qua các bậc theo thiết kế không; Path exploration cho thấy khách *thật sự*
  đi thế nào. Cách dựng: bấm "Bắt đầu lại", chọn **điểm cuối** là sự kiện `generate_lead` để
  xem ngược các trang khách đi qua trước khi đặt bàn; làm thêm một bản điểm cuối
  `click_call` / `chat_open` vì gọi và Zalo mới là kênh đặt bàn chính của quán. Khi thấy
  hành trình dừng ở một URL, xem **điểm cuối có gì** trước khi kết luận đó là điểm rơi:

  | Hành trình dừng ở | Nghĩa | Làm gì |
  |---|---|---|
  | `generate_lead` | đặt bàn qua form thành công (webhook xác nhận) | chuyển đổi — không sửa |
  | `click_call`, `chat_open` | khách gọi / nhắn Zalo, Messenger | gần như chuyển đổi, chỉ không xác nhận được — đối soát với sổ đặt bàn (mục 11), đừng coi là điểm rơi |
  | `click_directions` | mở Google Maps — thường là đang tới quán | ý định cao, không sửa |
  | `/menu/`, `/duong-di/` không kèm sự kiện | khách ở bậc R/A, có thể gọi bằng máy khác hay nhớ địa chỉ | chỉ xem lại nếu thời gian tương tác thấp bất thường |
  | `rate_page` với `rating` 4–5 | khách đọc hết bài và thấy có ích — ở bậc O/C đó là hoàn thành mục tiêu của bài | không phải điểm rơi; nếu nhiều bài như vậy mà ít ai sang bậc kế thì xem lại khối "Gợi ý thêm từ quán", đừng sửa nội dung |
  | `rate_page` với `rating` 1–2 | khách đọc tới cuối mà chưa tìm được thứ cần | sửa **nội dung** bài (thông tin sai, cũ, thiếu) — đổi nút hay màu CTA không chữa được |
  | bài bậc O/C, không sự kiện, không sang trang nào | điểm rơi thật nếu bài không trả lời câu hỏi hoặc thiếu bước tiếp theo | kiểm bài còn link sang bậc kế (`audit-links`, khối "Gợi ý thêm từ quán") trước khi đổi giao diện |

  Nhớ giới hạn ở mục 6: phiên ngắn dưới 5–8 giây không vào GA4, nên Path exploration thiếu
  đúng nhóm khách rời nhanh nhất.
- **Không làm trang cảm ơn riêng (quyết định 26-10-2026).** Form đặt bàn không chuyển trang;
  thành công được xác nhận bằng `generate_lead` (chọn làm điểm cuối trong Path exploration
  được), kèm thông báo + vé tàu tại chỗ. Trang cảm ơn chỉ đổi chỗ hiển thị, không tăng độ
  chính xác, mà thêm một URL phải chặn index, chặn F5 đếm lại và dịch 7 thứ tiếng. Cần làm khi
  có nhu cầu đo bằng URL (ví dụ quảng cáo chỉ nhận chuyển đổi theo trang): dựng
  `/dat-ban-thanh-cong/` `noindex`, chỉ mở sau nhánh xác nhận, không bắn thêm lead.
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
5. Ghi một dòng vào nhật ký ở mục 12.

## 10. Công cụ theo dõi khác (Meta Pixel, Clarity, Hotjar…)

Kiểm 19-09-2026, cả repo lẫn 7 trang sống: **không có** Meta Pixel, Conversions API,
Microsoft Clarity, Hotjar, TikTok Pixel, Zaraz hay mã Google Ads. `gtag.js` của Google cũng
không mang mã `AW-` nào. Mỗi công cụ phải trả lời một câu hỏi cụ thể mới được cài; hiện chưa
có câu hỏi nào như vậy, còn mỗi thẻ thêm vào đều tốn hiệu suất (chỉ riêng GA4 đã làm tăng
TBT đo được), thêm rủi ro quyền riêng tư và dữ liệu trùng.

**CSP có cho phép `static.cloudflareinsights.com`** (script) và `cloudflareinsights.com`
(connect), nhưng **không có beacon Cloudflare Web Analytics nào chạy**: HTML sống không có
thẻ đó. Đừng đọc CSP rồi kết luận site đang dùng Cloudflare Web Analytics.

**Nếu cần Meta Pixel** (quảng cáo Facebook/Instagram trỏ về xomleo.vn, remarketing):

- Tạo **dataset/Pixel riêng cho xomleo.vn** và xác minh domain trong Business Manager.
  Đừng dùng lại Pixel của tramdungchill.vn — trang chị em đã có Pixel và CAPI riêng
  (gửi `event_id` qua `app.tramdungchill.vn`); dùng chung thì hai quán lẫn chuyển đổi.
- CSP: thêm `https://connect.facebook.net` vào `script-src`, `https://www.facebook.com` vào
  `img-src` và `connect-src` trong thẻ CSP của `index.html`, rồi `node tools/csp-hash.mjs
  --write`. Mã khởi tạo `fbq` nội tuyến được băm tự động nếu nằm sẵn trong HTML.
- Sự kiện `Lead` bắn **đúng chỗ `generate_lead`** (nhánh xác nhận), kèm `eventID`. Nếu
  thêm CAPI (qua Apps Script) thì gửi cùng `event_name` và cùng `event_id` để Meta gộp
  thành một; kiểm ở *Events Manager → Test Events* rằng hai kênh chỉ ra một chuyển đổi.
- Giải quyết Consent Mode/đồng ý trước (câu hỏi đang treo) — Pixel là thẻ quảng cáo.
- Sửa mục này, bỏ Pixel khỏi `TRACKER_NGOAI` trong `tools/giam-sat-live.mjs`.

**Nếu cần heatmap/recording** (Clarity miễn phí, không giới hạn phiên): chỉ cài khi có
câu hỏi gắn với một template và một nhóm thiết bị, ví dụ "khách điện thoại ở `/menu/` có
cuộn tới nút đặt bàn không". Khi đó cài trên **đúng template đó**, bật che **Strict**
(che toàn bộ chữ và ô nhập), **không** cài lên trang chủ và `/en/` — hai trang có form đặt
bàn (tên, số điện thoại). Đặt ngày gỡ trước khi cài; lượng truy cập mỗi template ở site
này nhỏ nên heatmap cần nhiều tuần mới đủ mẫu, và không đọc heatmap gộp desktop với mobile.

## 11. Nguồn lead, UTM và đối soát

**Nguồn đi vào sheet đặt bàn, không vào GA4.** Form gửi kèm `source` (nhãn người đọc được,
ví dụ `Google Search`, `Facebook (in-app)`, `AI: ChatGPT`), `medium`, `campaign`, `term`,
`content`, `landing_page`, `landing_referrer`, `submit_page`. GA4 tự lấy nguồn từ URL và
referrer, không cần gửi lại.

Khách vào bằng link có UTM thì `source` = **`<trang vào>/<utm_source>`**, ví dụ
`menu/google_maps` (bấm nút Thực đơn trên GBP) hay `trang_chu/facebook`. Trang vào chỉ
nhận `trang_chu`, `menu`, `duong_di`, `blog`, `gioi_thieu`, `bai_viet`. Không dùng slug bài
hay `utm_content` vì hệ thống quản lý quán gom nguồn bằng regex trên cả chuỗi, chữ tự do lọt
vào sẽ xếp sai nhóm. `medium` **không** ghép vào `source` nữa: trước 19-09-2026 ghép vào
thì Apps Script nối thêm lần nữa, tin Zalo hiện "organic / organic".

- `fbclid` **không** có nghĩa là quảng cáo: Facebook gắn nó vào mọi link đi ra, kể cả bài
  đăng thường của Fanpage. Trước 19-09-2026 site ghi nó thành `Facebook Ads` trong sheet.
  Giờ ghi `Facebook`. Muốn tách quảng cáo thì gắn UTM cho link quảng cáo.
- `ttclid`, `gclid`/`gbraid`/`wbraid`, `msclkid` chỉ có trên click quảng cáo nên vẫn ghi `… Ads`.
  `oppref` (OpenAI tự gắn vào mọi lượt bấm quảng cáo ChatGPT) ghi `ChatGPT Ads`.
- **Trích dẫn AI và quảng cáo trên AI là hai nguồn khác nhau.** ChatGPT tự gắn
  `utm_source=chatgpt.com` vào link trích dẫn tự nhiên → `AI: ChatGPT`. Cùng `utm_source` đó
  mà có `utm_medium` trả phí (`cpc`, `ppc`, `cpm`, `paid…`) hoặc có mã click quảng cáo thì là
  quảng cáo → nhãn `<trang vào>/<utm_source>` như mọi chiến dịch khác. Trước 05-10-2026 lượt
  bấm quảng cáo ChatGPT bị ghi `AI: ChatGPT`.
- Có UTM hoặc mã click mới thì `medium`/`campaign`/`term`/`content` của chiến dịch trước bị xoá.
  Trước 05-10-2026 chúng dính sang nguồn mới: vào bằng quảng cáo Google (`cpc`) rồi vào lại
  bằng link Facebook trong cùng phiên thì dashboard đếm thành `Facebook Ads`.

**Quy ước UTM.** GA4 phân biệt hoa/thường (`Facebook` và `facebook` thành hai dòng), nên:
chữ thường, không dấu, nối bằng `_`. **Không bao giờ gắn UTM cho link nội bộ** (từ
xomleo.vn sang xomleo.vn): GA4 sẽ ghi đè nguồn thật của phiên (kiểm 19-09-2026: 0 link có
`utm_` trên 135 trang). Không đặt tên, số điện thoại hay email vào URL.

**Link dùng sẵn** (tạo 19-09-2026). Mỗi bộ đã chạy thử qua cả ba tầng: nhãn nguồn của site
(ghi vào sheet), `canonicalNguon()` của hệ thống quản lý quán (gom thành 19 nhóm dashboard,
đối chiếu bản code ngày 17-05-2026), và nhóm kênh mặc định của GA4.

| Dán vào đâu | Link | Dashboard | GA4 |
|---|---|---|---|
| GBP → Trang web | `https://xomleo.vn/?utm_source=google_maps&utm_medium=organic&utm_campaign=gbp` | Google Maps | Organic Search |
| GBP → Thực đơn | `https://xomleo.vn/menu/?utm_source=google_maps&utm_medium=organic&utm_campaign=gbp` | Google Maps | Organic Search |
| GBP → Đặt chỗ | `https://xomleo.vn/?utm_source=google_maps&utm_medium=organic&utm_campaign=gbp&utm_content=dat_ban#booking` | Google Maps | Organic Search |
| GBP → nút trong bài đăng | `https://xomleo.vn/?utm_source=google_maps&utm_medium=organic&utm_campaign=gbp&utm_content=bai_dang` | Google Maps | Organic Search |
| Fanpage → mục Giới thiệu | `https://xomleo.vn/?utm_source=facebook&utm_medium=social&utm_campaign=fanpage&utm_content=gioi_thieu` | Facebook | Organic Social |
| Fanpage → nút hành động "Đặt ngay" | `https://xomleo.vn/?utm_source=facebook&utm_medium=social&utm_campaign=fanpage&utm_content=nut_dat_ban#booking` | Facebook | Organic Social |
| Fanpage → bài đăng (đổi trang + tên đợt) | `https://xomleo.vn/menu/?utm_source=facebook&utm_medium=social&utm_campaign=tet_2027` | Facebook | Organic Social |
| Quảng cáo Meta → ô "Tham số URL" | `utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}` | Facebook Ads | Paid Social |
| TikTok → link bio | `https://xomleo.vn/?utm_source=tiktok&utm_medium=social&utm_campaign=bio` | Tiktok | Organic Social |
| Quảng cáo TikTok → tham số URL | `utm_source=tiktok&utm_medium=cpc&utm_campaign=<ten_chien_dich>` | Tiktok Ads | Paid Social |
| Google Ads → Hậu tố URL cuối cùng (cấp chiến dịch) | `utm_source=google&utm_medium=cpc&utm_campaign=<ten_chien_dich>` | Google Ads | Paid Search |
| Quảng cáo ChatGPT → Landing page query parameters (cấp chiến dịch) | `utm_source=chatgpt&utm_medium=cpc&utm_campaign=<ten_chien_dich>` | nhãn thô `<trang vào>/chatgpt` | nhóm Paid, không lẫn Referral |
| Zalo → tin nhắn gửi khách | `https://xomleo.vn/?utm_source=zalo&utm_medium=social&utm_campaign=tin_nhan` | Zalo | Organic Social |
| QR dán ở bàn | `https://xomleo.vn/menu/?utm_source=qr&utm_medium=offline&utm_campaign=ban_an` | "qr / offline" | Unassigned |
| QR danh thiếp / tờ rơi | `https://xomleo.vn/?utm_source=qr&utm_medium=offline&utm_campaign=danh_thiep` | "qr / offline" | Unassigned |

Ghi chú:

- **GBP dùng `utm_source=google_maps`, không dùng `google`.** Dashboard chỉ xếp vào nhóm
  "Google Maps" khi nguồn chứa `google_maps` hoặc `gmb`; nguồn `google` bị gộp chung với
  Google tìm kiếm. GA4 vẫn xếp vào Organic Search nhờ `medium=organic`. GBP là kênh lớn
  nhất (525 lượt bấm "Trang web" trong 6 tháng 4–9/2026) mà trước đây không tách được.
- **Tên chiến dịch viết thường, không dấu, nối bằng `_`** — kể cả tên chiến dịch đặt trong
  Meta/TikTok/Google Ads, vì `{{campaign.name}}` chép nguyên tên đó sang GA4.
- **Quảng cáo phải có `utm_medium` trả phí** (`cpc` hoặc `paid_social`). Không có UTM thì
  site chỉ thấy mã click (`gclid`, `ttclid`) và gửi `medium` rỗng, dashboard (bản 17-05)
  xếp lead quảng cáo thành nguồn tự nhiên. Google Ads vẫn giữ tự động gắn thẻ (`gclid`) song
  song với hậu tố này.
- **Quảng cáo trên Google Maps** dẫn khách tới đúng link "Trang web" của GBP, nên mang UTM
  `google_maps / organic`; site ưu tiên UTM hơn `gclid` nên lượt bấm quảng cáo Maps sẽ tính
  vào Google Maps tự nhiên. Muốn tách thì xem chi phí/lượt bấm trong Google Ads.
- `qr`/`offline` không thuộc nhóm nào của GA4 (*Unassigned*) — lọc theo nguồn `qr`. Mã QR
  đã in thì giữ nguyên, chỉ áp dụng cho lần in sau.
- Link từ tramdungchill.vn sang đây **không cần UTM**: GA4 đã ghi nguồn giới thiệu
  tramdungchill.vn theo referrer.

**Đối soát hằng tháng** (5 phút, mục 279-281):

1. GA4: số `generate_lead` trong tháng. Sheet đặt bàn: số dòng `brand = xomleo` cùng kỳ,
   bỏ dòng thử/rác.
2. **Sheet nhiều hơn GA4 là bình thường** (trình chặn quảng cáo, phiên ngắn chưa kịp tải
   GA4, nhánh "không rõ" ở mục 6). **GA4 nhiều hơn sheet là bất thường** — webhook đang báo
   thành công mà không ghi được, kiểm ngay.
3. Số đơn trong sheet mà nhân viên gọi xác nhận được và khách tới thật — đó mới là lead đạt
   chuẩn. Click gọi/Zalo trong GA4 chỉ để so xu hướng, không cộng vào đây.

**CPL / CAC / ROAS — tính ở đâu (10-11-2026).** Ba chỉ số này cần tiền chi và tiền thu, mà site
không biết cả hai, nên **không tính trong GA4**. Site chỉ lo phần giữa: mỗi lead mang đúng nguồn.

| Chỉ số | Công thức cho quán | Tử số lấy ở | Mẫu số lấy ở |
|---|---|---|---|
| CPL | chi phí kênh ÷ số lead của kênh | Google Ads / Meta / TikTok | sheet đặt bàn lọc theo `source` (đơn form) **+** sổ gọi/Zalo của quán ghi nguồn |
| CAC | chi phí kênh ÷ số **bàn tới thật** của kênh | như trên | cột trạng thái tới / không tới trong sheet — nhân viên điền sau ca |
| ROAS | doanh thu các bàn đó ÷ chi phí kênh | hoá đơn thật của từng bàn (ghi vào sheet) | như trên |

- Form chỉ là một phần lead; gọi và Zalo là kênh đặt bàn chính (mục 8). Tính CPL chỉ bằng
  `generate_lead` thì CPL cao giả.
- Chưa ghi hoá đơn theo bàn thì ước doanh thu bằng **tổng `guests` × 250.000–300.000đ** (giá
  trung bình đã chốt, CLAUDE.md mục 2) và ghi rõ là ước. **Không** gửi `value` giả vào
  `generate_lead`: đơn chưa tới quán thì chưa có doanh thu, và số đã vào GA4 không sửa lại được.
- Site hiện không có thẻ quảng cáo nào (mục 10). Chạy quảng cáo thì gắn UTM theo bảng trên —
  thiếu UTM là lead quảng cáo rơi vào nguồn tự nhiên và CPL của kênh đó tính sai.

## 12. Nhật ký thay đổi

Commit cụ thể: `git log -- js/main.js tools/do-luong.md`.

| Ngày | Thay đổi |
|---|---|
| 16-09-2026 | Gắn 5 sự kiện đầu tiên (trước đó site chỉ có `page_view`). |
| 17-09-2026 | Viết hợp đồng dữ liệu này; CI `kiem-do-luong.yml` chạy sau mỗi push. |
| 19-09-2026 | `generate_lead` chỉ bắn khi webhook xác nhận; gửi hỏng thì báo lỗi thật cho khách; `fbclid` thôi ghi thành `Facebook Ads`; Key Event rút còn `generate_lead`; thêm giám sát hằng tuần trên site thật; ghi trạng thái các công cụ theo dõi khác và quy ước UTM. |
| 19-09-2026 | Bảng link UTM dùng sẵn cho từng kênh (mục 11); GBP đổi sang `utm_source=google_maps` để khớp nhóm "Google Maps" của dashboard. |
| 19-09-2026 | Nguồn có UTM ghi thành `<trang vào>/<utm_source>` (ví dụ `menu/google_maps`), bỏ medium khỏi nhãn nguồn. Đơn TEST trên site thật xác nhận webhook nhận đơn và sheet giữ đủ dấu `_`. |
| 22-09-2026 | Thêm `content_group` = bậc DLN của trang (`<html data-dln>`, mục 4) vào lệnh `config`; 89 trang được gán bậc; `kiem-do-luong.mjs` thêm 4 phép thử, `audit-links.mjs` chặn trang thiếu bậc; lịch đăng bài bắt buộc trường `bac`. |
| 05-10-2026 | Tách quảng cáo trên AI khỏi trích dẫn AI: `oppref` → `ChatGPT Ads`; `utm_source` của trợ lý AI đi kèm medium trả phí hoặc mã click thì không còn ghi `AI: …`; UTM của chiến dịch trước bị xoá khi có nguồn mới; thêm dòng quảng cáo ChatGPT vào bảng link (mục 11); `kiem-do-luong.mjs` thêm 3 phép thử. |
| 26-10-2026 | Chống trùng đơn theo vân tay 24 giờ (mục 6): gửi lại y hệt đơn đã xác nhận thì không gửi, đổi giờ/số khách thì gửi nhưng không tính thêm lead; `kiem-do-luong.mjs` thêm 3 phép thử (33 → 36). Thêm cách đọc Path exploration và lý do chưa làm trang cảm ơn (mục 8). |
| 28-10-2026 | Thêm `rate_page` (mục 3): khối chấm sao gửi `rating` 1–5 vào GA4 khi Apps Script xác nhận phiếu, mỗi máy một lần mỗi bài; Path exploration (mục 8) phân biệt được bài dừng vì đã có ích với bài dừng vì chưa trả lời được. `kiem-do-luong.mjs` thêm 4 phép thử (36 → 40). |
| 29-10-2026 | Phiếu sau khi gửi đổi "Vé đặt bàn" → "Yêu cầu đặt bàn" (khách đọc thành đã đặt xong); dòng "Đơn này đã gửi lúc…" còn lại dưới nút khi thông báo đóng (mục 6). `kiem-do-luong.mjs` 40 → 41. |
| 10-11-2026 | Mục 8 thêm `guests` (custom metric); mục 11 thêm cách tính CPL / CAC / ROAS. Soạn sẵn form nhận tới **60 khách** (hiện vẫn chặn ở 50 — giới hạn kiểm tra từ 04-2026, có trước khi chốt sức chứa đoàn 60 người; đoàn 51–60 được bảo gọi điện) — **chưa lên site**, chờ chủ kiểm `doPost` của Apps Script không chặn trên 50 (CLAUDE.md mục 8). Tên sự kiện, tham số không đổi. |
| 11-11-2026 | Thêm mục 13 (khi Google tung đợt cập nhật xếp hạng): `tools/doi-chieu-cap-nhat.mjs` + `tools/dot-cap-nhat-google.json`; ghi 5 giả thuyết **trước khi có số** cho November 2026 core update (bắt đầu 10-11 giờ Pacific); tiền lệ tháng 8. Cùng ngày, sau một vòng soát độc lập: chỉ xếp loại vị trí khi kỳ trước đủ ngưỡng, "mất hiển thị" chỉ tính dòng đủ ngưỡng (trước đó tuần nào không đổi gì cũng báo "nhóm tụt rõ"), trang / truy vấn mất hẳn khi đang ở trang 1–2 vào "cần đánh giá sâu", nhóm tên quán có ngưỡng riêng, cảnh báo kỳ trước chưa sạch (đọc lùi 3 tuần) và nhóm đối chứng trang không đổi nội dung, dao động thường bỏ tuần lễ, bước 6 đo bằng Khám phá (tách Hồ sơ doanh nghiệp). Thêm workflow `theo-doi-dot-google.yml`: mỗi sáng đọc Search Status Dashboard, issue `[dot-google]` + Telegram khi đợt bắt đầu / xong. Sự kiện, tham số GA4 không đổi. |
| 19-11-2026 | Thêm mục 14 (nếu kênh Google tự nhiên gãy): mốc tên quán / không tên quán từ GSC 6–9/2026, nhu cầu tên quán và CPC từ Keyword Planner, bảng ba kịch bản (core update, trang mất kết quả tên quán, Hồ sơ Maps) với chi phí mua lại ở mức 30 / 50 / 80%. Sự kiện, tham số GA4 không đổi. |
| 22-11-2026 | Phiếu sau khi gửi (`js/ve-tau.js`): tiêu đề "Yêu cầu đặt bàn" → hai dòng "**Yêu cầu đặt bàn / đã được gửi**", con dấu đỏ "Đã gửi · chờ gọi xác nhận" → "**Chưa xác nhận** · chờ quán gọi lại" — chủ site xem ảnh khách chụp phiếu gửi đi, vẫn đọc thành đã đặt bàn thành công. Bản dịch thêm 2 câu (`js/ngon-ngu.js`). Event `save_ticket`, tham số không đổi. |

## 13. Khi Google tung đợt cập nhật xếp hạng (core / spam)

Google công bố mỗi đợt trên [Search Status Dashboard](https://status.search.google.com/summary)
(mục *Ranking*). Ngày bắt đầu / xong của từng đợt ghi ở `tools/dot-cap-nhat-google.json` — nguồn
duy nhất cho ngày, công cụ đọc từ đó. Tụt hạng đúng lúc có đợt **chưa chắc là do đợt đó**; trùng
thời gian là chỗ để điều tra, chưa phải nguyên nhân. Core update "don't target specific sites or
individual web pages" — tụt trùng core update không có nghĩa là bị phạt. Spam update thì khác: đó là
hệ thống tự động (SpamBrain), site vi phạm chính sách spam "may rank lower in results or not appear in
results at all" ([Google](https://developers.google.com/search/updates/spam-updates)) mà **không có
thông báo** nào trong Search Console; mục *Thao tác thủ công* chỉ ghi án do người của Google xét. Tụt
trùng đợt spam thì đọc lại chính sách spam, nhất là nội dung nhân bản theo quy mô (H2 bên dưới).

**Quy trình của site** (bước 3, 4 và phần đọc báo cáo ở bước 5 làm theo [hướng dẫn của
Google](https://developers.google.com/search/updates/core-updates), đọc lại 11-11-2026; bước 1, 2, phần
loại trừ kỹ thuật ở bước 5 và bước 6 là quy ước riêng của site). Workflow `theo-doi-dot-google.yml`
(`tools/theo-doi-dot-google.mjs`) đọc dashboard mỗi sáng 08:17 giờ VN, mở issue `[dot-google]` và nhắn
Telegram khi có đợt mới hoặc đợt đang chạy báo xong — mỗi sự kiện một lần; không tự sửa file nào.

1. **Ngày đợt bắt đầu** (workflow báo): thêm dòng vào `tools/dot-cap-nhat-google.json` (`xong: null`).
   Trong Search Console → Hiệu suất, bấm chuột phải vào ngày đó trên biểu đồ → *Add annotation* (tên đợt).
2. **Từ ngày bắt đầu tới hết 7 ngày sau khi xong — giữ yên site.** Không sửa hàng loạt, không đổi
   URL, title, H1, cấu trúc của trang đang chạy tốt; mọi thay đổi trong cửa sổ này trộn vào tác động
   của Google và không tách ra được nữa (xem tiền lệ tháng 8 bên dưới). Vẫn làm: sửa dữ kiện sai, lỗi
   chức năng (form, link chết), bài mới đã lên lịch — công cụ tự biết trang nào đổi nội dung (đọc
   `lastmod` trong lịch sử sitemap, cùng ngày điểm sao bật lên trong `tools/sao/diem.json`), không
   cần ghi tay. Chạy lại `build-js` / `cache-bust` / `csp-hash` chỉ đổi hash, `kiem-sitemap --sua`
   không nâng `lastmod` khi nội dung không đổi — không tính là sửa hàng loạt. Chủ dán bài viết không
   kèm lời dặn trong cửa sổ này thì chỉ soi và liệt kê; vá sau khi hết cửa sổ (trừ dữ kiện sai, lỗi
   chức năng).
3. **Xuất kỳ trước:** Hiệu suất → Kết quả tìm kiếm → Ngày → Tuỳ chỉnh = **7 ngày ngay trước ngày
   bắt đầu** → Xuất → Tải CSV. Xuất sau khi kỳ đó qua ít nhất 3 ngày (Search Console còn bổ sung số
   của 2–3 ngày gần nhất). Lưu ngoài repo.
4. **Dashboard báo "The rollout was complete as of D"** (workflow báo kèm các mốc dưới): điền `xong`
   vào JSON (hoặc chạy công cụ với `--xong D`). Kỳ sau = **D+1 → D+7**. **Từ D+10** (hết D+7 thêm 3 ngày cho Search Console đủ
   số) mới xuất kỳ sau (một file riêng, **không** dùng chế độ *So sánh* của Search Console) và một
   file *6 tháng qua* cho biểu đồ theo ngày và dao động thường. Giữ yên site tới hết D+7.
5. **Loại trừ nguyên nhân kỹ thuật trước**: xem issue `[giam-sat]` của giám sát uptime trong khoảng
   [ngày bắt đầu, D+7], và Search Console → Cài đặt → Thống kê thu thập dữ liệu → Trạng thái máy chủ
   (robots.txt, DNS, kết nối) cùng khoảng đó — web sập hay robots.txt lỗi trong cửa sổ cũng cho đúng
   hình "tụt trùng đợt". Có sự cố thì ghi vào cột kết luận trước khi xét H1–H5. Rồi chạy
   `node tools/doi-chieu-cap-nhat.mjs --dot <key> --truoc <kỳ trước>.zip --sau <kỳ sau>.zip --ca-ky <6 tháng>.zip --ra <ngoài repo>`
   — kỳ chạm chính đợt đó, đợt chưa xong, kỳ ngắn hơn 7 ngày, hai file lọc khác nhau thì công cụ
   dừng; kỳ trùng một đợt **khác** thì chỉ cảnh báo kèm dòng kết luận — đừng sửa theo báo cáo đó.
   Báo cáo ghi ngoài repo. Đọc theo thứ tự: điều kiện → tổng so với dao động thường → vị trí trên rổ
   truy vấn cố định → nhóm nào đổi (nhất là nhóm trang **không đổi nội dung**) → từng truy vấn / trang.
6. **Kiểm chéo GA4** (khách đặt bàn mới là đích): Khám phá → Biểu mẫu tự do; hàng *Trang đích +
   chuỗi truy vấn*; giá trị *Phiên*, *Số sự kiện*; lọc *Nguồn / phương tiện của phiên* =
   `google / organic` (link Hồ sơ doanh nghiệp gắn `utm_source=google_maps&utm_medium=organic`, GA4
   xếp chung vào nhóm Organic Search — lọc theo nguồn mới tách được web khỏi Maps) và tên sự kiện
   `generate_lead`, `click_call`, `chat_open` (`click_call`, `chat_open` không phải Key Event nên
   không hiện ở báo cáo Trang đích chuẩn). So kỳ trước với D+1 → D+7 (GA4 chia ngày theo múi giờ của property
   — Quản trị → Cài đặt property; Search Console theo giờ Pacific — lệch một ngày là bình thường). Đối chứng: dashboard đặt bàn — nhóm "Google tìm kiếm" so với
   "Google Maps"; Hồ sơ doanh nghiệp → Hiệu suất (gọi, chỉ đường, bấm web) cùng hai kỳ. Maps cũng giảm
   thì nghiêng về mùa vụ; chỉ web giảm thì đọc báo cáo của công cụ. Lead và cuộc gọi chỉ để **xếp ưu
   tiên** — một tuần quá ít đơn để gạt đi một lần tụt mạnh; tụt mạnh vẫn đánh giá sâu, so lead theo
   cửa sổ 4 tuần trở lên.
7. **Làm gì:** tụt nhẹ → không sửa (Google: "There's no need to take drastic action", tránh sửa nội
   dung đang chạy tốt); tụt vừa → theo dõi thêm 1–2 tuần, mở kết quả Google thật xem ai lên thay;
   tụt mạnh, hoặc mất hẳn hiển thị khi đang ở trang 1–2 (Kiểm tra URL trước) → đánh giá sâu **từng
   trang** theo bộ câu hỏi [Creating helpful, reliable, people-first
   content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content); tụt
   rộng trên nhiều cụm, kéo dài từ 2 tuần trở lên → tự đánh giá cả site theo cùng bộ câu hỏi; trang
   tụt trùng lúc site tự sửa → xem lại thay đổi của mình trước; truy vấn tên quán mất vị trí đầu →
   kiểm Thao tác thủ công, Vấn đề bảo mật, báo cáo Trang, Thống kê thu thập dữ liệu và Hồ sơ doanh
   nghiệp trước khi nghĩ tới core update. Sửa xong thì chờ: Google nói có khi vài ngày, có khi vài
   tháng, có khi phải tới đợt core update sau. Ghi kết luận vào bảng cuối mục này.

**Quy ước xếp loại của site** (neo vào hai ví dụ Google đưa ra: 2 → 4 là tụt nhẹ, 4 → 29 là tụt mạnh):

| Loại | Điều kiện | Làm gì |
|---|---|---|
| Ổn định | đổi < max(1 bậc; 15% vị trí tốt hơn của hai kỳ) — lên hay tụt cùng một ngưỡng | không |
| Tụt nhẹ | vẫn ở trang 1 (≤ 10) và tụt < 5 bậc — rộng hơn ví dụ 2 → 4 của Google | không sửa |
| Tụt vừa | còn lại: rơi xuống trang 2, hoặc tụt 5–9 bậc | theo dõi, xem SERP thật |
| Tụt mạnh | đang ở trang 1–2 (≤ 20) và tụt ≥ 10 bậc | đánh giá sâu từng trang |
| Mất hiển thị | kỳ trước đủ ngưỡng, kỳ sau không còn dòng nào | đang ở trang 1–2: Kiểm tra URL rồi đánh giá như tụt mạnh; trang 3 trở xuống: có thể hết mùa |
| Mới nổi | kỳ trước không có hoặc dưới ngưỡng, kỳ sau đủ ngưỡng | chưa so được vị trí |

Nhóm **truy vấn có tên quán** có ngưỡng riêng: người đã biết quán phải thấy site ở đầu trang, nên rổ
tên quán tụt từ 1 bậc hoặc xuống dưới vị trí 3 là "chú ý" (tìm tên quán xem ai đứng trên, kiểm Hồ sơ
doanh nghiệp), tụt vừa / mạnh là "cần làm" (bước 7).

Chỉ xếp loại theo vị trí khi **kỳ trước** có từ **10 hiển thị / 7 ngày**: một tuần của site chỉ khoảng
25 truy vấn đạt mức này (phủ ~2/3 hiển thị có truy vấn; đo trên export 16/6–15/9/2026), dưới mức đó vị
trí trung bình chủ yếu là nhiễu — truy vấn mùa Giáng sinh 2 hiển thị ở vị trí 3 rồi 30 hiển thị ở vị trí
20 không phải "tụt mạnh". Kỳ trước đủ ngưỡng mà kỳ sau chỉ còn vài hiển thị thì vẫn xếp loại (tụt sâu
thì hiển thị sập theo), ghi "ít số". "Mất hiển thị" của một nhóm chỉ tính dòng đủ ngưỡng: dòng 1–3 hiển
thị tuần nào cũng biến mất 30–80% vì nhiễu lấy mẫu (mô phỏng 200 lần "không đổi gì" trên export thật:
cách tính cũ báo "nhóm tụt rõ" 200/200 lần, cách mới 0–8/200). Vì vậy **kết luận theo cụm và nhóm**,
không theo một truy vấn lẻ. "Vị trí trên rổ cố định" = chỉ các truy vấn có ở cả hai kỳ, trọng số là
hiển thị kỳ trước — **ít** bị mùa vụ và truy vấn mới làm xê dịch hơn tổng, nhưng không giữ cơ cấu thiết
bị bên trong từng truy vấn (máy tính thường đứng thấp hơn điện thoại vài bậc; báo cáo ghi chú khi tỉ lệ
điện thoại đổi quá 5 điểm %). Bảng truy vấn không có truy vấn ẩn danh và dừng ở 1.000 dòng — trên hai
export 3 tháng thật nó chỉ chứa 54–55% tổng hiển thị — nên báo cáo ghi rổ cố định phủ bao nhiêu phần
**tổng** hiển thị và phần ẩn danh / ngoài bảng đổi thế nào, không kết luận "do nhu cầu" khi chỉ phần
ngoài rổ đổi.

**Dao động thường của site** (không có đợt nào vẫn lên xuống): đo 11-11-2026 trên export 16/6–15/9/2026,
4 cặp tuần liền nhau không dính đợt cập nhật hay ngày lễ — lượt nhấp **±17%**, lượt hiển thị **±12%**,
vị trí trung bình **±0,8 bậc** mỗi tuần (1 độ lệch chuẩn). Bốn cặp là **ước lượng thô**, và biên đổi
theo mùa: export 25/4–24/7 không đủ cặp sạch (dính 30/4, May core, June spam); tính cả tuần 30/4 thì ra
±61% / ±23% / ±0,6 — lễ làm biên phình to, nên công cụ bỏ tuần lễ, Tết. Tuần site sửa từ 50 trang trở
lên chỉ bỏ khi còn đủ 4 cặp (site sửa gần như tuần nào cũng có). Tuần sau đổi ít hơn biên thì chưa nói
lên gì; hơn 2 lần biên thì đáng xem, chưa biết do đâu. Có `--ca-ky` thì công cụ đo lại trên số mới; file
3 tháng quanh tháng 11-2026 dính cả September spam update lẫn core update nên không đủ tuần sạch — vì
vậy xuất 6 tháng.

**Năm giả thuyết cho November 2026 core update — ghi 11-11-2026, trước khi có số** (để lúc đọc báo cáo
không tự "tìm ra" nguyên nhân theo ý mình; công cụ tính sẵn số cho từng nhóm):

| | Nhóm trang | Vì sao đáng ngờ | Nếu nhóm này tụt mà nhóm khác giữ |
|---|---|---|---|
| H1 | Bài cẩm nang du lịch (bậc O), bản VI + EN | Chủ đề xa nghề của quán | Xem bài có dữ kiện riêng (quãng đường thật, giờ tàu, ảnh tự chụp) hay chỉ kể lại điều trang khác đã có |
| H2 | Bản dịch zh / ko / ja / ru / th | Nội dung dịch tự động theo quy mô; vào sitemap 21-10-2026, kỳ trước chúng mới 2–3 tuần tuổi (còn đang được lập chỉ mục) | Xem chất lượng bản dịch trước khi đụng bản gốc |
| H3 | Trang của quán (bậc C, P, R, A), bản VI + EN | Trang ra tiền | Tụt cùng truy vấn tên quán → nghi kỹ thuật, lập chỉ mục, Hồ sơ Google trước |
| H4 | Trang mùa vụ (Giáng sinh, Tết) | Hiển thị theo mùa | Đọc vị trí trên rổ cố định, đừng đọc hiển thị |
| H5 | Trang site tự sửa trong cửa sổ | Tác động của chính mình | Xem lại thay đổi trước khi đổ cho Google |

H1, H3 chỉ tính bản VI + EN nên không trùng H2; H4, H5 có thể trùng trang với H1, H2, H3 (bài mùa vụ,
bài vừa sửa và các bản dịch của chúng) — đọc cột Trang trước khi cộng dồn kết luận.

**Kỳ trước của đợt 11-2026 chưa sạch.** Trong 3 tuần trước 03-11 (13-10 → 02-11), site đổi nội dung
321/333 URL trong sitemap (lastmod 21-10: 233 URL — 230 trang bản dịch mới + 3 trang EN sửa; 26-10: 265
URL; 02-11: 111 URL; 2 URL còn lại là bài chọn quán đăng 03-11), và phần lớn hiển thị kỳ trước nằm ở
các trang này. Google cần vài ngày tới vài tuần để thu thập lại, nên
phần đổi của chúng không tách được khỏi tác động của đợt. Công cụ đọc lùi 3 tuần trước kỳ trước và tách
bảng *Trang theo lần site tự sửa*: nhóm **không đổi nội dung** — 10 URL: `/menu/`, `/menu-en/` (sửa lần
cuối 07-10), bài ăn sáng và bài sương mù VI/EN, 4 trang pháp lý — cùng nhóm truy vấn tên quán là tín
hiệu sạch nhất; giữ chúng không đổi suốt cửa sổ. URL không có trong sitemap (đã gộp / chuyển hướng /
canonical sang trang khác — stub vẫn còn file nhưng không chạy) nằm nhóm riêng: hiển thị tự giảm dần,
không phải đối chứng.

**Tiền lệ tháng 8-2026 — vì sao bước 2 bắt buộc.** August 2026 spam update chạy 18–21/08. Đúng cách
Google (tuần 11–17/08 so với 22–28/08): lượt nhấp −5% (trong dao động thường), lượt hiển thị −29% và
vị trí trung bình cả site 5,0 → 9,4 (cả hai vượt xa dao động thường). Nhưng cùng cửa sổ đó site có 29
commit sửa trang: 18-08 srcset + alt ảnh toàn site, 19-08 gộp 19 trang trùng từ khoá vào 5 trang chính
và dựng lại `/duong-di/`, 23-08 đổi font toàn site; lại đúng giữa mùa mưa (tháng 9 mưa nhiều nhất),
cuối hè. Lượt nhấp rơi mạnh nhất
từ đầu tháng 9 — hai tuần sau khi đợt đã xong, lúc site sửa heading 121 trang. Không còn cách nào biết
phần nào do Google, phần nào do mình, phần nào do mùa. Chạy lại:
`node tools/doi-chieu-cap-nhat.mjs --dot 2026-08-spam --ca-ky <export 16/6–15/9/2026>`.

**Các đợt đã đối chiếu:**

| Đợt | Chạy (giờ Pacific) | Kỳ trước | Kỳ sau | Export dùng | Kết luận |
|---|---|---|---|---|---|
| November 2026 core update | 10-11 → chưa xong | 03–09/11/2026 | xong + 1 → xong + 7 | hai file tuần + 6 tháng (xuất từ xong + 10) | chờ; kỳ trước chưa sạch (đoạn trên) — đọc nhóm không đổi nội dung và tên quán trước |
| August 2026 spam update | 18-08 → 21-08 | 11–17/08/2026 | 22–28/08/2026 | 16/6–15/9 (biên đo trên chính file, 4 cặp) | không tách được nguyên nhân (tiền lệ trên) |
| June 2026 spam update | 24-06 → 26-06 | 17–23/06/2026 | 27/06–03/07/2026 | 16/6–15/9 (biên đo trên chính file, 4 cặp) | nhấp, vị trí trong dao động thường; hiển thị −21% (hơn biên ±12%, chưa tới 2 lần); 1 commit sửa trang — không có gì phải làm |
| May 2026 core update | 21-05 → 02-06 | 14–20/05/2026 | 03–09/06/2026 | 25/4–24/7 (không đủ cặp sạch, dùng biên tham khảo) | vị trí TB cả site 7,0 → 5,1 (lên 1,9 bậc, hơn 2 lần biên ±0,8) nhưng 17 commit sửa trang trong cửa sổ — không tách được phần của Google |

Ba dòng cũ chạy bằng `--ca-ky` (export 3 tháng, chỉ có tổng theo ngày) nên chưa có rổ truy vấn cố định;
từ đợt 11-2026 xuất đủ hai file tuần.

## 14. Nếu kênh Google tự nhiên gãy — mất gì, bù bằng gì

Tỷ trọng lượt vào chưa nói được thiệt hại: phải biết lượt nào thành khách thật, kênh gãy vì đâu, và mua lại
tốn bao nhiêu. Với quán, "Google tự nhiên" là **hai tài sản, gãy vì hai lý do khác nhau**: trang web trên Google
Search (core update, sập, mất tên miền, bị hack) và Hồ sơ Google Maps (tạm ngưng, nhập trùng, mất ghim). Mốc đo
19-11-2026, trước khi November 2026 core update xong.

**Trang web** (GSC, Web, 16/6–15/9/2026): 1.365 lượt nhấp / 92 ngày ≈ **450/tháng**; 87% rơi vào trang chủ +
`/menu/`, bài viết và cẩm nang tối đa 13%. Trong 726 lượt nhấp còn hiện truy vấn (phần còn lại là truy vấn ẩn
danh): **tên quán 587 (81%)**, "xóm lèo" / "xóm lèo đà lạt" ~90 (12% — địa danh, phần lớn vẫn là người tìm
quán), **không tên quán 31 (4%; 27 là "quán nướng đà lạt view xe lửa")**, cẩm nang ~8. Kỳ 25/4–24/7: 1.238
lượt nhấp, tên quán 80%, không tên quán 4. Tách lại bằng nhóm *tên quán / không tên quán* của
`doi-chieu-cap-nhat.mjs` hoặc cột loại cụm của `ban-do-nhu-cau.mjs`.

**Nhu cầu tên quán** (Google Ads Keyword Planner, VN, tiếng Việt, 11/2025–10/2026): "tiệm nướng xóm lèo" TB
14.800 lượt/tháng (tháng 2: 27.100; 6–8: 22.200; 9: 8.100), "xóm lèo đà lạt" 12.100, "quán nướng xóm lèo" 1.600
— Search Console chỉ thấy ~1.400 lượt hiển thị/tháng cho "tiệm nướng xóm lèo". Tài khoản chưa chi tiêu nên số
Keyword Planner bị làm tròn theo dải, nhưng chênh 10–15 lần thì không do làm tròn: phần lớn người gõ tên quán xong
việc ở Maps / khung thông tin (gọi, chỉ đường) mà không thấy trang — **Maps mới là tài sản lớn**. GBP: 525 lượt bấm
"Trang web" trong 4–9/2026 (mục 11).

**Giá mua lại** (Keyword Planner cùng kỳ, CPC trung bình): không tên quán 3.000–4.500đ ("quán nướng đà lạt"
3.900đ / 2.900 lượt tìm mỗi tháng, "tiệm nướng đà lạt" 3.200đ / 1.600, "quán nhậu đà lạt" 4.200đ / 1.000; giá đầu
trang cao tới 9.500đ); tên quán 3.600–4.600đ.

| Kịch bản | Mất (lượt nhấp web/tháng, ở mức 30 / 50 / 80%) | Mua lại bằng Google Ads | Ghi chú |
|---|---|---|---|
| Core update hạ hạng | phần không tên quán (5–13% ≈ 23–59 lượt): 7–18 / 12–30 / 18–47 | < 450.000đ/tháng, kể cả ở giá đầu trang | mục 13 (giữ yên site, đối chiếu). Không phải rủi ro doanh thu; ngược lại là cơ hội chưa có: "quán nướng đà lạt" vị trí ~12, 0 lượt nhấp |
| Trang mất kết quả tên quán (sập, mất tên miền, bị hack, thao tác thủ công) | 135 / 225 / 360 | 0,5–0,6 / 0,8–1,0 / 1,3–1,7 triệu đ/tháng | đã có `giam-sat-uptime` (15 phút; tên miền ≤ 30 ngày, chứng chỉ < 20 ngày). Người tìm tên quán phần lớn vẫn gọi được qua Maps → thiệt thật nhỏ hơn số lượt nhấp |
| Hồ sơ Maps tạm ngưng / nhập trùng / mất ghim | chưa đo — cần GBP → Hiệu suất (gọi, chỉ đường, bấm web) | quảng cáo không mua lại được sao, ảnh, đánh giá | tiền lệ: listing cũ `goo.gl/maps/DhBm5…` đã thành ô trống, Wanderlog còn trỏ cid mở ra trống (CLAUDE.md mục 8) |

1,3–1,7 triệu đ/tháng ≈ tiền 1–2 bàn 4 người (250.000–300.000đ/người, CLAUDE.md mục 2) — **ước**, chưa có tỷ lệ
lượt nhấp → bàn tới thật. Rủi ro không đều theo tháng: tháng 2 (Tết) và 6–8 nhu cầu tên quán gấp 2–3 lần tháng
9–10, sự cố rơi vào mùa cao điểm đắt gấp chừng ấy.

**Đo lại** mỗi quý, hoặc từ D+10 sau mỗi đợt core update: GSC export 3 tháng (tên quán / không tên quán), Keyword
Planner cùng bộ từ, GBP → Hiệu suất, và **dashboard Marketing của hệ thống đặt bàn** (doanh thu, số bàn tới theo
`nguon`) — đó mới là "% doanh thu theo kênh"; % lượt nhấp ở trên chỉ là % lượt vào. Đọc dashboard nhớ: đơn gọi /
Zalo do nhân viên chọn nguồn; chọn "Zalo" (kênh liên lạc) thay vì nơi khách biết tới quán ("Google Maps",
"Tiktok") làm Maps trông nhỏ đi.
