---
name: seo-geo-check
description: Kiểm tra nhanh website theo các update SEO + GEO mới nhất (Apr-May 2026) — phát hiện rủi ro (FAQ rich results deprecated, GEO spam patterns Lily Ray cảnh báo, deindexing wave) và cơ hội (AI Overviews inline links, Community Advice từ Reddit, Princeton GEO formulas). Khác seo-audit (chấm 100đ tổng quát), skill này chạy 5 RISK CHECKS + 5 OPPORTUNITY SCANS theo tin 30 ngày gần nhất, output pass/fail + fix cụ thể. Dùng khi user hỏi "check trang theo update mới nhất", "site có dính spam GEO không", "trang đã sẵn sàng cho AI Overviews chưa", "audit theo Google update tháng 5/2026".
---

# SEO + GEO Check — Skill kiểm tra theo update mới nhất (Apr-May 2026)

Skill này KHÔNG chấm điểm tổng quát (dùng `seo-audit` cho việc đó). Skill này QUÉT theo **5 rủi ro nóng** và **5 cơ hội nóng** của 30 ngày gần nhất, trả về PASS/FAIL/WARN từng mục + fix cụ thể.

Cập nhật cuối: 2026-05-15. Phạm vi news: 15/04/2026 → 15/05/2026.

## Khi nào kích hoạt

- "check trang [URL] theo update Google mới nhất"
- "site tôi có bị ảnh hưởng update tháng 5/2026 không?"
- "có dính GEO spam (Lily Ray) không?"
- "trang đã sẵn sàng cho AI Overviews/AI Mode chưa?"
- "kiểm tra deindex"
- "FAQ schema có cần gỡ không?"
- "audit nhanh theo news 30 ngày"

## Input cần có

1. **URL** hoặc **file HTML local**
2. (Tùy chọn) **Search Console export** (đếm pages "Crawled - not indexed" / "Discovered - not indexed") — để chạy DEINDEX CHECK chính xác
3. (Tùy chọn) **Loại trang**: homepage / blog / product / listicle / comparison / local

## Knowledge base (lazy-load)

File trong skill folder này:

1. **`references/news-30-days.md`** — Snapshot tin SEO + GEO 15/04-15/05/2026 (Top 5 tin nóng, algorithm updates, AI search updates, tools, checklist hành động). Read khi user hỏi chi tiết tin hoặc khi cần cite source.

2. **`checklist.md`** — Rubric chi tiết 10 mục kiểm tra (5 risk + 5 opportunity), từng mục có PASS/WARN/FAIL criteria + fix cụ thể. Read trước khi chạy check.

3. **`templates/check-report.md`** — Template output report.

**Quy tắc Read**: chỉ Read đúng section cần. Không Read full file mỗi lần.

## Quy trình check (5 bước)

### Bước 1: Thu thập

- WebFetch URL → HTML đầy đủ
- Parse: title, meta, headings, schema JSON-LD, robots meta, canonical
- Check `[origin]/robots.txt`, `[origin]/sitemap.xml`, `[origin]/llms.txt`
- Quét nội dung: tìm pattern "self-promotional listicle", "comparison aggregator", nút "Summarize with AI"
- Nếu user share Search Console data → đọc count "Crawled/Discovered - currently not indexed"

### Bước 2: 5 RISK CHECKS (theo TIN NÓNG news-30-days.md)

| # | Risk | Trigger từ news | Action |
|---|------|----------------|--------|
| R1 | **FAQ Rich Results tracking** | TIN NÓNG #2 (07/05/2026) | Check trang còn track FAQ rich result không, schema có giữ không |
| R2 | **GEO Spam patterns** | TIN NÓNG #4 — Lily Ray 13/05/2026 | Quét: (a) self-promotional listicle, (b) scaled comparison page, (c) "Summarize with AI" button có prompt injection |
| R3 | **Deindex wave** | TIN NÓNG #3 (13-14/05/2026) | Check SC "Crawled - not indexed" + content mỏng/AI-generic |
| R4 | **March 2026 Core Update fallout** | Algorithm Updates section | Check: site có phải affiliate/listicle/comparison, có thiếu first-party data + author bio không |
| R5 | **Volatility 13-14/05 reaction** | TIN NÓNG #3 + Algorithm | Cảnh báo KHÔNG phản ứng vội nếu rank tụt sau 13-14/05 (chưa confirm update) |

### Bước 3: 5 OPPORTUNITY SCANS

