"""
Translate common Vietnamese patterns in ALL blog -en.html files.
Handles: CTA blocks, contact info, common UI phrases, FAQ labels.
"""
import os

COMMON_REPLACEMENTS = [
    # Address/contact/CTA block (appears in most articles)
    ('📍 Địa chỉ', '📍 Address'),
    ('📍 <em', '📍 <em'),
    ('⏰ Giờ mở cửa:', '⏰ Opening Hours:'),
    ('⏰ Giờ hoạt động:', '⏰ Operating Hours:'),
    ('🕐 Giờ mở cửa:', '🕐 Opening Hours:'),
    ('Giờ mở cửa:', 'Opening Hours:'),
    ('mỗi ngày', 'daily'),
    ('hàng ngày', 'daily'),
    ('📞 Hotline đặt bàn:', '📞 Reservation Hotline:'),
    ('📞 Hotline:', '📞 Hotline:'),
    ('📞 Liên hệ', '📞 Contact'),
    ('Đặt bàn ngay', 'Book now'),
    ('Đặt bàn trước', 'Book in advance'),
    ('>Đặt Bàn Trước<', '>Book in Advance<'),
    ('>Đặt bàn ngay<', '>Book Now<'),
    ('đặt bàn trước', 'book in advance'),
    
    # Common article phrases
    ('Bạn nên ghé:', 'You should visit:'),
    ('Điểm nổi bật:', 'Highlights:'),
    ('Món nổi bật:', 'Signature dishes:'),
    ('Thời gian mở cửa', 'Opening Hours'),
    ('Giá vé:', 'Ticket price:'),
    ('Giá vé vào cổng:', 'Admission fee:'),
    ('Miễn phí', 'Free'),
    ('miễn phí', 'free'),
    ('Tham quan miễn phí', 'Free admission'),
    
    # Directions
    ('Hướng dẫn đường đi', 'How to get there'),
    ('Xem đường đi', 'Get Directions'),
    ('Bản đồ:', 'Map:'),
    
    # FAQ common labels
    ('Câu hỏi thường gặp', 'Frequently Asked Questions'),
    
    # Xom Leo specific
    ('View ngắm tàu', 'Train-watching views'),
    ('hoàng hôn cực chill', 'stunning sunset — super chill'),
    ('Không gian mở, thoáng', 'Open-air, breezy atmosphere'),
    ('Thịt nướng đậm vị', 'Richly marinated grilled meats'),
    ('Hải sản nướng', 'Grilled seafood'),
    ('Combo ăn uống hợp lý', 'Great-value combo sets'),
    ('Rất hợp:', 'Perfect for:'),
    ('Đi nhóm', 'Groups'),
    ('Hẹn hò', 'Date night'),
    ('Chill buổi tối', 'Evening chill sessions'),
    
    # Blog article labels
    ('Gợi ý cực HOT', 'Super HOT Tip'),
    ('Kinh nghiệm tham quan', 'Visiting Tips'),
    
    # Transport
    ('🚍 Xe Khách:', '🚍 Bus:'),
    ('Xe khách:', 'Bus:'),
    ('🏍️ Xe máy:', '🏍️ Motorbike:'),
    ('✈️ Máy bay:', '✈️ By air:'),
    
    # Common closing
    ('để chuyến đi thêm trọn vẹn', 'for the perfect ending to your trip'),
    ('Sẽ quay lại!', 'Will definitely return!'),
]

def translate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for vn, en in COMMON_REPLACEMENTS:
        content = content.replace(vn, en)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    blog_dir = 'blog'
    count = 0
    for fn in sorted(os.listdir(blog_dir)):
        if fn.endswith('-en.html'):
            fp = os.path.join(blog_dir, fn)
            if translate_file(fp):
                count += 1
                print(f"  Translated common patterns in {fn}")
    
    print(f"\nDone! Translated common patterns in {count} blog files.")

if __name__ == '__main__':
    main()
