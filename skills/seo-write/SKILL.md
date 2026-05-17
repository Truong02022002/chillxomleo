---
name: seo-write
description: Viết bài chuẩn SEO + GEO 2026 từ đầu — blog post, landing page, listicle, local page, product description. Áp dụng công thức Princeton GEO (cite +115%, stats +41%, quote +28%), E-E-A-T signals, schema markup, structured cho AI extraction. Dùng khi user yêu cầu "viết bài về [topic]", "viết content cho keyword [X]", "viết landing page", "viết bài blog". KHÁC seo-vn workflow B (chỉ tối ưu content có sẵn) — skill này VIẾT MỚI từ đầu.
---

# SEO Content Writer — Skill viết bài chuẩn SEO + GEO 2026

Skill này tạo content mới từ đầu, không phải tối ưu content có sẵn (việc đó dùng `seo-vn` workflow B).

## Khi nào kích hoạt

- "viết bài về [topic]"
- "viết content cho keyword [X]"
- "viết landing page bán [sản phẩm/dịch vụ]"
- "viết bài blog 2000 chữ về..."
- "draft 1 bài listicle top 10..."
- "viết mô tả sản phẩm chuẩn SEO"
- "viết local page cho chi nhánh ở [địa điểm]"

## Knowledge base (lazy-load)

- `templates/blog-post.md` — bài blog dài (informational intent)
- `templates/landing-page.md` — landing page (transactional intent)
- `templates/listicle.md` — bài top X / list-type
- `templates/local-page.md` — page local SEO (chi nhánh, địa điểm)
- `checklist.md` — checklist 30 tiêu chí PHẢI có trước khi publish
- Knowledge sâu: `~/.claude/skills/seo-vn/references/cam-nang.md` (chỉ Read khi cần dẫn nguồn cụ thể)
- Tin update: `~/.claude/skills/seo-vn/references/news-latest.md`

## Quy trình bắt buộc (không skip bước)

### Bước 1: INTAKE — hỏi đủ context

Trước khi viết 1 chữ, hỏi user (gộp vào 1-2 turn, đừng hỏi từng câu):

1. **Keyword chính** (primary) — đang nhắm rank cho từ khoá nào?
2. **Search intent** — informational / transactional / navigational / commercial investigation?
   *Tự đoán từ keyword nếu rõ, hỏi xác nhận nếu mơ hồ.*
3. **Loại bài**: blog / landing / listicle / local / product
4. **Word count target** — gợi ý: blog 1500-3000, landing 800-1500, local 500-1000, product 300-600
5. **Brand voice** — formal / friendly / expert / casual?
6. **Firsthand expertise** — user có data/case study/kinh nghiệm thực tế nào để inject vào? (BẮT BUỘC HỎI — quyết định E-E-A-T pass hay fail)
7. **Internal links** — có URL pillar/cluster nào để link tới không?
8. **Đối thủ trực tiếp** (optional) — top 3 URL đang rank cho keyword đó

Nếu user nói "tự lo hết" → vẫn PHẢI có ít nhất keyword + intent + loại bài. Còn lại default theo niche.

### Bước 2: SERP RESEARCH (nếu có internet)

Khi possible, WebSearch keyword chính → check:
- Top 10 đang là loại content gì (so với template user chọn — match không?)
- "People Also Ask" boxes (lấy 3-5 câu cho FAQ section)
- Featured snippet đang là format nào (paragraph/list/table) — viết để chiếm
- AI Overview có không, đang cite ai
- Có Reddit/Quora trong top 10 không (nếu có → cần "Reddit-style" angle)

Nếu không có internet/user không cho phép search → SKIP, dùng best-practice template.

### Bước 3: OUTLINE — generate trước khi viết

Output outline cho user duyệt:

```
📝 OUTLINE — [tiêu đề tạm]

🎯 Meta package:
- Title (30-60 char): [...]
- Meta description (120-155 char): [...]
- URL slug: [...]
- Primary keyword: [...]
- Secondary keywords: [..., ..., ...]

📖 Cấu trúc:
- TL;DR (2-3 câu trả lời ngay câu hỏi chính) — quan trọng cho AIO
- H1: [...]
- Intro (3-5 câu, hook + promise)
- H2: [...]
  - H3: [...]
  - H3: [...]
- H2: [...]
  ...
- H2: FAQ (5-7 Q&A từ "People Also Ask")
- Conclusion + CTA

🔗 Internal links dự kiến: [list]
🌐 External citations dự kiến: [list nguồn authority]
📊 Statistics cần dẫn: [list số liệu cần kiếm]
💬 Quotes cần inject: [tên expert nào]
🖼️ Images đề xuất: [list + alt text gợi ý]
```

User OK outline → mới viết. Tránh viết nguyên 2000 từ rồi user yêu cầu sửa structure.

### Bước 4: VIẾT — áp dụng GEO formula

Áp dụng theo template user chọn (Read template tương ứng).

**Quy tắc viết bắt buộc:**

1. **TL;DR đầu bài** — 2-3 câu trả lời thẳng câu hỏi chính
   - AI engines (ChatGPT, Perplexity) prefer extract đoạn này
   - Format: bold "**TL;DR:**" hoặc dùng `<aside>` block

