# Hàng đợi bài đăng

Nhánh `noi-dung` **không được deploy**. Bài nằm ở đây thì Google không thấy, không
index, không lọt vào sitemap. Đến ngày đăng, workflow
`.github/workflows/dang-bai-theo-lich.yml` trên nhánh `main` tự kéo bài sang và
nối vào site.

Đây là nhánh mồ côi (orphan) — nó chỉ chứa thư mục `hang-doi/`, không chứa bản sao
của site. Đừng merge nhánh này vào `main`.

## Thêm một bài

```
hang-doi/
  lich-dang.json
  <slug>/index.html        ← bài tiếng Việt, hoàn chỉnh
  <slug>-en/index.html     ← bài tiếng Anh, hoàn chỉnh
```

Rồi thêm một mục vào `lich-dang.json`:

```json
{
  "slug": "quan-nuong-da-lat-cho-nhom-dong",
  "ngayDang": "2026-09-12",
  "danhMuc": "Tin Tức",
  "danhMucEn": "News",
  "tieuDe": "Tiêu đề tiếng Việt (≤ 60 ký tự)",
  "tieuDeEn": "English title (≤ 60 characters)",
  "tomTat": "Tóm tắt hiện trên thẻ ở trang /blog/, 2-3 câu.",
  "tomTatEn": "Excerpt shown on the card at /blog-en/.",
  "anh": "uploads/blogs/ten-anh.webp",
  "anhAlt": "Mô tả ảnh bằng tiếng Việt",
  "anhAltEn": "Image description in English",
  "uuTien": "0.6"
}
```

`ngayDang` dùng **giờ Việt Nam**. Bài đăng lúc 08:00 sáng ngày đó.

## Điều kiện bắt buộc

Script kiểm hết trước khi ghi, sai một điểm là dừng, không đăng nửa vời:

- `slug` chỉ chữ thường / số / gạch ngang, **không** kết thúc bằng `-en`
- Có đủ cả `<slug>/index.html` và `<slug>-en/index.html`
- Mỗi bài đúng **1 thẻ `<h1>`**
- `canonical` trỏ về chính nó: `https://xomleo.vn/<slug>/` và `.../<slug>-en/`
- Có đủ `hreflang` `vi` và `en` trỏ đúng cặp
- Ảnh `anh` phải tồn tại **và** có sẵn biến thể `-640w.webp` (thẻ card cần bản 640w)
- Tiêu đề không được trùng bài nào đang có trên site

## Chạy thử trước

Trên nhánh `main`, sau khi đã copy `hang-doi/` về:

```bash
node tools/dang-bai-theo-lich.mjs --thu                  # chỉ báo, không ghi gì
node tools/dang-bai-theo-lich.mjs --ngay 2026-09-12 --thu # giả lập ngày tương lai
```

Hoặc vào tab Actions trên GitHub, chạy tay workflow "Dang bai theo lich" và điền
ô `ngay` để thử một ngày cụ thể.

## Đăng xong thì sao

Script nối bài vào 4 chỗ: thư mục bài VI + EN, thẻ card ở `/blog/` và `/blog-en/`,
hai khối `<url>` trong `sitemap.xml` với `lastmod` đúng ngày đăng. Xong nó chạy
`tools/audit-links.mjs`; nếu audit báo bất kỳ lỗi nào thì **không commit**.

Bài đã đăng vẫn nằm lại trong `hang-doi/` như một bản lưu. Script nhận biết bài đã
đăng bằng cách xem `<slug>/index.html` đã có trên `main` hay chưa, nên chạy lại bao
nhiêu lần cũng không tạo bản trùng.
