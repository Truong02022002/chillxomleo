# Template: Listicle (List-type Post)

Dùng cho: "Top X", "10 cách", "5 best", "danh sách". Word count: 1500-3500. Format AI engines + featured snippet rất thích.

## Cấu trúc

```markdown
# [H1: "Top [X] [thing] [năm/2026] — [angle]"]
*VD: "Top 10 trạm dừng nghỉ tốt nhất TP.HCM 2026 — Theo đánh giá thực tế"*

> **TL;DR:** Tổng hợp [X] [thing] tốt nhất [năm], được chọn dựa trên [tiêu chí]. Đứng đầu là [#1] với [ưu điểm chính]. Xem full bảng so sánh ↓

*Cập nhật: [DD/MM/YYYY]* · *Tác giả: [Tên + role]* · *Đã review [N] [items]*

---

## Tóm tắt nhanh — Bảng so sánh top [X]

| Hạng | Tên | Điểm mạnh | Giá | Phù hợp với |
|------|-----|-----------|-----|-------------|
| 🥇 #1 | [Tên 1] | [...] | [...] | [...] |
| 🥈 #2 | [Tên 2] | [...] | [...] | [...] |
| 🥉 #3 | [Tên 3] | [...] | [...] | [...] |
| #4 | [...] | [...] | [...] | [...] |
| ... | ... | ... | ... | ... |

[CTA: "Xem chi tiết từng option ↓"]

---

## Cách chúng tôi chọn — Methodology

> Phần này QUAN TRỌNG cho E-E-A-T. Engine + user cần biết bạn không chỉ copy list từ đâu đó.

Chúng tôi đánh giá [X] [items] dựa trên [N] tiêu chí:

1. **[Tiêu chí 1]** (trọng số XX%): [explain]
2. **[Tiêu chí 2]** (trọng số XX%): [explain]
3. **[Tiêu chí 3]** (trọng số XX%): [explain]

Dữ liệu thu thập từ [nguồn — vd: review thực tế, survey N người, test trực tiếp].

---

## #1. [Tên item] — [Tagline ngắn]

[Hero image với alt descriptive]
![Mô tả item 1](url)

**Điểm tổng**: 9.5/10

| Ưu điểm | Nhược điểm |
|---------|------------|
| ✅ [...] | ❌ [...] |
| ✅ [...] | ❌ [...] |
| ✅ [...] | |

### Tại sao đứng #1?

[3-4 đoạn ngắn — analyze cụ thể, không generic]

> **Firsthand experience**: "Chúng tôi đã [test/dùng/visit] và [kết quả cụ thể]" — quan trọng cho E-E-A-T.

**Phù hợp nhất với**: [user persona]
**Giá tham khảo**: [...]
**Link**: [internal link tới detail page hoặc external link nếu affiliate]

---

## #2. [Tên item] — [Tagline]

[Lặp pattern]

---

## #3-N

[Lặp]

---

## Bảng so sánh chi tiết

> Bảng full size — quan trọng cho AI extract + featured snippet.

| Tiêu chí | #1 | #2 | #3 | #4 | #5 |
|----------|-----|-----|-----|-----|-----|
| Giá | | | | | |
| Chất lượng | | | | | |
| Dịch vụ | | | | | |
| Vị trí | | | | | |
| Đánh giá Google | | | | | |

---

## Nên chọn cái nào? (Decision guide)

> Pattern: scenario → recommendation. AI engines + user thích.

- **Nếu bạn cần [scenario A]** → chọn **#1** vì [lý do]
- **Nếu budget hạn chế** → chọn **#3** vì [lý do]
- **Nếu cần [scenario C]** → chọn **#5** vì [lý do]

---

## FAQ

### Top [X] này được chọn như thế nào?
[Reference methodology section]

### Bao lâu cập nhật danh sách?
[Vd: "Mỗi quý chúng tôi review lại"]

### Tại sao không có [item phổ biến X]?
[Trả lời transparent — vd: "Vì [tiêu chí Y] không đạt"]

### [Câu 4-7 từ "People Also Ask"]
[...]

---

## Kết luận

[2-3 câu chốt. Restate top 3.]

**Bạn đã chọn được [item] phù hợp chưa?** [CTA: comment, share, hoặc tới page liên quan]

---

## 📚 Nguồn tham khảo

1. [Source 1](URL)
2. [Source 2](URL)
3. [Survey/data nội bộ — link methodology page nếu có]
```

## Schema kèm theo

Listicle dùng **ItemList schema** + Article:

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "[Tên #1]",
      "url": "[link]"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "[Tên #2]",
      "url": "[link]"
    }
  ]
}
```

Nếu là review listicle (sản phẩm có rating): mỗi item dùng **Review schema**:

```json
{
  "@type": "Review",
  "itemReviewed": {"@type": "Product", "name": "[Tên item]"},
  "reviewRating": {"@type": "Rating", "ratingValue": "9.5", "bestRating": "10"},
  "author": {"@type": "Person", "name": "[reviewer]"}
}
```

## Quy tắc viết listicle

1. **Bảng so sánh ở đầu + cuối** — đầu để skim, cuối để decision
2. **Mỗi item có bullet pros/cons** — AI engines thích format này
3. **Methodology phải trong sáng** — không "top X" generic không có lý do chọn
4. **Firsthand mỗi item** — viết "tôi/chúng tôi đã thử"
5. **Decision guide** — không bắt user tự chọn
6. **Số "X" lẻ tốt hơn chẵn** (7, 11, 13) — psychology research
7. **KHÔNG affiliate spam** — disclosure rõ nếu có link affiliate

## Checklist riêng listicle

Ngoài 30 items chính:
- [ ] Bảng so sánh tóm tắt ở đầu
- [ ] Methodology section explain cách chọn
- [ ] Mỗi item có pros/cons table
- [ ] Bảng so sánh chi tiết ở cuối
- [ ] Decision guide ("nếu bạn ... → chọn ...")
- [ ] FAQ ≥4 câu
- [ ] Disclosure affiliate (nếu có)
- [ ] ItemList schema
