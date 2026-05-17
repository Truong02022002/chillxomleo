---
name: seo-audit
description: Audit toàn diện 1 trang web theo 8 hạng mục (100 điểm) dựa trên cẩm nang SEO + GEO 2026. Dùng khi user cung cấp URL hoặc HTML/file local và yêu cầu chấm điểm, đánh giá, kiểm tra SEO, hoặc muốn biết "trang này có tốt không, sửa gì". Output là scorecard có điểm số từng dimension + top 10 issues prioritized + checklist fix.
---

# SEO Audit — Skill chấm điểm website

Skill này KHÔNG dạy lý thuyết SEO. Skill này CHẤM ĐIỂM 1 trang web cụ thể và đưa ra danh sách fix theo priority.

Cẩm nang lý thuyết nằm ở skill `seo-vn` (`~/.claude/skills/seo-vn/references/`). Khi cần tra cứu sâu, Read file đó với offset+limit, không Read full.

## Khi nào kích hoạt

- "audit SEO trang [URL]"
- "chấm điểm SEO website tôi"
- "trang này SEO tốt chưa?"
- "kiểm tra SEO landing page"
- User dán HTML/URL + nhờ phân tích
- User hỏi "trang web tôi cần sửa gì để lên top"

## Input cần có

Trước khi audit, hỏi user (nếu chưa rõ):
1. **URL** hoặc **file HTML local** cần audit
2. **Loại trang**: homepage / landing / blog post / product / category / local business
3. **Keyword chính** trang đang nhắm tới (để check relevance)
4. **Đối thủ trực tiếp** (optional — để so sánh)

Nếu user chỉ cho URL (không nói loại trang) → tự nhận diện qua URL pattern + content. Hỏi confirm nếu không chắc.

## Quy trình audit (theo thứ tự)

### Bước 1: Thu thập data
- WebFetch URL → lấy HTML đầy đủ
- Parse: `<title>`, `<meta>`, headings, images alt, schema JSON-LD, robots meta, canonical, hreflang, internal/external links count
- Check thêm:
  - `[origin]/robots.txt` — có không, có disallow nhầm không
  - `[origin]/sitemap.xml` — có không
  - `[origin]/llms.txt` — có không (mới quan trọng 2026)
- Nếu user cho file local: Read + parse tương tự

### Bước 2: Chấm điểm theo 8 hạng mục

Đọc file `checklist.md` cùng folder để có **rubric chi tiết 50+ tiêu chí**. Từng tiêu chí có công thức điểm cụ thể (PASS/PARTIAL/FAIL).

**8 dimensions, tổng 100 điểm:**

| # | Hạng mục | Điểm | Trọng tâm |
|---|----------|------|-----------|
| 1 | Technical Foundation | 15 | HTTPS, robots, sitemap, Core Web Vitals, indexability |
| 2 | On-page SEO | 20 | Title, meta, H1-H3, URL, alt text, internal linking |
| 3 | Content Quality + E-E-A-T | 15 | Word count, author bio, freshness, original data |
| 4 | Schema Markup | 10 | Organization, Article/Product, FAQ, Breadcrumb, Person |
| 5 | **GEO Optimization** | 15 | Citations, statistics, quotes, TL;DR, llms.txt |
| 6 | Mobile + UX | 10 | Responsive, tap targets, font, intrusive popups |
| 7 | Backlinks + Authority | 10 | DR/DA estimate, brand mentions, Reddit/Wiki presence |
| 8 | Local SEO (nếu có) | 5 | GBP, NAP, reviews |

**Lưu ý**: nếu trang KHÔNG phải local business → dimension 8 = N/A, scale lại tổng về /95 hoặc redistribute.

### Bước 3: Output report

Dùng template `templates/report.md` (Read khi cần). Cấu trúc:

```
🎯 SEO AUDIT — [URL]
Ngày: [today]
Loại trang: [...]
Keyword chính: [...]

═══ TỔNG ĐIỂM: XX/100 ═══
[A++ 90+ | A 80-89 | B 70-79 | C 60-69 | D 50-59 | F <50]

📊 BẢNG ĐIỂM 8 HẠNG MỤC
[bảng]

🚨 TOP 10 ISSUES PRIORITIZED
1. [HIGH] ... (impact: high, effort: low)
2. ...

✅ ĐÃ LÀM TỐT
- ...

📋 CHECKLIST FIX (ưu tiên 30 ngày)
Tuần 1: ...
Tuần 2: ...
...
```

Nếu user request "ngắn gọn" → dùng `templates/one-pager.md` (chỉ tổng điểm + top 5 issues).

### Bước 4: Recommend tools

Nếu issue cần tool external để confirm (vd: Core Web Vitals, backlinks), recommend:
- **Core Web Vitals**: PageSpeed Insights (https://pagespeed.web.dev/) — free
- **Schema validate**: https://validator.schema.org
- **Backlinks**: Ahrefs Free Backlink Checker, Moz Link Explorer
- **Mobile**: Google Mobile-Friendly Test
- **GEO tracking**: Profound (https://www.tryprofound.com/), Otterly.AI

## Quy tắc audit

1. **Cite criteria từ knowledge base** khi user hỏi tại sao
   - Vd: "Title cần <60 char vì Brian Dean (Backlinko) — `seo-vn/references/cam-nang.md`"
2. **Ưu tiên rule mới nhất 2026** (Read `seo-vn/references/news-latest.md` khi conflict)
   - Vd: FAQ rich results đã bị bỏ 07/05/2026 → KHÔNG trừ điểm vì thiếu FAQ rich result, NHƯNG vẫn khuyến khích FAQPage schema cho AI extraction
3. **CHỈ recommend white-hat** — refuse keyword stuffing, cloaking, PBN, scaled AI content (theo Lily Ray cảnh báo 04/2026)
4. **Mỗi issue PHẢI có**:
   - Severity (HIGH/MED/LOW)
   - Impact (vd: "ảnh hưởng CTR", "ảnh hưởng crawl budget")
   - Effort (1h / 1 ngày / 1 tuần)
   - Fix cụ thể (code/text mẫu nếu được)
5. **KHÔNG bịa số liệu** — nếu không kiểm tra được (vd: backlink count cần Ahrefs), ghi "Cần [tool] để verify" thay vì đoán

## Kết hợp với tool khác (nếu user muốn)

- "Generate code fix" → đề xuất Edit file local (nếu user share path)
- "Viết content mới đề xuất" → chuyển skill sang `seo-vn` workflow B
- "Schema markup mẫu" → generate trực tiếp, follow template `seo-vn` workflow C

## Anti-patterns

- KHÔNG audit dựa vào "cảm tính" — luôn refer rubric trong `checklist.md`
- KHÔNG skip dimension nào (kể cả khi nghĩ "không quan trọng") — đánh N/A nếu thật sự không áp dụng
- KHÔNG khuyến nghị "viết thêm 1000 từ" — recommend phải dựa vào search intent + competitor analysis
- KHÔNG đề xuất fix dimensions <8 nếu chưa fix dimensions 1-2 (technical + on-page là nền)
