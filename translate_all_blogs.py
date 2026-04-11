"""
Mega translator for all 54 remaining blog -en.html files.
Translates body content using comprehensive VN->EN pattern matching.
Handles: headings, paragraphs, list items, image captions, TOC entries, 
FAQ sections, SEO meta, breadcrumbs, and common phrases.
"""
import os, re

# ========== COMPREHENSIVE TRANSLATION PAIRS ==========
# Ordered by priority (longer/more specific patterns first)

BODY_TRANSLATIONS = [
    # --- SEO / Breadcrumb ---
    ('"name": "Trang chủ"', '"name": "Home"'),
    
    # --- Common paragraph patterns ---
    ('Tọa lạc ngay trung tâm', 'Located right in the heart of'),
    ('Tọa lạc tại', 'Located at'),
    ('nằm trên đường', 'located on'),
    ('Nằm cách trung tâm', 'Located from the center'),
    ('cách trung tâm thành phố', 'from the city center'),
    ('cách trung tâm Đà Lạt', 'from downtown Da Lat'),
    
    # Location names
    ('thành phố sương mù', 'the misty city'),
    ('thành phố ngàn hoa', 'the City of a Thousand Flowers'),
    ('thành phố hoa', 'the flower city'),
    ('cao nguyên', 'the highlands'),
    
    # Common article phrases - greetings / intros
    ('Bạn đang tìm kiếm', 'Are you looking for'),
    ('Bạn đang lên kế hoạch', 'Are you planning'),
    ('Nếu bạn đang tìm', 'If you are looking for'),
    ('Nếu bạn muốn', 'If you want to'),
    ('bài viết này sẽ giúp bạn', 'this article will help you'),
    ('Hãy cùng khám phá', "Let's explore"),
    ('Cùng khám phá', "Let's discover"),
    ('Hãy cùng tìm hiểu', "Let's find out"),
    ('Cùng tìm hiểu', "Let's learn about"),
    ('Trong bài viết này', 'In this article'),
    ('Dưới đây là', 'Below are'),
    ('Sau đây là', 'Here are'),
    
    # Common descriptive phrases
    ('không thể bỏ lỡ', "you shouldn't miss"),
    ('không thể bỏ qua', "you can't miss"),
    ('đáng để trải nghiệm', 'worth experiencing'),
    ('đáng để ghé thăm', 'worth visiting'),
    ('rất đáng để', 'very worth'),
    ('nổi tiếng với', 'famous for'),
    ('được biết đến với', 'known for'),
    ('thu hút đông đảo', 'attracts a large number of'),
    ('thu hút du khách', 'attracts tourists'),
    ('du khách', 'visitors'),
    ('khách du lịch', 'tourists'),
    
    # Directions / Transport
    ('Hướng dẫn đường đi đến', 'How to get to'),
    ('Hướng dẫn đường đi', 'Directions'),
    ('Đường đi đến', 'How to get to'),
    ('Từ trung tâm thành phố', 'From the city center'),
    ('Từ trung tâm', 'From the center'),
    ('Xuất phát từ', 'Starting from'),
    ('Đi theo hướng', 'Head towards'),
    ('Rẽ trái', 'Turn left'),
    ('Rẽ phải', 'Turn right'),
    ('Đi thẳng', 'Go straight'),
    ('Đi thêm khoảng', 'Continue for about'),
    ('khoảng cách', 'distance'),
    ('mất khoảng', 'takes about'),
    ('xe máy', 'motorbike'),
    ('xe buýt', 'bus'),
    ('taxi', 'taxi'),
    ('ô tô', 'car'),
    
    # Time expressions
    ('buổi sáng', 'in the morning'),
    ('buổi chiều', 'in the afternoon'),
    ('buổi tối', 'in the evening'),
    ('ban đêm', 'at night'),
    ('sáng sớm', 'early morning'),
    ('hoàng hôn', 'sunset'),
    ('bình minh', 'sunrise'),
    ('cuối tuần', 'weekend'),
    ('ngày thường', 'weekdays'),
    ('Chủ nhật', 'Sunday'),
    ('Thứ hai', 'Monday'),
    ('Thứ Bảy', 'Saturday'),
    
    # Food & dining
    ('quán nướng', 'BBQ restaurant'),
    ('quán ăn', 'restaurant'),
    ('món ăn', 'dishes'),
    ('đồ ăn', 'food'),
    ('đồ uống', 'drinks'),
    ('nước uống', 'beverages'),
    ('thực đơn', 'menu'),
    ('món nướng', 'grilled dishes'),
    ('hải sản', 'seafood'),
    ('thịt nướng', 'grilled meat'),
    ('lẩu', 'hotpot'),
    ('đồ nướng', 'BBQ'),
    ('ăn uống', 'dining'),
    ('ẩm thực', 'cuisine'),
    ('đặc sản', 'specialty'),
    ('giá cả hợp lý', 'reasonable prices'),
    ('giá cả phải chăng', 'affordable prices'),
    ('giá rẻ', 'cheap'),
    ('ngon miệng', 'delicious'),
    ('tươi ngon', 'fresh and delicious'),
    
    # Experience / Feelings
    ('trải nghiệm tuyệt vời', 'wonderful experience'),
    ('trải nghiệm thú vị', 'interesting experience'),
    ('trải nghiệm độc đáo', 'unique experience'),
    ('không gian', 'atmosphere'),
    ('không khí', 'ambiance'),
    ('view đẹp', 'beautiful view'),
    ('cảnh đẹp', 'beautiful scenery'),
    ('lãng mạn', 'romantic'),
    ('thơ mộng', 'poetic'),
    ('mộng mơ', 'dreamy'),
    ('yên bình', 'peaceful'),
    ('thanh bình', 'tranquil'),
    ('chill', 'chill'),
    ('sống ảo', 'Instagrammable'),
    ('check-in', 'check-in'),
    
    # Weather
    ('thời tiết', 'weather'),
    ('mát mẻ', 'cool and refreshing'),
    ('se lạnh', 'chilly'),
    ('sương mù', 'misty/foggy'),
    
    # Tourism phrases
    ('điểm đến', 'destination'),
    ('địa điểm', 'location'),
    ('tham quan', 'visit/explore'),
    ('khám phá', 'discover'),
    ('kinh nghiệm du lịch', 'travel tips'),
    ('kinh nghiệm', 'experience/tips'),
    ('lịch trình', 'itinerary'),
    ('cẩm nang du lịch', 'travel guide'),
    ('cẩm nang', 'guide'),
    ('gợi ý', 'suggestion'),
    ('lưu ý', 'note'),
    ('mẹo hay', 'useful tips'),
    ('bỏ túi', 'pocket guide'),
    
    # Accommodation
    ('homestay', 'homestay'),
    ('khách sạn', 'hotel'),
    ('nhà nghỉ', 'guesthouse'),
    ('phòng nghỉ', 'room'),
    
    # Photo/Image captions
    ('Ảnh:', 'Photo:'),
    ('Nguồn ảnh:', 'Photo source:'),
    ('Hình ảnh:', 'Image:'),
    
    # CTA / Restaurant info - expanded
    ('📍 Địa chỉ:', '📍 Address:'),
    ('<strong>Địa chỉ</strong>', '<strong>Address</strong>'),
    ('<strong>Địa chỉ:', '<strong>Address:'),
    ('>Địa chỉ<', '>Address<'),
    ('Địa chỉ:', 'Address:'),
    ('⏰ Giờ mở cửa:', '⏰ Opening Hours:'),
    ('⏰ Giờ hoạt động:', '⏰ Operating Hours:'),
    ('<strong>Giờ mở cửa</strong>', '<strong>Opening Hours</strong>'),
    ('<strong>Giờ mở cửa:', '<strong>Opening Hours:'),
    ('Giờ mở cửa:', 'Opening Hours:'),
    ('📞 Hotline đặt bàn:', '📞 Reservation Hotline:'),
    ('📞 Hotline:', '📞 Hotline:'),
    ('<strong>Hotline đặt bàn</strong>', '<strong>Reservation Hotline</strong>'),
    ('<strong>Hotline đặt bàn:', '<strong>Reservation Hotline:'),
    ('<strong>Liên hệ</strong>', '<strong>Contact</strong>'),
    ('<strong>Liên hệ:', '<strong>Contact:'),
    ('📞 Liên hệ:', '📞 Contact:'),
    ('📞 Liên hệ đặt bàn:', '📞 Reservation Contact:'),
    ('Đặt bàn ngay', 'Book now'),
    ('Đặt bàn trước', 'Book in advance'),
    ('>Đặt bàn<', '>Book a Table<'),
    ('>Đặt Bàn<', '>Book a Table<'),
    ('đặt bàn', 'book a table'),
    ('Đặt Bàn', 'Book a Table'),
    
    ('mỗi ngày', 'daily'),
    ('hàng ngày', 'daily'),
    ('Tham quan miễn phí', 'Free admission'),
    ('hoàn toàn miễn phí', 'completely free'),
    ('miễn phí', 'free'),
    ('Miễn phí', 'Free'),
    ('Giá vé vào cổng:', 'Admission fee:'),
    ('Giá vé:', 'Ticket price:'),
    
    # Xom Leo specific
    ('Tiệm Nướng &amp; Chill Xóm Lèo', 'Tiệm Nướng &amp; Chill Xóm Lèo'),
    ('Tiệm Nướng & Chill Xóm Lèo', 'Tiệm Nướng & Chill Xóm Lèo'),
    ('View ngắm tàu', 'Train-watching views'),
    ('ngắm tàu hỏa', 'watch the train'),
    ('hoàng hôn cực chill', 'stunning sunset vibes'),
    ('Không gian mở, thoáng', 'Open-air, breezy atmosphere'),
    ('Thịt nướng đậm vị', 'Richly marinated grilled meats'),
    ('Hải sản nướng', 'Grilled seafood'),
    ('Combo ăn uống hợp lý', 'Great-value combo sets'),
    
    # Common verbs/actions
    ('lên dốc', 'head uphill'),
    ('đi bộ', 'walk'),
    ('dạo quanh', 'stroll around'),
    ('ngắm cảnh', 'enjoy the scenery'),
    ('chụp ảnh', 'take photos'),
    ('nghỉ ngơi', 'rest/relax'),
    ('thưởng thức', 'enjoy'),
    
    # Conclusion phrases
    ('Sẽ quay lại!', 'Will definitely return!'),
    ('Nhất định sẽ quay lại', 'Will definitely come back'),
    ('để chuyến đi thêm trọn vẹn', 'for the perfect ending to your trip'),
    ('chuyến đi', 'trip'),
    
    # Transport
    ('🚍 Xe Khách:', '🚍 Bus:'),
    ('Xe khách:', 'Bus:'),
    ('🏍️ Xe máy:', '🏍️ Motorbike:'),
    ('✈️ Máy bay:', '✈️ By air:'),
    ('Các hãng xe như Phương Trang, Thành Bưởi đều có', 'Bus companies like Phuong Trang and Thanh Buoi all have'),
    ('chuyến xe chạy hàng ngày từ TP.HCM', 'daily buses from Ho Chi Minh City'),
    ('từ TP.HCM', 'from Ho Chi Minh City'),
    ('từ Sài Gòn', 'from Saigon'),
    ('từ Hà Nội', 'from Hanoi'),
    ('sân bay Liên Khương', 'Lien Khuong Airport'),
    ('Sân bay Liên Khương', 'Lien Khuong Airport'),
    
    # FAQ labels
    ('Câu hỏi thường gặp', 'Frequently Asked Questions'),
    ('FAQ –', 'FAQ –'),
    
    # Misc
    ('Gợi ý cực HOT', 'Super HOT Tip'),
    ('Kinh nghiệm tham quan', 'Visiting Tips'),
    ('Rất hợp:', 'Perfect for:'),
    ('Đi nhóm', 'Groups'),
    ('Hẹn hò', 'Date night'),
    ('Chill buổi tối', 'Evening chill sessions'),
    ('Điểm nổi bật:', 'Highlights:'),
    ('Món nổi bật:', 'Signature dishes:'),
    ('Bản đồ:', 'Map:'),
    ('Xem đường đi', 'Get Directions'),
    ('Thời gian mở cửa', 'Opening Hours'),
]

