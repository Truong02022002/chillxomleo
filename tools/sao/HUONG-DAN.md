# Sao đánh giá bài viết xomleo.vn

Cuối mỗi trang (bài cẩm nang, menu, giới thiệu, đường đi, blog, chính sách — **trừ trang chủ**) có 5 ngôi
sao để bạn đọc chấm "Bài viết này / Trang này có ích cho bạn không?". Khi một trang có **từ 5 phiếu thật**
trở lên, trang hiện "Điểm bạn đọc: 4,7/5 · Lượt chấm: 12" và khai dữ liệu có cấu trúc để Google có thể hiện
sao vàng dưới kết quả tìm kiếm, giống các trang dịch vụ SEO.

Trang chủ không có nút chấm vì đã khai sao Google Maps (4,8 · 1.978 đánh giá); thêm điểm bạn đọc thì một
trang có hai điểm khác nhau.

```
bạn đọc bấm sao  -->  Apps Script (tài khoản Google của quán)  -->  Google Sheet "Sao bài viết xomleo.vn"
                                                                          |
mỗi sáng 9:00, GitHub Actions kéo tổng  <---------------------------------+
  --> ghi điểm + schema vào các bài đủ 5 phiếu  --> web cập nhật
```

Mọi thứ tiếng của một bài (Việt, Anh, 中文, 한국어, 日本語, Русский, ไทย) dùng **chung một tổng**.
Bấm sao xong, điểm trên trang chưa đổi ngay: điểm mới lên trang vào 9:00 sáng hôm sau.

Cài một lần, khoảng 10 phút, làm trên máy tính. Trước khi cài, nút sao **không hiện** ở bài nào.

## 1. Tạo dự án Apps Script và dán mã

1. Đăng nhập tài khoản Google của quán, mở https://script.google.com, bấm **Dự án mới**. Đặt tên
   `Sao bài viết xomleo.vn`.
2. Xoá hết nội dung có sẵn trong `Code.gs`.
3. Mở https://raw.githubusercontent.com/Truong02022002/chillxomleo/main/tools/sao/Code.gs, chọn hết, sao
   chép, dán vào `Code.gs`. Bấm biểu tượng lưu (Ctrl+S).

## 2. Chạy cài đặt

1. Ở thanh trên, chọn hàm **caiDat**, bấm **Chạy**.
2. Lần đầu Google hỏi cấp quyền: bấm **Xem xét quyền**, chọn tài khoản; nếu hiện "Google chưa xác minh
   ứng dụng này" thì bấm **Nâng cao**, rồi **Chuyển tới Sao bài viết xomleo.vn**, rồi **Cho phép**.
3. **Nhật ký thực thi** phải có hai dòng:
   - `Đã tạo Sheet: https://docs.google.com/spreadsheets/…` (Sheet chứa phiếu, nằm trong Google Drive của quán);
   - `Tổng hiện tại: {"phienBan":…,"trang":{}}`

## 3. Triển khai thành ứng dụng web

1. Bấm **Triển khai** (góc trên phải), chọn **Tùy chọn triển khai mới**.
2. Bấm bánh răng cạnh "Chọn loại", chọn **Ứng dụng web**.
3. Điền:
   - Mô tả: `Sao bài viết xomleo.vn`
   - Thực thi dưới dạng: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**

   Chọn "Bất kỳ ai" vì trình duyệt của bạn đọc gửi phiếu mà không đăng nhập Google.
4. Bấm **Triển khai**, sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`).

## 4. Gắn URL vào web

1. Mở https://github.com/Truong02022002/chillxomleo/edit/main/tools/sao/diem.json
2. Dán URL ở bước 3 vào giữa hai dấu nháy của dòng `"nguon": ""`, ví dụ:
   `"nguon": "https://script.google.com/macros/s/AKfy…/exec",`
3. Bấm **Commit changes**.

GitHub tự chạy workflow **Sao danh gia bai viet** (tab Actions): ghi URL vào cả 322 trang rồi đẩy lên
web. Vài phút sau, mở một trang bất kỳ (trừ trang chủ), kéo xuống cuối là thấy 5 ngôi sao.

Nếu workflow báo đỏ ở bước "Keo phieu": URL sai hoặc bước 3 chưa chọn "Bất kỳ ai". Sửa lại `diem.json`.

(Hoặc gửi URL cho người làm web để gắn giúp.)

## Về sau

- **Xem phiếu:** mở Sheet `Sao bài viết xomleo.vn` trong Google Drive. Mỗi dòng là một lần bấm: thời gian,
  bài (đường dẫn bản Việt), số sao, mã máy ngẫu nhiên. Cùng một máy chấm lại một bài thì chỉ tính lần sau
  cùng.
- **Phiếu rác** (một bài bỗng nhận hàng loạt phiếu trong vài phút): xoá các dòng đó trong Sheet. Sáng hôm
  sau tổng tự tính lại. Script đã giới hạn 10 phiếu mỗi bài mỗi giờ và 60 phiếu mỗi giờ cho cả web.
- **Đừng tự chấm hay nhờ người quen chấm hàng loạt.** Sao trên Google phải là phiếu thật của bạn đọc;
  Google coi điểm tự tạo là đánh giá giả và có thể phạt cả web (mất mọi kết quả nổi bật, không chỉ sao).
- **Cập nhật mã** (khi `Code.gs` trong repo đổi): dán lại mã, lưu; vào **Triển khai → Quản lý các lần
  triển khai**, bấm ✎ ở lần đang dùng, Phiên bản chọn **Phiên bản mới**, bấm **Triển khai**. Làm đúng cách
  này thì URL giữ nguyên. Tạo "triển khai mới" thì URL đổi, phải sửa lại `diem.json` (bước 4).

## Google có hiện sao không?

Không chắc chắn. Google không hỗ trợ sao cho bài viết (Article), nên schema khai bài là `CreativeWorkSeries`,
giống cách các trang dịch vụ SEO đang làm và giống sao trang chủ của quán. Đây là gắn loại cho vừa, không
phải đúng nghĩa: Google có thể không hiện sao, hoặc trong trường hợp xấu gửi cảnh báo "structured data" trong
Search Console. Nếu thấy cảnh báo đó, báo người làm web gỡ (trong `tools/sao-bai.mjs`, đặt `NGUONG = Infinity`
rồi chạy `--write`: gỡ hết schema sao, vẫn giữ nút bấm).