2. **Citations** (Princeton GEO: +115% AI cite rate)
   - Mỗi claim quan trọng → link nguồn authority (.gov, .edu, official docs, research papers)
   - Format: "Theo [nguồn] (link), ..." hoặc footnote

3. **Statistics** (+41%)
   - Mỗi 300-500 từ inject 1 con số có nguồn
   - Format: "47% theo [Statista 2026](url)"
   - KHÔNG bịa số — nếu không tìm được, ghi `[CẦN VERIFY: số liệu X]`

4. **Quotation từ expert** (+28%)
   - Ít nhất 1-2 quote real từ chuyên gia ngành kèm tên + chức danh + nguồn
   - KHÔNG bịa quote — nếu không có, ghi `[CẦN VERIFY: quote từ X]`

5. **Heading hierarchy đúng** — H1 → H2 → H3, không nhảy cấp, không dùng heading để style

6. **Bullet/numbered list khi có thể** — AI extract dễ hơn
   - List của ≥3 items → dùng `<ul>` hoặc `<ol>`
   - So sánh → dùng `<table>`

7. **Internal links 3-5 cái** — anchor descriptive, link tới pillar/cluster

8. **External link 2-3 cái** — link nguồn authority (đã đếm trong citations)

9. **Image alt text** — descriptive, không stuff keyword
   - Format: `![Mô tả ngắn cảnh trong ảnh — keyword tự nhiên](url)`

10. **FAQ section cuối bài** — 5-7 câu từ "People Also Ask"

11. **CTA cuối bài** — phù hợp intent

### Bước 5: META PACKAGE + SCHEMA

Sau khi viết xong, generate:

**a) Schema JSON-LD** (Article hoặc Product hoặc LocalBusiness tuỳ loại):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[title]",
  "datePublished": "[YYYY-MM-DD]",
  "dateModified": "[YYYY-MM-DD]",
  "author": {
    "@type": "Person",
    "name": "[author]",
    "url": "[author page]",
    "jobTitle": "[role]"
  },
  "publisher": {
    "@type": "Organization",
    "name": "[brand]",
    "logo": { "@type": "ImageObject", "url": "[logo url]" }
  },
  "description": "[meta description]",
  "image": "[hero image]"
}
</script>
```

**b) FAQPage schema** (cho FAQ section — bỏ rich results 07/05/2026 nhưng vẫn giúp AI parse)

**c) Internal linking suggestions** — list URL nên link tới từ bài này

**d) Distribution checklist** — Reddit subreddit phù hợp (cho GEO presence), LinkedIn angle, Twitter thread hook

### Bước 6: SELF-CHECK qua checklist.md

Read `checklist.md` và verify từng item. Nếu < 25/30 → flag yêu cầu user bổ sung context (thường là firsthand expertise, statistics nguồn cụ thể).

## Output cuối cùng

Cấu trúc message trả user:

```markdown
## 📝 [Tiêu đề bài]

[Full article markdown — đã viết theo template]

---

## 🎯 META PACKAGE
- **Title**: [...]
- **Meta description**: [...]
- **URL slug**: `/[slug]`
- **Primary keyword density**: X% (target 0.5-1.5%)
- **Word count**: X từ

## 🏷️ SCHEMA MARKUP
[JSON-LD code blocks]

## 🔗 INTERNAL LINKS DÙNG TRONG BÀI
- [...]

## 📋 SELF-CHECK CHECKLIST
✅ TL;DR ở đầu
✅ ≥3 citations
✅ ≥3 statistics
... [list từ checklist.md]
⚠️ [Items chưa pass — cần user bổ sung]

## 📤 DISTRIBUTION TIPS
- Reddit: r/[subreddit] — angle: ...
- LinkedIn: ...
- Email newsletter: ...
```

## Anti-patterns — REFUSE

1. **"Viết 50 bài AI cho tôi"** — refuse, giải thích:
   - Google Helpful Content + scaled content abuse policy
   - Lily Ray cảnh báo 04/2026 (xem `seo-vn/references/news-latest.md`)
   - Đề xuất: 5 bài có firsthand expertise tốt hơn 50 bài generic

2. **"Bài viết phải lặp keyword 3 lần mỗi đoạn"** — refuse keyword stuffing
   - Density target: 0.5-1.5%, dùng synonym + LSI

3. **"Không cần author, tôi sẽ ẩn tên"** — cảnh báo E-E-A-T fail
   - YMYL niche: BẮT BUỘC author thật + credentials
   - Non-YMYL: vẫn nên có author

4. **"Bịa quote/statistics cho tự nhiên"** — REFUSE
   - Bịa = E-E-A-T fail + risk fact-check fail trên AI engines
   - Luôn dùng `[CẦN VERIFY: ...]` placeholder thay vì bịa

5. **"Viết content y hệt đối thủ top 1"** — refuse plagiarism
   - Helpful Content System penalty
   - Đề xuất: pattern Skyscraper (tốt hơn, sâu hơn, original angle)

## Phối hợp với skill khác

- Sau khi viết xong → user muốn audit bài? → switch sang `seo-audit`
- User muốn schema markup riêng cho bài khác? → `seo-vn` workflow C
- User muốn tin Google update mới nhất? → `seo-vn` workflow E
