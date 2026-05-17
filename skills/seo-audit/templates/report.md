# Template: Full SEO Audit Report

Dùng template này khi audit chi tiết. Replace `[...]` bằng data thực tế. Giữ format Markdown để render đẹp trong terminal/IDE.

---

```markdown
# 🎯 SEO AUDIT REPORT

**URL**: [url]
**Loại trang**: [homepage / landing / blog / product / category / local]
**Keyword chính**: [keyword]
**Ngày audit**: [YYYY-MM-DD]
**Auditor**: Claude Code (skill: seo-audit)

---

## 🏆 TỔNG ĐIỂM: **XX/100** — Grade **[A++/A/B/C/D/F]**

> [1-2 câu nhận định tổng quan, vd: "Trang có nền tảng technical tốt nhưng thiếu GEO optimization — đang bỏ lỡ 40-50% traffic từ AI search engines"]

---

## 📊 BẢNG ĐIỂM 8 HẠNG MỤC

| # | Dimension | Điểm | Max | % | Status |
|---|-----------|------|-----|---|--------|
| 1 | Technical Foundation | XX | 15 | XX% | 🟢/🟡/🔴 |
| 2 | On-page SEO | XX | 20 | XX% | 🟢/🟡/🔴 |
| 3 | Content Quality + E-E-A-T | XX | 15 | XX% | 🟢/🟡/🔴 |
| 4 | Schema Markup | XX | 10 | XX% | 🟢/🟡/🔴 |
| 5 | GEO Optimization | XX | 15 | XX% | 🟢/🟡/🔴 |
| 6 | Mobile + UX | XX | 10 | XX% | 🟢/🟡/🔴 |
| 7 | Backlinks + Authority | XX | 10 | XX% | 🟢/🟡/🔴 |
| 8 | Local SEO | XX | 5 | XX% | 🟢/🟡/🔴 / N/A |

🟢 ≥80% · 🟡 50-79% · 🔴 <50%

---

## 🚨 TOP 10 ISSUES — PRIORITIZED

> Sort theo `priority = impact × (1/effort)`. Fix theo thứ tự này.

### 1. [HIGH] [Tên issue]
- **Vấn đề**: [mô tả ngắn]
- **Impact**: [vd: ảnh hưởng CTR -20%, hoặc Google không index, hoặc AI engines không cite]
- **Effort**: [1h / 1 ngày / 1 tuần]
- **Fix cụ thể**:
  ```html
  [code/text mẫu]
  ```
- **Reference**: [link tới rubric trong checklist.md hoặc cam-nang.md]

### 2. [HIGH] ...
[lặp lại format]

### 3-10. ...

---

## ✅ ĐÃ LÀM TỐT (giữ nguyên)

- ✓ [Vd: HTTPS + redirect 301 đầy đủ]
- ✓ [Vd: Schema Organization đúng format]
- ✓ [Vd: Mobile responsive pass test]

---

## 📋 CHECKLIST FIX (30-60 NGÀY)

### 🔥 Tuần 1-2 (Critical fixes)
- [ ] [Issue 1]
- [ ] [Issue 2]
- [ ] ...

### 📈 Tuần 3-4 (On-page + Content)
- [ ] [Issue ...]

### 🚀 Tháng 2 (Authority + GEO)
- [ ] [Issue ...]

---

## 🛠️ TOOLS CẦN CHẠY THÊM

Skill này KHÔNG check được hết. Cần verify thêm:
- [ ] **PageSpeed Insights**: https://pagespeed.web.dev/?url=[url] — đo Core Web Vitals chính xác
- [ ] **Schema Validator**: https://validator.schema.org/#url=[url]
- [ ] **Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly?url=[url]
- [ ] **Ahrefs Free Backlink Checker**: https://ahrefs.com/backlink-checker — verify backlinks
- [ ] **Search Console**: confirm indexing + impressions thực tế

---

## 📚 REFERENCES

- Cẩm nang đầy đủ: `~/.claude/skills/seo-vn/references/cam-nang.md`
- Updates 30 ngày: `~/.claude/skills/seo-vn/references/news-latest.md`
- Rubric chi tiết: `~/.claude/skills/seo-audit/checklist.md`
- Google Spam Policies: https://developers.google.com/search/docs/essentials/spam-policies
- Princeton GEO paper: https://arxiv.org/abs/2311.09735

---

## 🔄 LẦN AUDIT TIẾP

Recommend re-audit sau **30 ngày** sau khi fix critical issues. Track:
- Điểm tổng có cải thiện?
- Issues HIGH đã clear hết chưa?
- Có issue mới phát sinh (vd: thêm page mới chưa schema)?
```
