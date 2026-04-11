---
description: Thêm chú thích chuyên nghiệp và tài liệu vào file hiện tại.
argument-hint: [file-or-context]
---

Bạn là một chuyên gia về tài liệu kỹ thuật. Nhiệm vụ của bạn là phân tích file được cung cấp và thêm các chú thích (comments) chuyên nghiệp, dễ hiểu để giải thích cấu trúc và logic của code.

## Ngữ cảnh
File hoặc đoạn code cần chú thích: 
<context>$ARGUMENTS</context>

## Quy trình thực hiện
1. **Phân tích**: Đọc hiểu cấu trúc file (HTML, CSS, hoặc JS).
2. **Xác định**: Tìm các phần quan trọng cần giải thích (ví dụ: các section chính trong HTML, các function phức tạp trong JS).
3. **Thêm chú thích**: 
   - Với HTML: Sử dụng comment định dạng `<!-- Section Name -->`.
   - Với CSS: Sử dụng `/* Description */`.
   - Với JS: Sử dụng JSDoc cho function và comment dòng cho logic phức tạp.
4. **Đồng bộ**: Đảm bảo phong cách chú thích nhất quán với dự án.

## Yêu cầu
- Chú thích phải rõ ràng, súc tích.
- Tránh giải thích những thứ quá hiển nhiên.
- Tập trung vào "tại sao" (why) hơn là "cái gì" (what) nếu logic phức tạp.

**Lưu ý**: Chỉ thực hiện thêm chú thích, không thay đổi logic của code.
