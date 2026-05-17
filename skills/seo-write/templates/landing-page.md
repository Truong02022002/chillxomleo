# Template: Landing Page (Transactional / Commercial Intent)

Dùng cho: trang bán hàng/dịch vụ, "mua X", "đăng ký X", "thuê X", "[dịch vụ] tại [địa điểm]". Word count: 800-1500.

## Cấu trúc (above-the-fold ưu tiên conversion, scroll xuống mới SEO sâu)

```markdown
# [H1: Value proposition rõ — chứa primary keyword + benefit]

> [Sub-headline 1 dòng: lợi ích cụ thể, ai dùng, kết quả gì]

[CTA button chính #1 — vd: "Đặt lịch ngay" / "Nhận báo giá miễn phí"]

---

## [H2: Vấn đề mà sản phẩm/dịch vụ giải quyết]

[3-4 câu describe pain point — user đọc xong gật đầu "đúng vấn đề tôi đang gặp"]

## [H2: Giải pháp — sản phẩm/dịch vụ của chúng tôi]

[3-5 đoạn ngắn. Mỗi đoạn 1 USP.]

**Tại sao chọn [brand]:**
- ✅ **[USP 1]**: [explain 1 câu]
- ✅ **[USP 2]**: [explain 1 câu]
- ✅ **[USP 3]**: [explain 1 câu]
- ✅ **[USP 4]**: [explain 1 câu]

## [H2: Cách hoạt động / quy trình]

> Pattern numbered steps — AI extract dễ.

1. **Bước 1**: [...]
2. **Bước 2**: [...]
3. **Bước 3**: [...]

[CTA button #2 — sau khi explain process]

## [H2: Bảng giá / Gói dịch vụ]

| Gói | Giá | Phù hợp với | Bao gồm |
|-----|-----|-------------|---------|
| Cơ bản | [X]đ | Cá nhân | [list] |
| Tiêu chuẩn | [Y]đ | SME | [list] |
| Premium | [Z]đ | Doanh nghiệp | [list] |

[CTA cho từng gói]

## [H2: Khách hàng nói gì về chúng tôi]

> Social proof — quan trọng cho E-E-A-T + conversion.

> "[Testimonial 1 — quote real, không bịa]"
> — **[Tên khách hàng]**, [Chức danh], [Công ty]

> "[Testimonial 2]"
> — **[Tên]**, [Chức danh]

> "[Testimonial 3]"
> — **[Tên]**, [Chức danh]

**Logo khách hàng**: [list logo brands đã dùng dịch vụ]

## [H2: Số liệu chứng minh] — quan trọng cho GEO

- **[X+]** khách hàng đã sử dụng
- **[Y%]** tỷ lệ hài lòng (theo survey [Z])
- **[N+]** đơn đã hoàn thành trong [thời gian]
- **[M]** giải thưởng/chứng nhận

## [H2: FAQ — câu hỏi thường gặp]

> 5-7 câu user thật hỏi trước khi mua.

### [Câu 1 — vd: "Giá bao nhiêu?"]
[Trả lời rõ ràng, không vòng vo]

### [Câu 2 — vd: "Có hỗ trợ trả góp không?"]
[...]

### [Câu 3-7]
[...]

## [H2: Liên hệ / Đặt lịch]

[Form contact hoặc CTA cuối]

📞 **Hotline**: [số]
✉️ **Email**: [email]
📍 **Địa chỉ**: [nếu có offline]
🕐 **Giờ làm việc**: [...]

[CTA chính #3]

---

[Footer: trust signals — Đã đăng ký kinh doanh, MST, Bộ Công Thương, etc.]
```

## Schema kèm theo

**Product/Service schema** + **Organization** + **AggregateRating** (nếu có reviews):

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[tên dịch vụ/sản phẩm]",
  "description": "[meta description]",
  "brand": {"@type": "Brand", "name": "[brand]"},
  "offers": {
    "@type": "Offer",
    "price": "[giá]",
    "priceCurrency": "VND",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

Cho dịch vụ local: thêm **LocalBusiness**:

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "[brand]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[...]",
    "addressLocality": "[city]",
    "addressCountry": "VN"
  },
  "telephone": "[...]",
  "openingHours": "Mo-Su 08:00-22:00",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "[...]",
    "longitude": "[...]"
  }
}
```

## Quy tắc viết landing page

1. **Above-the-fold** = H1 + sub-headline + 1 CTA. KHÔNG được scroll mới thấy CTA.
2. **CTA ≥3 lần** trong page (đầu, giữa, cuối)
3. **Mỗi section ngắn** — 3-5 câu, không paragraph dài 200 từ
4. **Bullet/icon** thay vì paragraph cho list benefits
5. **Trust signals** rõ ràng (testimonial, logo, số liệu, certs)
6. **Mobile-first** — test trên 375px width, CTA dễ tap
7. **Page speed cực nhanh** — landing page phải <2.5s LCP, ảnh WebP, lazy load

## Checklist riêng cho landing page

Ngoài 30 items chính:
- [ ] Above-the-fold có H1 + CTA
- [ ] ≥3 CTA xuất hiện trong page
- [ ] ≥3 testimonials real (hoặc placeholder `[CẦN VERIFY]`)
- [ ] Bảng giá rõ ràng (nếu applicable)
- [ ] Trust signals (logo brands, số liệu, certs)
- [ ] Form contact đơn giản (≤5 fields)
- [ ] Phone number visible (mobile click-to-call)
