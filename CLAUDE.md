# CLAUDE.md — Bộ quy tắc vận hành xomleo.vn

Đọc file này trước khi làm bất cứ việc gì trong repo. Nó gom các quy ước đã chốt với chủ site
từ tháng 7 đến tháng 11-2026; chi tiết từng mảng nằm ở các tài liệu liệt kê trong mục 7.
File này nằm trong repo nên **công khai trên xomleo.vn/CLAUDE.md** — không bao giờ ghi
token, mật khẩu, URL webhook hay dữ liệu khách vào đây.

## 1. Dự án là gì

- Website của **Tiệm Nướng & Chill Xóm Lèo** (quán nướng than tại bàn, Trại Mát, Đà Lạt).
  Site tĩnh HTML/CSS/JS, không framework, không build server; GitHub Pages sau Cloudflare.
- Repo `Truong02022002/chillxomleo`, hai nhánh:
  - `main` — deploy thẳng. **Mọi thứ commit lên main là công khai ngay**, kể cả file .md,
    .mjs, .json. Không commit bản nháp, không commit secret.
  - `noi-dung` — nhánh mồ côi, chỉ chứa `hang-doi/` (bài chờ đăng + bản lưu). Không merge
    vào main. Workflow `dang-bai-theo-lich.yml` kéo bài từ đây sang main đúng ngày.
- 7 thứ tiếng: VI (gốc) → EN (viết tay, thư mục `<slug>-en/`) → zh/ko/ja/ru/th (dựng tự động
  từ bản VI qua `tools/dich/`, thư mục `/zh/<slug>/`…). Đừng sửa tay trang dịch.
- `hang-doi/`, `tools/dich/viec/`, `tools/dich/ban-dich/`, `.claude/` nằm trong .gitignore.
- Máy làm việc: Windows, file CRLF (`core.autocrlf=true`), Node 22, không có Python thật,
  không có `gh`. Xem bẫy ở mục 5.

## 2. Dữ kiện đã chốt — nguồn sự thật duy nhất

Mọi bài, schema, bản dịch phải khớp bảng này. **Dữ kiện không có ở đây thì hỏi chủ site,
không suy đoán, không lấy số của quán khác.** Đổi một dòng ở đây là phải dò và sửa mọi
trang đang nhắc tới nó (VI, EN, 5 bản dịch, JSON-LD, bản lưu hang-doi).

