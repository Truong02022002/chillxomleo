# Rubric chấm điểm SEO Audit — 100 điểm tổng

Mỗi tiêu chí có 3 mức:
- **PASS** = full điểm
- **PARTIAL** = 50% điểm
- **FAIL** = 0 điểm

Khi audit, mark từng tiêu chí + cộng tổng. Output điểm theo dimension.

---

## DIMENSION 1: TECHNICAL FOUNDATION (15 điểm)

### 1.1 HTTPS (2đ)
- PASS: site dùng HTTPS, redirect 301 từ HTTP, certificate valid
- FAIL: HTTP only, hoặc cert expired/self-signed

### 1.2 robots.txt (2đ)
- PASS: tồn tại, không disallow page quan trọng nhầm, có link sitemap
- PARTIAL: tồn tại nhưng thiếu sitemap link
- FAIL: không có hoặc disallow `/` toàn site

### 1.3 sitemap.xml (2đ)
- PASS: tồn tại tại `/sitemap.xml` hoặc `/sitemap_index.xml`, submit GSC, fresh (lastmod cập nhật)
- PARTIAL: có nhưng outdated >3 tháng
- FAIL: không có

### 1.4 Indexability (3đ)
- PASS: page audit không có `noindex`, không bị block bởi robots, có thể fetch
- PARTIAL: có canonical trỏ sang URL khác (intentional?)
- FAIL: noindex trên page quan trọng

### 1.5 Core Web Vitals (4đ) — đo qua PageSpeed Insights
- PASS: LCP <2.5s, INP <200ms, CLS <0.1 (mobile)
- PARTIAL: 2/3 metric đạt
- FAIL: 0-1 metric đạt
- *Nếu không đo được trực tiếp, recommend user chạy PSI và mark "Cần verify"*

### 1.6 Mobile-first ready (2đ)
- PASS: responsive, viewport meta, không content khác mobile vs desktop
- FAIL: không responsive hoặc thiếu viewport

---

## DIMENSION 2: ON-PAGE SEO (20 điểm)

### 2.1 Title tag (3đ)
- PASS: 30-60 ký tự, chứa primary keyword, có brand cuối ("| Brand"), unique
- PARTIAL: thiếu brand HOẶC quá dài/ngắn HOẶC keyword ở cuối
- FAIL: trùng title trang khác, hoặc không có keyword

### 2.2 Meta description (2đ)
- PASS: 120-155 ký tự, có CTA, có keyword, unique
- PARTIAL: có nhưng quá dài/ngắn, thiếu CTA
- FAIL: không có hoặc auto-gen từ Google

### 2.3 H1 (3đ)
- PASS: 1 H1 duy nhất, chứa primary keyword, khác title (variation)
- PARTIAL: H1 OK nhưng giống hệt title 100%
- FAIL: 0 H1 hoặc nhiều H1 hoặc H1 không có keyword

### 2.4 Heading hierarchy H2-H6 (2đ)
- PASS: H2 chứa secondary keywords, hierarchy đúng (không nhảy H1→H4)
- PARTIAL: hierarchy lộn xộn nhưng có H2
- FAIL: chỉ dùng H1 hoặc heading dùng để style (vd: H3 to hơn H2)

### 2.5 URL structure (2đ)
- PASS: ngắn (<60 char), keyword trong slug, dùng `-` không `_`, không có UTM/session
- PARTIAL: hơi dài nhưng vẫn descriptive
- FAIL: URL có ID rác (`?p=12345`), querystring nhiều, ngôn ngữ encoded

### 2.6 Image optimization (3đ)
- PASS: tất cả `<img>` có `alt` descriptive (không stuff keyword), dùng WebP/AVIF, có `loading="lazy"` cho below-fold, có `width/height` (chống CLS)
- PARTIAL: alt có nhưng không descriptive, thiếu lazy load
- FAIL: nhiều `<img>` không alt hoặc alt rỗng

### 2.7 Internal linking (3đ)
- PASS: ≥3 internal link relevant, anchor text descriptive (không "click here"), link tới pillar/cluster
- PARTIAL: có internal link nhưng anchor generic
- FAIL: 0 internal link hoặc chỉ link về homepage

### 2.8 External linking (2đ)
- PASS: link ra nguồn authority (statistics, research) — quan trọng cho GEO
- PARTIAL: có 1-2 link
- FAIL: 0 external link (engine khó hiểu context)

---

## DIMENSION 3: CONTENT QUALITY + E-E-A-T (15 điểm)

### 3.1 Word count phù hợp intent (3đ)
- PASS: word count match với top 10 SERP cho keyword đó
  - Informational: thường 1500-3000 từ
  - Transactional/local: 300-800 từ đủ
  - YMYL: ≥2000 từ + nguồn
