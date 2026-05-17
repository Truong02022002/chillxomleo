# Template: Blog Post (Informational Intent)

Dùng cho: hướng dẫn, giải thích khái niệm, "cách làm X", "X là gì", "tại sao X". Word count: 1500-3000.

## Cấu trúc

```markdown
# [H1: Câu hỏi/khẳng định chứa primary keyword — 50-65 char]

> **TL;DR:** [2-3 câu trả lời thẳng câu hỏi chính. AI engines extract đoạn này. Phải standalone — đọc riêng vẫn hiểu.]

*Cập nhật: [DD/MM/YYYY]* · *Tác giả: [Tên + role + link author page]* · *Đọc trong [X] phút*

---

[Intro 3-5 câu — hook + promise. KHÔNG bắt đầu bằng "Trong thời đại số ngày nay..."]

[Optional: Table of contents nếu bài >2000 từ]

## [H2: Section 1 — chứa secondary keyword]

[Nội dung. Mỗi 300-500 từ inject 1 statistic + 1 citation.]

> "[Quote từ expert]"
> — [Tên], [Chức danh], [Nguồn]

### [H3: Sub-point]

[Khi list ≥3 items → dùng bullet/numbered:]

- **Item 1**: [mô tả]
- **Item 2**: [mô tả]
- **Item 3**: [mô tả]

[Khi compare → dùng table:]

| Tiêu chí | Option A | Option B |
|----------|----------|----------|
| ... | ... | ... |

## [H2: Section 2]

[Pattern: vấn đề → giải pháp → ví dụ → kết luận section]

**Ví dụ thực tế** (firsthand experience):
> [Đoạn "tôi/chúng tôi đã thử X và kết quả Y" — cực quan trọng cho E-E-A-T]

[Image gợi ý: ảnh screenshot/sơ đồ minh hoạ]
![Mô tả ngắn cảnh trong ảnh — keyword tự nhiên](url)

## [H2: Section 3-N]

[Lặp pattern]

## Câu hỏi thường gặp (FAQ)

> Section này quan trọng cho AIO + AI search. Mỗi câu hỏi PHẢI là câu user thật search.

### [Câu 1 từ "People Also Ask"]

[Trả lời 2-4 câu, đủ standalone]

### [Câu 2]

[...]

### [Câu 3-7]

[...]

## Kết luận

[3-5 câu chốt lại. Restate TL;DR ý chính. Có CTA rõ ràng.]

**Bước tiếp theo**: [CTA — đọc bài liên quan / download checklist / đăng ký newsletter / liên hệ]

---

*Bài viết được cập nhật lần cuối: [date]. Nếu bạn thấy thông tin chưa chính xác, [contact form/email] để chúng tôi cập nhật.*

---

## 📚 Tài liệu tham khảo

1. [Source 1 — Author, Year](URL)
2. [Source 2](URL)
3. [Source 3](URL)
```

## Schema kèm theo

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[H1]",
  "description": "[meta description]",
  "datePublished": "[YYYY-MM-DD]",
  "dateModified": "[YYYY-MM-DD]",
  "author": {
    "@type": "Person",
    "name": "[name]",
    "url": "[author page]",
    "jobTitle": "[role]",
    "sameAs": ["[LinkedIn URL]", "[Twitter URL]"]
  },
  "publisher": {
    "@type": "Organization",
    "name": "[brand]",
    "logo": {"@type": "ImageObject", "url": "[logo]"}
  },
  "image": "[hero image URL]",
  "mainEntityOfPage": {"@type": "WebPage", "@id": "[url]"}
}
```

Kèm FAQPage schema nếu có FAQ section:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Câu 1]",
      "acceptedAnswer": {"@type": "Answer", "text": "[Trả lời]"}
    }
  ]
}
```

## Checklist riêng cho blog post

Ngoài 30 items chính, blog post cần thêm:
- [ ] Có Table of Contents nếu >2000 từ
- [ ] Có ≥1 đoạn firsthand "tôi/chúng tôi đã..."
- [ ] FAQ ≥5 câu (để chiếm AIO + featured snippet)
- [ ] Hero image + ≥2 ảnh trong bài
- [ ] Internal link tới ≥1 pillar page liên quan