def translate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for vn, en in BODY_TRANSLATIONS:
        if vn != en:  # Skip identity replacements
            content = content.replace(vn, en)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Count remaining VN chars
        vn_count = len(re.findall(r'[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]', content))
        return True, vn_count
    return False, 0

def main():
    blog_dir = 'blog'
    count = 0
    remaining = []
    
    for fn in sorted(os.listdir(blog_dir)):
        if fn.endswith('-en.html'):
            fp = os.path.join(blog_dir, fn)
            changed, vn_chars = translate_file(fp)
            if changed:
                count += 1
                remaining.append((fn[:50], vn_chars))
                print(f"  Translated: {fn[:55]:55s} (remaining VN chars: {vn_chars})")
            else:
                # Still count VN chars
                with open(fp, 'r', encoding='utf-8') as f:
                    c = f.read()
                vn_c = len(re.findall(r'[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]', c))
                if vn_c > 50:
                    remaining.append((fn[:50], vn_c))
    
    print(f"\nTranslated common patterns in {count} files.")
    
    if remaining:
        remaining.sort(key=lambda x: -x[1])
        print(f"\nTop 10 files with most remaining VN chars:")
        for fn, vc in remaining[:10]:
            print(f"  {fn:50s} {vc} VN chars")

if __name__ == '__main__':
    main()