- PARTIAL: ngắn hơn 30-50% so với top SERP
- FAIL: <300 từ hoặc thin content (chỉ có form, vài câu)

### 3.2 Author bio (3đ) — quan trọng cho E-E-A-T 2026
- PASS: có author bio kèm credentials, link sang author page với schema Person, link LinkedIn/Twitter của author
- PARTIAL: có tên author nhưng không có bio/credentials
- FAIL: không có author hoặc "admin"/"team"

### 3.3 Original content / data (3đ)
- PASS: có ≥1 trong: original research, firsthand experience, original media (ảnh tự chụp, screenshot từ tool real), case study
- PARTIAL: có firsthand nhưng ít, đa số là tổng hợp
- FAIL: hoàn toàn rephrase từ nguồn khác, hoặc AI-generated rõ ràng

### 3.4 Freshness (2đ)
- PASS: có "Last updated: [date]" trong vòng 6 tháng, content cập nhật thực tế
- PARTIAL: có date nhưng >1 năm
- FAIL: không có date hoặc date sai

### 3.5 Helpful Content alignment (4đ)
- PASS: written for human first, không stuff keyword, trả lời đúng intent, có added value (không phải chỉ rephrase)
- PARTIAL: có value nhưng có dấu hiệu SEO-first (vd: lặp keyword H2)
- FAIL: thin content, AI generic, scaled content abuse pattern

---

## DIMENSION 4: SCHEMA MARKUP (10 điểm)

Validate qua https://validator.schema.org

### 4.1 Organization schema (homepage) (2đ)
- PASS: có Organization với @id, logo, sameAs (social), contactPoint
- FAIL: không có

### 4.2 Article / BlogPosting (nếu là blog) (2đ)
- PASS: có Article kèm headline, datePublished, dateModified, author (Person), publisher (Organization)
- PARTIAL: có nhưng thiếu author hoặc dateModified
- FAIL: không có

### 4.3 BreadcrumbList (1đ)
- PASS: có schema khớp với UI breadcrumb
- FAIL: không có

### 4.4 FAQPage (1đ) — đã bỏ rich results 07/05/2026 NHƯNG vẫn quan trọng cho AI parsing
- PASS: có FAQPage với 3-10 Q&A
- FAIL: không có (nếu page có Q&A nhưng không markup)
- *KHÔNG trừ điểm nếu page không có nội dung Q&A — N/A*

### 4.5 Schema theo loại trang (3đ)
- E-commerce: Product + Offer + AggregateRating
- Local: LocalBusiness + Place + GeoCoordinates
- HowTo/Tutorial: HowTo schema
- Recipe: Recipe schema
- Event: Event schema
- PASS: schema phù hợp loại trang, đầy đủ required fields
- PARTIAL: có nhưng thiếu field
- FAIL: không có schema phù hợp

### 4.6 Person schema cho author (1đ)
- PASS: author page có Person schema với jobTitle, sameAs (LinkedIn), worksFor
- FAIL: không có

---

## DIMENSION 5: GEO OPTIMIZATION (15 điểm) — MỚI 2026

Theo Princeton GEO study + Lily Ray 2026 guidance.

### 5.1 Citations to sources (4đ) — boost AI cite +115%
- PASS: ≥3 citations link ra nguồn authority (research papers, .gov, .edu, official docs)
- PARTIAL: có 1-2 citation
- FAIL: 0 citation

### 5.2 Statistics with numbers (3đ) — boost +41%
- PASS: ≥3 con số cụ thể có nguồn (vd: "47% theo Statista 2026")
- PARTIAL: có số nhưng không nguồn
- FAIL: không có statistics

### 5.3 Quotation từ chuyên gia (2đ) — boost +28%
- PASS: ≥1 quote thực tế từ expert kèm tên + chức danh
- FAIL: không có quote hoặc quote bịa

### 5.4 TL;DR / structured answer ở đầu (2đ)
- PASS: có đoạn 2-3 câu đầu bài tóm tắt câu trả lời
- FAIL: dẫn dắt lan man trước khi vào ý chính

### 5.5 Structured data dễ extract (2đ)
- PASS: dùng `<table>`, `<ul>` rõ ràng, định nghĩa với `<dl><dt><dd>`, FAQ có `<details>` hoặc heading rõ
- FAIL: content toàn `<p>` walls of text

### 5.6 llms.txt presence (1đ)
- PASS: có `/llms.txt` ở root (chưa LLM lớn nào fetch nhưng future-proof)
- FAIL: không có
- *Nếu không có, KHÔNG trừ nặng — gợi ý thêm vào*

