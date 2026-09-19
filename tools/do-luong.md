# Kế hoạch đo lường & hợp đồng dữ liệu — xomleo.vn

Bản mô tả chính thức của những gì site gửi về Google Analytics 4: tên sự kiện, điều
kiện bắn, tham số và giá trị hợp lệ. Sửa code đo lường trong `js/main.js` thì sửa cả
file này; báo cáo GA4 và Custom Definitions bên phía Google đều dựa trên hợp đồng ở đây.

Cập nhật: 19-09-2026. Người chịu trách nhiệm: chủ site (GitHub `Truong02022002`). Lịch sử
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
| `generate_lead` | webhook Apps Script **trả lời xác nhận** đã nhận đơn đặt bàn | `form_id`, `lead_type`, `guests` (số), `occasion` | **Có — Key Event duy nhất** |

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
- **Số liệu chia cho hai property** chừng nào connected tag ở mục 2 còn đó.

## 7. Kiểm lại trước khi publish

    node tools/kiem-do-luong.mjs        # 24 phép thử, Chrome headless
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

- `fbclid` **không** có nghĩa là quảng cáo: Facebook gắn nó vào mọi link đi ra, kể cả bài
  đăng thường của Fanpage. Trước 19-09-2026 site ghi nó thành `Facebook Ads` trong sheet.
  Giờ ghi `Facebook`. Muốn tách quảng cáo thì gắn UTM cho link quảng cáo.
- `ttclid`, `gclid`/`gbraid`/`wbraid`, `msclkid` chỉ có trên click quảng cáo nên vẫn ghi `… Ads`.

**Quy ước UTM.** GA4 phân biệt hoa/thường (`Facebook` và `facebook` thành hai dòng), nên:
chữ thường, không dấu, nối bằng `_`. **Không bao giờ gắn UTM cho link nội bộ** (từ
xomleo.vn sang xomleo.vn): GA4 sẽ ghi đè nguồn thật của phiên (kiểm 19-09-2026: 0 link có
`utm_` trên 135 trang). Không đặt tên, số điện thoại hay email vào URL.

| Kênh | `utm_source` | `utm_medium` | `utm_campaign` |
|---|---|---|---|
| Nút "Trang web" trên Google Business Profile | `google` | `organic` | `gbp` |
| Bài đăng / link bio Fanpage | `facebook` | `social` | tên đợt, ví dụ `tet_2027` |
| Quảng cáo Facebook / Instagram | `facebook` / `instagram` | `paid_social` | tên chiến dịch |
| Zalo OA, tin nhắn Zalo | `zalo` | `social` | tên đợt |
| Link bio TikTok / Instagram | `tiktok` / `instagram` | `social` | `bio` |
| Mã QR in ở quán | `qr` | `offline` | chỗ đặt, ví dụ `ban_an`, `menu_giay` |

GBP hiện là kênh lớn nhất (525 lượt bấm "Trang web" trong 6 tháng 4–9/2026), nhưng
không gắn UTM thì GA4 xếp chung vào Google Search. Với `medium=organic`, GA4 vẫn xếp nó
vào nhóm Organic Search, chỉ tách được thêm theo `campaign=gbp`. Nguồn `qr`/`offline` thì
GA4 xếp vào nhóm *Unassigned*, nên lọc theo `source`. Mã QR đã in thì giữ nguyên, chỉ áp
dụng cho lần in sau.

**Đối soát hằng tháng** (5 phút, mục 279-281):

1. GA4: số `generate_lead` trong tháng. Sheet đặt bàn: số dòng `brand = xomleo` cùng kỳ,
   bỏ dòng thử/rác.
2. **Sheet nhiều hơn GA4 là bình thường** (trình chặn quảng cáo, phiên ngắn chưa kịp tải
   GA4, nhánh "không rõ" ở mục 6). **GA4 nhiều hơn sheet là bất thường** — webhook đang báo
   thành công mà không ghi được, kiểm ngay.
3. Số đơn trong sheet mà nhân viên gọi xác nhận được và khách tới thật — đó mới là lead đạt
   chuẩn. Click gọi/Zalo trong GA4 chỉ để so xu hướng, không cộng vào đây.

## 12. Nhật ký thay đổi

Commit cụ thể: `git log -- js/main.js tools/do-luong.md`.

| Ngày | Thay đổi |
|---|---|
| 16-09-2026 | Gắn 5 sự kiện đầu tiên (trước đó site chỉ có `page_view`). |
| 17-09-2026 | Viết hợp đồng dữ liệu này; CI `kiem-do-luong.yml` chạy sau mỗi push. |
| 19-09-2026 | `generate_lead` chỉ bắn khi webhook xác nhận; gửi hỏng thì báo lỗi thật cho khách; `fbclid` thôi ghi thành `Facebook Ads`; Key Event rút còn `generate_lead`; thêm giám sát hằng tuần trên site thật; ghi trạng thái các công cụ theo dõi khác và quy ước UTM. |
