---
name: seo-vn
description: SEO + GEO (Generative Engine Optimization) cho website tiếng Việt — bao gồm audit, content optimization, schema markup, AI search visibility (ChatGPT/Perplexity/Google AI Overviews), Google algorithm 2026, link building, local SEO. Dùng khi user hỏi về xếp hạng Google, tăng traffic, viết content chuẩn SEO, tối ưu cho AI search, schema, Core Web Vitals, hoặc cập nhật thuật toán mới.
---

# SEO + GEO 2026 — Skill chính

Skill này gói gọn cẩm nang SEO + GEO 2026 và tin update 30 ngày gần nhất, kèm workflow cụ thể cho từng tình huống.

## Khi nào kích hoạt

- User hỏi: "làm sao SEO trang này?", "viết content chuẩn SEO", "tăng traffic", "lên top Google"
- User hỏi: "GEO là gì?", "tối ưu cho ChatGPT/Perplexity/AI Overviews"
- User hỏi: "schema markup", "rich results", "Core Web Vitals"
- User hỏi: "Google update mới nhất", "thuật toán 2026"
- User dán URL website + nhờ phân tích/audit SEO
- User dán content + nhờ tối ưu

## Knowledge base (lazy-load — chỉ Read khi cần)

Hai file references trong cùng skill folder:

1. **`references/cam-nang.md`** (~26KB) — Cẩm nang nền tảng:
   - On-page SEO (Brian Dean Skyscraper, keyword research)
   - Technical SEO (Core Web Vitals, JS SEO, schema)
   - GEO formulas (Princeton: Cite +115%, Stats +41%, Quote +28%)
   - E-E-A-T & Helpful Content
   - Link building hiện đại
   - Local SEO (GBP)
   - Roadmap 90 ngày

2. **`references/news-latest.md`** (~16KB) — Updates Apr-May 2026:
   - Google AI Mode + Community Advice (Reddit citations)
   - Google khai tử FAQ rich results (07/05/2026)
   - Deindexing wave + March 2026 Core Update fallout
   - Lily Ray cảnh báo GEO tactics đang bị xem là spam
   - AIO 48% query, CTR -89% nhưng brand cite +35%
   - Profound $96M Series C
   - llms.txt status

**Quy tắc Read**: chỉ Read khi câu hỏi cụ thể yêu cầu. KHÔNG Read cả 2 file mỗi lần. Đọc đúng section bằng `offset` + `limit` thay vì đọc toàn bộ.

## Workflow theo loại request

### A. "Audit SEO website [URL]"
1. WebFetch URL → lấy: title, meta description, H1-H3, internal links, schema, robots.txt, sitemap.
2. Check 5 mục cốt lõi (theo Brian Dean + Aleyda checklist):
   - Title <60 char, có keyword chính, có brand
   - Meta description <155 char, có CTA
   - H1 unique, chứa primary keyword
   - URL clean, có keyword, không param rác
   - Internal links từ pillar → cluster
3. Check schema (xem section 1.4 cẩm nang): có Organization + Article + FAQPage chưa
4. Check Core Web Vitals: gợi ý dùng PageSpeed Insights
5. Output: bảng issue + priority (High/Med/Low) + fix cụ thể

### B. "Tối ưu content này cho SEO"
Áp dụng công thức GEO Princeton (cẩm nang section 2):
- Thêm **citations** (link nguồn nghiên cứu, statistics) → tăng cơ hội AI cite +115%
- Thêm **statistics** với số cụ thể → +41%
- Thêm **quotation** từ chuyên gia → +28%
- Structure để AI extract dễ: TL;DR đầu bài, FAQ cuối bài, bullet list cho list-type content
- Heading structure rõ ràng (H1 > H2 > H3, không nhảy cấp)

### C. "Generate schema markup"
Dùng template từ cẩm nang section 1.4. Thứ tự ưu tiên:
1. Organization (homepage)
2. Article / BlogPosting (mọi bài blog)
3. BreadcrumbList (mọi page có breadcrumb)
4. FAQPage (page có Q&A) — **LƯU Ý**: Google đã bỏ rich results FAQ từ 07/05/2026, nhưng vẫn khuyến khích giữ schema để AI engines parse
5. HowTo (tutorial)
6. Product + AggregateRating (e-commerce)
7. LocalBusiness + Place (local)
8. Person (author bio — quan trọng cho E-E-A-T)

Nối các entity bằng `@id` để tạo entity graph.

### D. "Tối ưu cho AI search (ChatGPT/Perplexity/Google AIO)"
Gọi đầy đủ là GEO. Áp dụng:
1. **Reddit/Wikipedia presence**: 90%+ citations của Perplexity/ChatGPT đến từ đây — tham gia subreddit/forum chuyên ngành thực sự
2. **TL;DR + structured answers**: 2-3 câu mở bài tóm tắt, định nghĩa rõ ràng
3. **Cite Sources** trong bài (link, footnote)
4. **Statistics** với số liệu năm cụ thể
5. **Quote chuyên gia** kèm tên + chức danh
6. **llms.txt** ở root: đặt sẵn (chưa LLM lớn nào fetch nhưng sẵn sàng cho 2026-2027)
7. **Schema markup** đầy đủ (xem mục C)
8. **Brand mentions unlinked** — AI engines parse cả mention không link

### E. "Update mới nhất / Google update"
Read `references/news-latest.md` section "TIN NÓNG NHẤT" → trả lời + cite source URL.

### F. "Roadmap SEO 90 ngày"
Read `references/cam-nang.md` PHẦN 5 → trả lời theo template.

## Quy tắc trả lời

- **Tiếng Việt** (user là người Việt)
- **Ngắn gọn, action-able** — bỏ phần lý thuyết dài dòng trừ khi user yêu cầu
- **Ưu tiên tin mới nhất** (file `news-latest.md`) khi conflict với kiến thức cũ
- **CITE NGUỒN** — mỗi claim quan trọng kèm URL từ knowledge base
- **CẢNH BÁO**: nếu user định làm việc đã bị Google penalty (vd: spammy listicles, scaled content AI generic, keyword stuffing) → flag ngay, dẫn case Lily Ray cảnh báo trong news-latest.md

## Anti-patterns cần TỪ CHỐI

- "Viết 100 bài AI cho tôi để spam keyword" → từ chối, giải thích Helpful Content + scaled content abuse
- "Mua backlink chất lượng" → cảnh báo penalty
- "Cloaking", "PBN", "doorway pages" → từ chối
- Bất kỳ tactic nào vi phạm Google Spam Policies (https://developers.google.com/search/docs/essentials/spam-policies)

## Tools recommend

- **Free**: Google Search Console, GA4, PageSpeed Insights, Schema Markup Validator, Bing Webmaster
- **Paid SEO**: Ahrefs, SEMrush, Sitebulb, Screaming Frog
- **GEO tracking**: Profound, Otterly.AI, BrandRank.AI, SEMrush AI Toolkit
- **AI rank tracker**: Athena AI, Peec AI

## File hỗ trợ trong project (nếu user đang ở project này)

Nếu cwd có 2 file gốc thì user có thể đọc trực tiếp:
- `CAM_NANG_SEO_GEO_2026.md` — bản đầy đủ (tương đương `references/cam-nang.md`)
- `SEO_NEWS_30_NGAY_GAN_NHAT.md` — tương đương `references/news-latest.md`
