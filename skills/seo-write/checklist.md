# Pre-publish Checklist — 30 tiêu chí PHẢI có

Self-check sau khi viết xong, TRƯỚC khi user publish. Mỗi item: ✅ PASS / ⚠️ MISSING / ❌ FAIL.

Mục tiêu: ≥25/30 PASS. Nếu <25, flag yêu cầu user bổ sung.

---

## 📐 STRUCTURE (8 items)

- [ ] **1.** Title 30-60 ký tự, chứa primary keyword, có brand
- [ ] **2.** Meta description 120-155 ký tự, có CTA, có keyword
- [ ] **3.** URL slug ngắn (<60 char), kebab-case, chứa keyword
- [ ] **4.** H1 unique, không trùng 100% với title (variation tốt)
- [ ] **5.** TL;DR / structured answer ở đầu bài (2-3 câu)
- [ ] **6.** Heading hierarchy đúng (H1 > H2 > H3, không nhảy)
- [ ] **7.** FAQ section ở cuối (5-7 Q&A từ "People Also Ask")
- [ ] **8.** CTA rõ ràng ở cuối, phù hợp intent

## 🎯 GEO OPTIMIZATION (7 items) — Princeton formula

- [ ] **9.** ≥3 citations link ra nguồn authority (.gov/.edu/research/official)
- [ ] **10.** ≥3 statistics với số cụ thể + nguồn (vd: "47% theo Statista 2026")
- [ ] **11.** ≥1 quote từ expert kèm tên + chức danh + nguồn
- [ ] **12.** Data presentation: dùng table/list khi compare hoặc list ≥3 items
- [ ] **13.** Sentence ngắn (<25 từ trung bình) — AI extract dễ hơn
- [ ] **14.** Định nghĩa rõ ràng (term + definition pattern) cho concept chính
- [ ] **15.** KHÔNG bịa statistics/quote — placeholder `[CẦN VERIFY]` nếu chưa có nguồn

## 🏆 E-E-A-T (5 items)

- [ ] **16.** Author bio: tên thật + credentials + link sang author page
- [ ] **17.** Firsthand experience: có ít nhất 1 đoạn "tôi đã thử/làm/test"
- [ ] **18.** Last updated date hiển thị rõ
- [ ] **19.** External links ra nguồn authority (không link spam, casino, PBN)
- [ ] **20.** Tone giọng human, không phải AI generic (test: đọc to nghe có cứng không)

## 🔗 LINKING (3 items)

- [ ] **21.** 3-5 internal links với anchor descriptive
- [ ] **22.** 2-3 external links ra authority (overlap với citations OK)
- [ ] **23.** Không link "click here", "đọc thêm" — dùng anchor cụ thể

## 🖼️ MEDIA (2 items)

- [ ] **24.** Hero image với alt text descriptive (không stuff keyword)
- [ ] **25.** Ảnh trong bài có alt, có `loading="lazy"` (nếu generate HTML)

## 🏷️ SCHEMA + META (3 items)

- [ ] **26.** Schema JSON-LD đầy đủ (Article/Product/LocalBusiness)
- [ ] **27.** FAQPage schema (nếu có FAQ section)
- [ ] **28.** OG tags + Twitter cards mock (cho social share)

## 🚫 SAFETY (2 items)

- [ ] **29.** Không vi phạm Google Spam Policies (cloaking, sneaky redirect, keyword stuffing, scaled abuse)
- [ ] **30.** Không có pattern AI-generic (vd: "in today's fast-paced world", "in the realm of", "moreover", "delve into")

---

## ĐIỂM → ACTION

| PASS | Action |
|------|--------|
| 28-30 | ✅ Publish được, optional review nhẹ |
| 25-27 | 🟡 Publish được nhưng nên fix MISSING items trong 7 ngày |
| 20-24 | 🟠 Khoan publish — fix critical (E-E-A-T, GEO) trước |
| <20 | 🔴 Viết lại — thiếu nền móng (firsthand expertise, citations, structure) |

## CÁCH OUTPUT KẾT QUẢ SELF-CHECK

Sau bài viết, output bảng:

```
📋 SELF-CHECK: 27/30 PASS

✅ Structure: 8/8
✅ GEO: 6/7  (thiếu: quote expert — flag user bổ sung)
✅ E-E-A-T: 4/5  (thiếu: firsthand — flag user bổ sung)
✅ Linking: 3/3
✅ Media: 2/2
⚠️ Schema: 2/3  (FAQPage schema thiếu)
✅ Safety: 2/2

🔧 Cần user bổ sung:
1. 1 quote real từ expert ngành (item 11)
2. 1 đoạn firsthand "tôi đã thử/test" (item 17)
3. Thêm FAQPage JSON-LD (item 27 — auto-gen được nếu user OK)
```