| # | Opportunity | Trigger từ news | Action |
|---|-------------|----------------|--------|
| O1 | **AI Overviews inline links** | TIN NÓNG #1 (06/05/2026) | Check heading structure rõ, mỗi đoạn 1 idea → Google sẽ link chính xác đoạn được trích |
| O2 | **Community Advice (Reddit/forum)** | TIN NÓNG #1 | Check brand có hiện diện Reddit/forum chuyên ngành không (Perplexity/ChatGPT cite từ đây 90%+) |
| O3 | **Princeton GEO formulas** | TIN NÓNG #5 + cam-nang | Đếm trên trang: Citations (+115%), Statistics (+41%), Quotes (+28%). Mục tiêu: tối thiểu mỗi loại ≥ 2 |
| O4 | **News subscription markup** | TIN PHỤ — Nieman Lab | Nếu publisher có paywall → check NewsArticle schema + paywalled content markup |
| O5 | **llms.txt readiness** | TOOLS & RESEARCH | Check `[origin]/llms.txt` tồn tại không (low-cost, low-yield bet) |

### Bước 4: Output report

Dùng template `templates/check-report.md`. Cấu trúc tối thiểu:

```
🔎 SEO + GEO CHECK — [URL]
Ngày check: [today]
Snapshot tin tham chiếu: 15/04 → 15/05/2026

═══ KẾT QUẢ ═══
Risk:        X/5 PASS, Y WARN, Z FAIL
Opportunity: X/5 đã làm, Y bỏ lỡ

🚨 RISK CHECKS
R1 FAQ Rich Results tracking      [PASS|WARN|FAIL]
   → [fix cụ thể nếu FAIL/WARN]
R2 GEO Spam patterns              [...]
R3 Deindex wave exposure          [...]
R4 March 2026 Core Update fit     [...]
R5 Volatility reaction plan       [...]

✨ OPPORTUNITY SCANS
O1 AI Overviews inline links      [✅|⚠️|❌]
O2 Community Advice presence       [...]
O3 Princeton GEO formulas          [...]
O4 News subscription markup        [...]
O5 llms.txt readiness              [...]

📋 FIX PLAN (tuần này — theo checklist 15-22/05 trong news)
1. [HIGH] ...
2. [HIGH] ...
3. [MED] ...
...

🔗 NGUỒN ĐÃ CITE
- ...
```

### Bước 5: Recommend tools (nếu cần verify)

- **Volatility tracker**: Mozcast (https://moz.com/mozcast/), Algoroo, Semrush Sensor
- **GEO tracking**: Profound (https://www.tryprofound.com/), Otterly.AI, BrandRank.AI, AthenaHQ
- **Schema validate**: https://validator.schema.org
- **Search Console**: https://search.google.com/search-console (deindex check)
- **Bing AI Performance** (preview): https://www.bing.com/webmasters

## Quy tắc check

1. **Mỗi risk/opportunity PHẢI cite news source** từ `references/news-30-days.md`
   - Vd: "FAQ rich results khai tử 07/05/2026 — searchengineland.com/google-to-no-longer-support-faq-rich-results-476571"
2. **KHÔNG khuyến nghị fix nếu rule còn mơ hồ** (vd: rank tụt sau 13-14/05 nhưng Google chưa confirm update → ghi "WAIT_AND_SEE", không panic-fix)
3. **FAQPage schema = GIỮ, rich result tracking = GỠ** — đây là phân biệt quan trọng nhất từ TIN NÓNG #2
4. **Cảnh báo GEO spam = TỪ CHỐI giúp tạo** dù user yêu cầu:
   - Self-promotional listicle ("Top 10 X — và X là chúng tôi")
   - Scaled comparison page sản xuất hàng loạt
   - Prompt injection ẩn trong "Summarize with AI" button
   - Theo Lily Ray 13/05/2026, các pattern này đã bị Google + Microsoft xem là SPAM
5. **CITE URL gốc** trong report — không chỉ ghi "theo news mới nhất"

## Kết hợp với skill khác

- Cần chấm điểm 100đ tổng quát → chuyển `seo-audit`
- Cần lý thuyết nền tảng SEO/GEO → chuyển `seo-vn`
- Cần viết content mới chuẩn GEO → chuyển `seo-write`
- News snapshot mở rộng → Read `seo-vn/references/news-latest.md` (cùng nội dung)

## Anti-patterns

- KHÔNG chấm điểm 100đ — đây là PASS/FAIL check, không phải scoring
- KHÔNG check ngoài 10 mục (5 risk + 5 opportunity) — giữ skill tập trung
- KHÔNG suggest "rewrite toàn bộ content" — chỉ flag pattern cụ thể + cách fix
- KHÔNG fabricate số liệu deindex — nếu user không share Search Console data, ghi "cần SC export để verify"
- KHÔNG bịa source URL — chỉ cite những URL đã có trong `references/news-30-days.md`