| Mục | Giá trị đã chốt |
|---|---|
| Tên quán | VI **Tiệm Nướng & Chill Xóm Lèo**; EN **Xom Leo Grill & Chill**. Không rút gọn thành "quán nướng Xóm Lèo". "Xóm Lèo" đứng một mình là tên xóm. |
| Địa chỉ hiển thị | VI `113 Huỳnh Tấn Phát, Phường Xuân Trường - Đà Lạt, Lâm Đồng`; EN `113 Huynh Tan Phat, Xuan Truong Ward - Da Lat, Lam Dong`. Câu văn chỉ nhắc đường thì để nguyên, không nhét địa chỉ đầy đủ. |
| PostalAddress (JSON-LD) | Tách trường, giữ tiếng Việt có dấu cả trang EN: streetAddress `113 Huỳnh Tấn Phát, Phường Xuân Trường`, addressLocality `Đà Lạt`, addressRegion `Lâm Đồng`, postalCode `67000`. |
| Bản đồ | Google Maps `cid=11166661116585636255`, toạ độ 11.9543314, 108.4944158. Ghim Maps dẫn đúng chỗ; gọi để quán gửi định vị là lựa chọn thêm, không phải cảnh báo. |
| Liên hệ | Hotline + Zalo **076 452 7336** → `<a href="tel:0764527336">`; EN hiển thị `+84 76 452 7336`. Facebook `facebook.com/tiemnuongvachillxomleo`, TikTok `@tiemnuongchillxomleo`. |
| Giờ mở | **15:00–23:00 tất cả các ngày**, kể cả cuối tuần và lễ. Không bữa sáng, không bữa trưa. |
| Giá | Trung bình **250.000–300.000đ/người** cho bữa đầy đủ, ăn gọn 150.000–180.000đ. Giá in trên thực đơn **đã gồm VAT**; 68 món, 12.000–320.000đ; lẩu 300.000–320.000đ cho 4–6 người. **Không phụ thu cuối tuần, lễ.** Không combo / set menu theo đầu người. |
| Tết | Phụ thu **8%** từ mùng 2 đến mùng 10. Tết Đinh Mùi 2027: **nghỉ 23 tháng Chạp (T7 30/1) đến hết mùng 1 (T7 6/2)**, mở lại mùng 2 (CN 7/2) đúng 15:00–23:00. Lịch này nằm ở 5 nơi — xem mục 4. |
| Bếp, bàn | Nướng than tại bàn, **mỗi bàn đơn một bếp than rời**; ghép bàn thì bấy nhiêu bếp. Bàn gỗ dài kèm băng ghế. |
| Khu ngồi | Khu trong nhà + khu mái che ngoài trời, cùng nhìn xuống thung lũng nhà kính Trại Mát. Ngoài trời **lạnh nhanh từ khoảng 19:00**; có mền và trà nóng. |
| Đậu xe | Bãi trong khuôn viên **khoảng 15 ô tô**, xe máy miễn phí, lối vào đủ cho xe 16–29 chỗ quay đầu. |
| Đoàn | Tối đa **60 người**; từ 10 người gọi trước. **Có đặt cọc**, mức không cố định (theo số người và có đặt món trước hay không). Trang trí sinh nhật / liên hoan **miễn phí**, báo lúc đặt bàn. Hoá đơn VAT: viết "hỏi và cung cấp thông tin lúc đặt bàn", chủ site không trả lời thêm. |
| Tàu Trại Mát | Hai chuyến đêm rời Ga Đà Lạt **18:15 và 20:20**, ngang quán **18:40–19:00 và 20:45–21:10**, quay đầu rời Trại Mát 19:15 và 21:20. **Chỉ chạy khi đủ hành khách** — không hứa chắc. |
| Hoàng hôn | Mặt trời lặn sớm nhất ~17:20 (giữa tháng 11), muộn nhất ~18:15 (đầu tháng 7). Cuối tuần dãy ngoài trời thường kín từ 18:00. |
| Khoảng cách | Hồ Xuân Hương **7–8 km**, Chợ Đà Lạt **9 km**, "trung tâm khoảng 8 km" (đường xe, OSRM). 12–15 phút xe máy, 15–20 phút ô tô, Grab 60.000–80.000đ một chiều. **Không viết "5 km", không viết "gần"**. Điểm tham quan: Linh Phước 2, Than Thở 6, Robin/Fairytale/Thung lũng Tình yêu/Dinh Bảo Đại 10, Wonderland 12, Datanla 12, Trúc Lâm 13, Đường hầm 16, Tuyền Lâm/Prenn 17, LangBiang 18 km. |
| Quán chị em | **Trạm Dừng Chill**, 111 Huỳnh Tấn Phát, **cùng chủ**. Link `rel="noopener"`, không `nofollow`, không viết thành listicle tự khen. Giá TDC 95.000–300.000đ gồm VAT (khác Xóm Lèo). |
| Tác giả | Bút danh `Bếp trưởng Xóm Lèo` / `Xom Leo Head Chef`, `@id https://xomleo.vn/#bep-truong`. |
| Thời tiết Đà Lạt | Mùa mưa tháng 5–10 (tháng 9 nhiều mưa nhất), khô tháng 12–3, lạnh rõ tối tháng 10–1. Nguồn đã dẫn trong bài sương mù. |

## 3. Quy tắc nội dung

**Khung DLN (Decision Ladder) 5 bậc** — O Orient, C Choose, P Prove, R Rate, A Act — ghi ở
`<html data-dln>` và thành GA4 `content_group`. Mỗi trang có một bậc; mỗi bậc đều phải có link
sang bậc kế. Người tìm ở bậc nào thì trang đích phải ở bậc đó (`tools/vai-tro-trang.mjs` báo
lệch).