### 5.7 Brand mentions (unlinked + linked) (1đ)
- PASS: brand name xuất hiện consistent, có Wikipedia/Reddit presence (check qua Google "[brand] site:reddit.com")
- FAIL: brand mới hoàn toàn, 0 mention ngoài site

---

## DIMENSION 6: MOBILE + UX (10 điểm)

### 6.1 Mobile responsive (3đ)
- Test qua https://search.google.com/test/mobile-friendly
- PASS: pass test, không horizontal scroll, content reflow đúng
- FAIL: không pass

### 6.2 Tap targets (2đ)
- PASS: button/link ≥48x48px, spacing ≥8px
- FAIL: tap targets quá nhỏ/sát nhau

### 6.3 Font readability (2đ)
- PASS: font-size body ≥16px, line-height ≥1.5, contrast WCAG AA (≥4.5:1)
- PARTIAL: có 1 vấn đề
- FAIL: text quá nhỏ hoặc contrast kém

### 6.4 Intrusive interstitials (2đ)
- PASS: không có popup full-screen che content khi mới load (mobile)
- FAIL: có popup full-screen, hoặc popup vào ngay khi land

### 6.5 Above-the-fold value (1đ)
- PASS: user thấy content chính trong 1s đầu, không phải chờ ad/popup load
- FAIL: above-fold toàn ad/banner/popup

---

## DIMENSION 7: BACKLINKS + AUTHORITY (10 điểm)

Cần Ahrefs/Moz/Semrush để verify chính xác. Nếu không có, recommend tool và estimate.

### 7.1 Domain Authority (3đ)
- PASS: DR ≥30 (Ahrefs) hoặc DA ≥30 (Moz)
- PARTIAL: DR/DA 15-29
- FAIL: <15

### 7.2 Referring domains (2đ)
- PASS: ≥50 referring domains, ≥10 từ DR ≥40
- PARTIAL: 10-49
- FAIL: <10

### 7.3 Anchor text diversity (2đ)
- PASS: mix của brand, naked URL, generic, partial-match (không over-optimize anchor)
- FAIL: >50% exact match keyword (penalty risk)

### 7.4 Toxic backlinks (1đ)
- PASS: <5% toxic links theo Ahrefs/Semrush
- FAIL: nhiều spam/PBN/casino links

### 7.5 Brand mentions (link + unlink) (2đ)
- PASS: brand được mention trên Reddit, Wikipedia, news sites authority
- PARTIAL: có mention nhưng ít authority
- FAIL: 0 mention ngoài site

---

## DIMENSION 8: LOCAL SEO (5 điểm) — chỉ áp dụng nếu là local business

### 8.1 Google Business Profile (2đ)
- PASS: claimed, verified, đầy đủ photos, hours, services, posts gần đây
- PARTIAL: claimed nhưng thiếu info
- FAIL: chưa claim

### 8.2 NAP consistency (1đ)
- PASS: Name/Address/Phone trên website match GBP, citation (Foursquare, Yellow Pages, etc.)
- FAIL: NAP inconsistent

### 8.3 Reviews (1đ)
- PASS: ≥20 reviews, ≥4.0 stars, có response từ owner
- PARTIAL: có nhưng <20 hoặc không response
- FAIL: <5 reviews

### 8.4 Local schema (1đ)
- PASS: LocalBusiness schema với address, geo, openingHours
- FAIL: không có

**Nếu KHÔNG phải local business**: dimension 8 = N/A, scale tổng về /95.

---

## CÁCH MAP ĐIỂM → GRADE

| Điểm | Grade | Diễn giải |
|------|-------|-----------|
| 90-100 | A++ | Top 5% website, gần như không cần fix gì lớn |
| 80-89 | A | Tốt, vài tweak nhỏ |
| 70-79 | B | Trung bình khá, có 5-10 issue cần fix |
| 60-69 | C | Trung bình, cần đầu tư 1-2 tháng để cải thiện |
| 50-59 | D | Yếu, nhiều technical/on-page issue |
| <50 | F | Cần làm lại từ nền móng |

## QUICK WIN ORDER (priority sửa)

Khi xuất report, sort issues theo công thức `priority = impact × (1/effort)`:

**HIGH PRIORITY (tuần 1-2):**
- Technical fail (HTTPS, indexability, Core Web Vitals đỏ)
- Title/meta thiếu hoặc duplicate
- H1 fail
- Schema cơ bản (Organization, Article)

**MEDIUM (tuần 3-4):**
- Content quality (E-E-A-T, freshness)
- Internal linking
- GEO basics (citations, stats)

**LOW (tháng 2+):**
- Backlinks (cần thời gian)
- Local SEO (nếu có)
- llms.txt, advanced schema
