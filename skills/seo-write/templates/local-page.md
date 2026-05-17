# Template: Local Page (Local SEO — chi nhánh, địa điểm)

Dùng cho: page chi nhánh, "[dịch vụ] tại [quận/thành phố]", "[brand] [địa điểm]", "near me" intent. Word count: 500-1200.

## Cấu trúc

```markdown
# [H1: "[Dịch vụ/sản phẩm] tại [Quận/Thành phố] | [Brand]"]
*VD: "Trạm dừng nghỉ tại Long Thành, Đồng Nai | Trạm Dừng Chill"*

> **TL;DR:** [Brand] tại [địa điểm] — [USP chính]. Mở cửa [giờ], hotline [số]. Địa chỉ: [đầy đủ]. [CTA].

---

## [H2: Về [chi nhánh] tại [địa điểm]]

[3-5 câu describe chi nhánh — kể chuyện cụ thể, không generic. Vd: "Mở cửa từ [năm], chúng tôi đã phục vụ [N] khách trong khu vực [địa điểm]..."]

**Thông tin nhanh:**

| Hạng mục | Chi tiết |
|----------|----------|
| 📍 Địa chỉ | [Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP] |
| 📞 Hotline | [Số — click-to-call trên mobile] |
| 🕐 Giờ mở cửa | T2-T7: [giờ]<br>CN: [giờ] |
| 🌐 Website | [URL chi nhánh] |
| 📧 Email | [email chi nhánh] |
| 🚗 Bãi đậu xe | [Có/Không + sức chứa] |

[Map embed — Google Maps iframe với toạ độ chính xác]

[CTA: "Chỉ đường" — link Google Maps]

## [H2: Dịch vụ tại [địa điểm]]

> Liệt kê dịch vụ cụ thể — ngắn gọn.

- ✅ **[Dịch vụ 1]**: [explain 1 câu]
- ✅ **[Dịch vụ 2]**: [explain 1 câu]
- ✅ **[Dịch vụ 3]**: [explain 1 câu]

[CTA: "Đặt trước/Liên hệ"]

## [H2: Cách tới [chi nhánh]]

> Quan trọng cho local SEO + AI extraction. Mô tả cụ thể.

**Từ trung tâm [thành phố lớn]:**
1. [Hướng dẫn chi tiết]
2. [...]

**Phương tiện công cộng:**
- Xe bus tuyến [số]: dừng tại [trạm]
- Grab/Be/Gojek: [keyword search]

**Mốc landmarks gần:**
- Cách [địa điểm nổi tiếng A] [N]m
- Đối diện [địa điểm B]
- Gần [địa điểm C]

## [H2: Tại sao chọn chúng tôi tại [địa điểm]?]

[3-5 USP cụ thể cho chi nhánh này, không copy paste từ chi nhánh khác]

- 🎯 **[USP 1]**: [explain]
- 🎯 **[USP 2]**: [explain]
- 🎯 **[USP 3]**: [explain]

## [H2: Đánh giá khách hàng tại [địa điểm]]

> Lấy review thật từ Google Business Profile của chi nhánh.

> "[Review 1 — quote real từ GBP]"
> ⭐⭐⭐⭐⭐ **[Tên reviewer]** · [Ngày]

> "[Review 2]"
> ⭐⭐⭐⭐⭐ **[Tên reviewer]** · [Ngày]

> "[Review 3]"
> ⭐⭐⭐⭐⭐ **[Tên reviewer]** · [Ngày]

**Tổng: ⭐ [X.X]/5 từ [N] đánh giá** ([link Google Maps reviews])

## [H2: Hình ảnh tại chi nhánh]

[3-6 ảnh real chụp tại chi nhánh — KHÔNG dùng stock photo. Alt descriptive.]

![Mặt tiền [brand] tại [địa điểm]](url1)
![Khu vực [...] bên trong](url2)
![[Dịch vụ X] tại chi nhánh](url3)

## FAQ

### [Brand] [địa điểm] mở cửa lúc mấy giờ?
[Trả lời cụ thể]

### Có chỗ đậu xe không?
[Trả lời]

### Có nhận đặt trước không?
[Trả lời + cách đặt]

### Giá [dịch vụ] tại [địa điểm] bao nhiêu?
[Range giá hoặc link bảng giá]

### Có dịch vụ giao hàng/đến tận nơi không?
[Nếu áp dụng]

### [Câu 6-7 từ "People Also Ask" của keyword local]
[...]

## Liên hệ ngay

📞 **Hotline**: [Số — bold to dễ tap mobile]
✉️ **Email**: [email]
📍 **Địa chỉ đầy đủ**: [...]
💬 **Zalo/Messenger**: [link nếu có]

[Form liên hệ đơn giản — Tên + SĐT + Nội dung]

---

[Footer chi nhánh: liên kết tới chi nhánh khác, blog liên quan tới khu vực]
```

## Schema kèm theo (CỰC quan trọng cho local)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "[URL chi nhánh]#localbusiness",
  "name": "[Brand] - [Địa điểm]",
  "image": "[ảnh mặt tiền chi nhánh]",
  "logo": "[logo brand]",
  "description": "[meta description]",
  "url": "[URL chi nhánh]",
  "telephone": "+84[số]",
  "priceRange": "₫₫",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[số + đường]",
    "addressLocality": "[Quận/Huyện]",
    "addressRegion": "[Tỉnh/TP]",
    "postalCode": "[mã bưu điện]",
    "addressCountry": "VN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "[lat]",
    "longitude": "[lng]"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
      "opens": "08:00",
      "closes": "22:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Sunday",
      "opens": "09:00",
      "closes": "21:00"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  },
  "sameAs": [
    "[Google Maps URL]",
    "[Facebook page chi nhánh]",
    "[Zalo OA]"
  ]
}
```

## Quy tắc viết local page

1. **NAP consistency** — Name/Address/Phone PHẢI match Google Business Profile + citations (Foursquare, Yellow Pages VN, etc.)
2. **Mỗi chi nhánh = 1 page riêng** — không gộp nhiều chi nhánh 1 page
3. **Content unique** — không copy paste giữa các chi nhánh, mỗi chi nhánh có local angle riêng
4. **Ảnh real** — KHÔNG stock photo, ảnh chụp tại chi nhánh
5. **Map embed** — Google Maps iframe với toạ độ đúng
6. **Click-to-call** — số điện thoại bold, dễ tap trên mobile
7. **Reviews từ GBP** — embed hoặc quote real reviews
8. **Hyperlocal keywords** — kết hợp keyword + tên đường, tên landmarks ("trạm dừng nghỉ gần cao tốc Long Thành")

## Checklist riêng local page

Ngoài 30 items chính:
- [ ] NAP consistent với GBP + citations
- [ ] Map embed Google Maps
- [ ] Click-to-call phone number
- [ ] ≥3 reviews real từ GBP
- [ ] ≥3 ảnh real chụp tại chi nhánh
- [ ] Direction từ landmark gần nhất
- [ ] LocalBusiness schema đầy đủ + geo coords
- [ ] OpeningHoursSpecification cụ thể từng ngày
- [ ] sameAs link tới Google Maps, Facebook chi nhánh