**Một ý định = một URL.** Mỗi trang thuộc ít nhất một cụm trong `tools/cum-chu-de.json`
(Entity → Intent → Persona → DLN → Page Role → URL → CTA → KPI). Mở URL mới chỉ khi có ít nhất
một dữ kiện chưa trang nào có; lợi thế trùng bài khác thì viết thành mục trong bài đó. Nhiều
trang cùng dẫn về quán mà chỉ đổi đối tượng là doorway. Danh sách slug đã bỏ / đã gộp ở
`hang-doi/ke-hoach-26-bai.json` — đừng đề xuất lại.

**Viết thật, cho đi trước:**
- Tiêu đề hỏi thì câu đầu trả lời thẳng (answer-first). Mỗi bài có "Tóm tắt nhanh" ở đầu.
- Không xếp hạng quán, không "top", không listicle đối thủ, không tự xếp quán mình vào danh sách.
- Nhắc Xóm Lèo trong bài cẩm nang thì **tự khai** là quán của chính chúng tôi; mục cuối bài O
  là "Gợi ý thêm từ quán…" với quãng đường thật, không phải "ăn gì gần X".
- Số liệu phải có nguồn (bài đã dẫn nguồn hoặc bảng mục 2). Ngày "Cập nhật"/`dateModified`
  phải tự sửa tay khi đổi nội dung — không tool nào tự bump.
- FAQ hiển thị và FAQPage JSON-LD **trùng từng chữ**; cấu trúc `@id`/`mainEntityOfPage` đã
  chốt, `tools/kiem-schema.mjs` kiểm.
- Sao đánh giá: chỉ phiếu thật từ widget trên bài, ngưỡng 5 phiếu mới hiện; **không seed, không
  chấm hộ, không tự khai aggregateRating** cho quán. Sao trang chủ lấy từ Maps là quyết định
  của chủ site, đừng đề xuất mở rộng.
- Title ≤ 60 ký tự, không trùng ≥ 5 chữ đầu với trang nào (script đăng bài chặn). 11 title dài
  hơn là cố ý. Mô tả meta trang EN dùng `&` thô, không `&amp;`.
- Cố ý KHÔNG làm: llms.txt, WebMCP, Content-Signal, trang cảm ơn sau đặt bàn, Pixel/Clarity,
  GTM, listicle đối thủ, combo/set menu, "seed" đánh giá.

**Ảnh:** chỉ ảnh thật của quán (kho trên máy: `E:\tiemnuongchillxomleo\project\unused_images\img`,
Drive bộ KOL). Ảnh AI (`E:\mon-an`, `E:\anh-mon-moi`, PNG 1086×1448 trong Downloads) không
dùng. Tên file tả nội dung ảnh, chữ-thường-gạch-ngang, không tên theo công dụng (`og-`,
`hero-`) hay tiêu đề mục. WebP kèm biến thể `-640w/-960w/-1280w` và ba bản cắt `-16x9/-4x3/-1x1`
cho ảnh bìa (`tools/anh-ti-le.mjs`). Alt tả đúng thứ trong ảnh, không trùng alt. Không cắt ảnh
cho web (bộ TripAdvisor là ngoại lệ). Ảnh đổi tên từ 15-09 giữ tên cũ tới 2026-12-15
(`tools/anh-doi-ten.json`).

**Đa ngôn ngữ:** tên quán, tên món, địa danh giữ tiếng Việt như kho; văn phong từng tiếng
theo `tools/dich/HUONG-DAN.md`. Đổi một chữ ở bản VI là đổi id đoạn → phải dịch lại đoạn đó.

## 4. Quy trình kỹ thuật

**Sau khi sửa bất kỳ trang/JS/CSS nào, chạy đúng thứ tự:**

