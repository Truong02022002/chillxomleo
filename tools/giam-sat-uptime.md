# Giám sát uptime — xomleo.vn

Dựng 20-10-2026, chép từ bản của tramdungchill.vn (19-10-2026) và **dùng chung bot Telegram
giám sát** với bên đó. Chạy bằng GitHub Actions, không cần tài khoản dịch vụ nào:
`.github/workflows/giam-sat-uptime.yml` + `tools/giam-sat-uptime.mjs`, ~15 phút/lần.

## Vì sao cần
Trước đây chỉ có `giam-sat-do-luong.yml` chạy mỗi tuần (lịch 11:00 thứ Hai mà thực tế chạy trễ
5–7 tiếng) — web sập hay webhook đặt bàn bị gỡ triển khai có thể nằm đó cả tuần không ai hay.
Googlebot gặp 5xx / quá thời gian, nhất là ở robots.txt, là giảm nhịp crawl. Lịch sử Googlebot
gặp lỗi chỉ xem được ở Search Console → Cài đặt → Thống kê thu thập dữ liệu → Trạng thái máy chủ.

## 6 mục được kiểm
| # | Tên | Địa chỉ | Đạt khi |
|---|---|---|---|
| 1 | Trang chủ | `https://xomleo.vn/` | 200 + có `id="zaloBookingForm"` |
| 2 | Thực đơn | `https://xomleo.vn/menu/` | 200 + có `id="menu-lat-trang"` |
| 3 | Bài blog | `https://xomleo.vn/quan-nuong-da-lat-view-xe-lua/` | 200 + có `"@type": "Article"` |
| 4 | robots.txt | `https://xomleo.vn/robots.txt` | 200 + có dòng `Sitemap:` |
| 5 | sitemap.xml | `https://xomleo.vn/sitemap.xml` | 200 + có `<urlset` |
| 6 | Form đặt bàn | webhook Apps Script (hằng `_0x` trong `js/main.js`) | 200 + có `"status":"ok"` |

- Dùng từ khoá chứ không chỉ mã 200: trang đỗ tên miền khi hết hạn hay bản build hỏng vẫn có thể
  trả 200. Đã thử 20-10-2026: `404.html` không chứa từ khoá nào ở trên. Đổi id/khuôn trang thì sửa
  từ khoá trong `danhSachMuc()`.
- Mục 6 chỉ gọi GET (`doGet`) — không ghi Sheet, không báo nhóm. Chứng minh bản triển khai còn sống
  + còn quyền "Bất kỳ ai", **không** chứng minh tin đặt bàn tới được Telegram/Zalo. Đổi bản triển
  khai (sửa `_0x`) thì máy kiểm tự theo.
- Không kiểm VPS báo Zalo `14.225.224.28:3456`: máy giám sát bên tramdungchill.vn đã kiểm, và báo
  về cùng một chỗ.

## Cách báo
- Mỗi mục hỏng **3 lần liền, cách 20 giây** mới tính. Mọi mục đỏ mà google.com cũng không gọi được
  → máy kiểm mất mạng, bỏ qua lượt đó.
- Hỏng → mở issue `[giam-sat] Sự cố: …` gắn `@Truong02022002` (GitHub gửi email) rồi gửi Telegram
  kèm link issue. Vẫn hỏng thì im lặng; danh sách mục hỏng đổi thì 1 tin 🟠; lên lại thì issue tự
  đóng + 1 tin ✅ kèm số phút sự cố.
- Tin mở đầu bằng **"Web Xóm Lèo …"** — cùng bot, cùng người nhận với tin của Trạm Dừng Chill nên
  nhìn chữ đầu là biết quán nào.
- Người nhận: `NGUOI_NHAN` trong script (`6022990090`, tài khoản đã bấm Start với bot 19-10-2026),
  hoặc secret `TELEGRAM_CHAT_ID` (nhiều ID ngăn bằng dấu phẩy). Thêm người thì người đó bấm Start
  với bot trước, không thì Telegram trả 400.
- Telegram gửi hỏng (chưa cài secret, sai mã bot…) → ghi bình luận vào issue; email vẫn tới.
- Nhắc chứng chỉ HTTPS khi còn < 20 ngày (Cloudflare tự gia hạn từ ~30 ngày). Nhắc tên miền khi
  còn ≤ 30 ngày: hạn ghi tay ở `HAN_TEN_MIEN` = **15-10-2028** (tra iNET 15-10-2026) → gia hạn xong
  thì sửa ngày đó rồi đẩy lên, issue nhắc tự đóng.
- Chạy thử trên máy: `node tools/giam-sat-uptime.mjs --thu` (chỉ in, không đụng GitHub/Telegram).
- ⚠️ Giới hạn: chạy trên chính GitHub — GitHub sập toàn bộ thì không báo được; lịch có lúc trễ.

## Cài Telegram — làm 1 lần (~3 phút)
Bot đã có sẵn (bot giám sát tạo cho tramdungchill.vn), chỉ cần đưa **cùng mã bot** sang repo này.
GitHub không cho đọc lại secret đã lưu, nên phải lấy mã từ BotFather:
1. Telegram (tài khoản đã tạo bot) → **@BotFather** → `/mybots` → chọn bot giám sát → **API Token**
   → chép mã dạng `123456789:AA…` (**chép-dán, đừng gõ lại**).
2. GitHub, tài khoản `Truong02022002` → repo **chillxomleo** → **Settings → Secrets and variables →
   Actions → New repository secret** → Name `TELEGRAM_BOT_TOKEN` → dán mã → **Add secret**.
3. Thử: tab **Actions** → **Giam sat uptime** → **Run workflow**. ~1–2 phút sau Telegram nhận tin
   `🧪 Thử máy giám sát web Xóm Lèo`. Lượt đỏ thì mở ra xem dòng `Tin thử: …` chỉ lỗi gì.

⚠️ Đừng bấm **Revoke** mã trong BotFather: mã cũ chết là máy giám sát của **cả hai** web mất tin,
phải dán mã mới vào secret của cả hai repo.

## Khi nhận báo động
1. Mở thử bằng 4G trên điện thoại — sập thật hay chỉ máy kiểm thấy.
2. Mục 1–5 đỏ: xem githubstatus.com (mục Pages) và cloudflarestatus.com. Vừa đổi gì trên Cloudflare
   thì quay lại bước trước. Lỗi ghi "Cloudflare đang chặn máy kiểm" thì web có thể vẫn chạy — thêm
   luật cho phép user-agent `xomleo-giam-sat-uptime` trong Cloudflare.
3. Mục 6 đỏ: Apps Script → **Triển khai** → bản triển khai mà `_0x` đang trỏ (20-10-2026:
   `AKfycbwkak…`) còn quyền "Bất kỳ ai" không. Sửa code Apps Script thì phải triển khai lại.