```
node tools/build-js.js --write        # nếu sửa js/
node tools/mua-le.mjs --write         # nếu sửa js/mua-le.js hoặc css/mua-le.css
node tools/build-css.js --write       # nếu sửa css/ (CSS nhúng vào từng trang)
node tools/cache-bust.js --write
node tools/csp-hash.mjs --write       # lỗi errno -4094 thì chạy lại
node tools/kiem-sitemap.mjs --sua     # chạy ĐÚNG NGÀY push (lastmod); chậm >5 phút, chạy nền
```

**Kiểm trước khi báo xong** (CI chạy lại 9 workflow trong `.github/workflows/`):
`kiem-schema.mjs` (0/0), `audit-links.mjs` (TỔNG 0), `kiem-do-luong.mjs` (đủ phép thử),
`vai-tro-trang.mjs` (0 ở 5 mục), `tools/dich/dung.mjs --kiem`, `build-css.js` (lệch 12 = nháp
hang-doi, bình thường), `mua-le.mjs`, `cache-bust.js`. Soi trình duyệt bằng server tĩnh +
playwright-cli (từ cwd scratchpad) ở 1280px và 390px: console 0 lỗi, bảng không tràn.

**Bài mới:**
1. Viết `hang-doi/noi-dung/<slug>.json` (mẫu: các file cùng thư mục; có `bac`, `anhBia`,
   `vi`/`en` với title, moTa, h1, tomTat, muc[{id,h2,html,anh?}], faq[]). Link `tel:`,
   `/#booking`, `/menu/` trong thân bài nếu cụm khai CTA đó.
2. `node tools/tao-bai-nhap.mjs hang-doi/noi-dung/<slug>.json` → bản nháp VI + EN.
3. Thêm mục vào `hang-doi/lich-dang.json` (bac, nhom, tieuDe ≤60, tomTat, anh có `-640w`,
   `noiTu` = 2–4 slug **có khối `<aside aria-label="Bài viết liên quan">` ở cả VI lẫn EN** —
   các bài sinh bằng tao-bai-nhap không có khối này). Ghi vào `ke-hoach-26-bai.json`.
4. `node tools/dang-bai-theo-lich.mjs --thu --ngay YYYY-MM-DD` rồi bỏ `--thu` (hoặc để CI
   đăng 08:00 giờ VN từ nhánh noi-dung). Script không commit. **Đăng tay thì phải chạy nốt
   đúng các bước của `dang-bai-theo-lich.yml`:** `chuan-hoa-giao-dien.mjs --write` →
   `sao-bai.mjs --write` (khối sao + schema cho trang mới; thiếu là CI "Kiem structured data"
   đỏ) → `build-css --write` → `cache-bust --write` → `csp-hash --write` → `kiem-schema` →
   `kiem-sitemap --sua`.
5. `anh-ti-le.mjs --sharp <thư mục có sharp> --ld` → chuỗi ở trên → dịch ít nhất 4 đoạn thẻ
   blog (nhãn ngày, tiêu đề, tóm tắt, alt) để 5 trang `/xx/blog/` có thẻ; thân bài dịch khi
   chủ site yêu cầu.
6. Thêm cụm cho bài vào `cum-chu-de.json` (script đăng bài cảnh báo nếu thiếu).

**Dịch (tools/dich):** `tach.mjs` → `chia-viec.mjs` (**xoá cả `viec/`** — sao lưu trước, đổi
số gói mới, chép gói cũ lại; hoặc viết tay `viec/viec-NN.json` từ `nguon.json`) → dịch vào
`ban-dich/<ma>/viec-NN.json` → `kiem-ban-dich.mjs <ma> viec-NN` → `gop.mjs` → `dung.mjs` →
`csp-hash.mjs --write` → `kiem-sitemap.mjs --sua`. Trang thiếu đoạn thì dung bỏ qua, không dựng.

**Lịch Tết nằm ở 5 nơi:** bài `quan-an-da-lat-mo-cua-tet` VI/EN + 5 bản dịch; JSON-LD
OpeningHoursSpecification ở `index.html` + `en/index.html`; `js/mua-le.js` `LICH_TET` + nhãn
trong `js/ngon-ngu.js`; câu lịch Tết trong 2 bài quán nướng; thẻ `/blog/` + bản lưu `hang-doi/`.

**Form đặt bàn → Apps Script → Sheet → Telegram/Zalo.** URL webhook nằm trong `js/main.js`
(`_0x`); đổi thì `build-js` + `cache-bust`. Code Apps Script chỉ ở Google, chủ phải triển khai
lại sau khi sửa. URL Apps Script của sao đánh giá chỉ ở `tools/sao/diem.json`.

**Sau khi push:** chờ HTML live đổi sang hash mới **rồi mới** gọi URL asset — gọi sớm là
Cloudflare giữ bản cũ dưới khoá mới 30 ngày. Kiểm CI qua `curl api.github.com/repos/…/actions/runs`.

## 5. Môi trường Windows — bẫy đã vấp

- File CRLF: **không `sed -i`** (xoá CR, cả file thành diff). Thay chuỗi bằng Node, kiểm
  `git diff --numstat` thấy toàn 1/1.
- Hook `.claude/hooks/scout-block` chặn MỌI lệnh chứa tên thư mục npm hay `.git/` (kể cả trong
  heredoc, kể cả `find -not -path`) → ghép chuỗi `['node','modules'].join('_')`, đừng gõ thẳng.
- Bash tool nuốt backslash trong heredoc và `node -e` (regex `\b`, `\s` hỏng) → file có regex
  thì dùng Write/Edit. Git Bash đổi `/duong-dan/` thành đường dẫn Windows → `MSYS_NO_PATHCONV=1`
  hoặc mã hoá `%2F` trong `--data`.
- `rtk` bọc `grep`/`curl`: grep nhiều mẫu hay grep -q trên file lớn không chạy → lọc bằng node;
  curl dùng `C:/Windows/System32/curl.exe` khi cần.
- `git add -A` vài trăm file → "Out of memory" → add theo lô thư mục; `-c core.safecrlf=false`
  để khỏi ngập cảnh báo. `git worktree add` lỗi tên dài → `git -c core.longpaths=true`.
- `csp-hash --write` thỉnh thoảng `errno -4094 UNKNOWN` ở file vừa ghi hàng loạt → chạy lại.
- Khối `content-visibility:auto` (`.bang-gio`, phần dưới trang) chụp/đọc innerText ra trống →
  `scrollIntoView` trước, dùng `textContent`. `playwright-cli screenshot` sau cuộn vẫn chụp đầu
  trang → chụp theo selector (`"article table >> nth=0"`); chạy playwright từ cwd scratchpad để
  `.playwright-cli/` không rơi vào repo.
- sharp không có trong repo: `npm i --no-save sharp@0.33.5` trong thư mục tạm rồi `--sharp <dir>`.
- Server thử: `node server.mjs <gốc> 8765` ở scratchpad; `path.resolve` gốc trước khi so
  `startsWith`; đừng spawnSync Chrome trong cùng tiến trình.
- Foreground `sleep` bị chặn → việc lâu chạy `run_in_background`. `kiem-sitemap` chế độ kiểm
  chạy chung chuỗi dễ quá 5 phút.
- `python`/`python3` chỉ là stub Store; plugin cần Python thì chưa dùng được. `gh` không có.
- Nominatim bị chặn → geocode bằng photon.komoot.io, route bằng router.project-osrm.org, soát
  tên trả về (Photon hay trả nhầm địa danh cùng tên).

## 6. Cách chủ site giao việc — và cách hiểu

- **"push"** = commit + push `main` với thông điệp tiếng Việt không dấu theo kiểu các commit cũ;
  nếu `hang-doi/` có đổi thì chép sang nhánh `noi-dung` (worktree tạm) và push luôn. Sau đó
  xem CI xanh và kiểm live. **Không commit/push khi chưa được bảo.**
- **Dán một bài viết / ảnh công cụ / quảng cáo khoá học mà không kèm lời dặn** = "soi site theo
  tiêu chí trong đó rồi vá". Trả lời theo ba nhóm: đã đạt sẵn (đừng rà lại), đã sửa (chưa
  commit), cố ý không làm (kèm lý do). Việc cần chủ quyết thì liệt kê, không tự làm.
- **"fix đi" / "làm đi" / "kiểm tra tiếp"** = làm ngay việc vừa nêu hoặc việc đang treo gần
  nhất trong cùng mạch; "bạn tự quyết đi" = chọn phương án tốt nhất rồi làm.
- **Câu hỏi** ("hiểu thế nào", "có nên…") = trả lời bằng ví dụ của chính site, không sửa gì.
- **Thiếu dữ kiện** (giờ, giá, chính sách, có món/chương trình không) → không bịa, không lấy số
  quán khác; ghi câu hỏi vào `ke-hoach-26-bai.json` mục `_canChuSiteXacNhan` kiểu
  `{hoi, viSao, traLoi, muc}` và báo chủ. Bài chỉ viết sau khi có trả lời.
- Khi giao việc viết bài, thông tin đủ để bắt đầu: slug, bậc DLN, người tìm là ai và đang
  cần biết gì (cụm trong `cum-chu-de.json`), dữ kiện chưa trang nào có, ngày đăng mong muốn,
  ảnh có sẵn hay chưa. Thiếu mục nào thì tôi đề xuất rồi chủ chốt.
- Ghi nhớ phiên làm việc (traps, hash commit, việc treo) nằm ngoài repo ở thư mục memory của
  Claude Code trên máy chủ site; file này là bản rút gọn bền.

## 7. Nguồn — đọc khi đụng tới mảng đó

| Mảng | Tài liệu |
|---|---|
| Đo lường GA4, sự kiện, Path exploration, chống trùng đơn | `tools/do-luong.md` (12 mục, có nhật ký) |
| Hàng đợi bài, điều kiện đăng, `lich-dang.json` | `hang-doi/README.md` |
| Kế hoạch chủ đề, bậc DLN từng bài, câu đã hỏi chủ, slug đã bỏ/gộp | `hang-doi/ke-hoach-26-bai.json` |
| Cụm từ khoá → trang → CTA → KPI, ngưỡng bản đồ nhu cầu | `tools/cum-chu-de.json` (`_ghi_chu` ở đầu) |
| Bản đồ nhu cầu từ export GSC | `tools/ban-do-nhu-cau.mjs` (báo cáo ghi ngoài repo) |
| Đa ngôn ngữ: kiến trúc, cài đặt, quy trình | `tools/dich/README.md`, `tools/dich/HUONG-DAN.md` |
| Sao đánh giá bài viết, Apps Script + Sheet | `tools/sao/HUONG-DAN.md`, `tools/sao-bai.mjs` |
| Giám sát uptime, Telegram | `tools/giam-sat-uptime.md` |
| Bản đồ tên ảnh cũ → mới | `tools/anh-doi-ten.json` |
| Khung bài mới (nav, footer, JSON-LD) | `tools/tao-bai-nhap.mjs` (bài khung `quan-nuong-da-lat-view-xe-lua`) |
| Mùa lễ Noel/Tết (tự bật theo ngày) | `js/mua-le.js`, `css/mua-le.css`, `tools/mua-le.mjs` |

## 8. Việc cố ý để nguyên hoặc đang chờ chủ site

- Cloudflare: TLS ≥ 1.2, SSL strict, HSTS, redirect `http://www` một bước — việc của chủ.
- GA4 admin (Key Event, Custom Definitions `rating`/`occasion`/`guests`), GSC export mới, GBP
  giờ nghỉ Tết, TripAdvisor listing, MST/giấy phép ở chân trang — việc của chủ.
- Bài chưa có 5 bản dịch: `da-lat-thang-12-giang-sinh`, `chon-quan-nuong-da-lat` (thẻ blog đã dịch).
- Các bài sinh bằng `tao-bai-nhap` chưa có khối "Bài viết liên quan" → chưa khai được `noiTu` từ chúng.
