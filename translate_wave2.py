"""
Wave 2: More specific translations for remaining Vietnamese text in blog EN files.
Focus: headings with Vietnamese names that commonly appear, and longer phrases.
"""
import os, re

# Wave 2 translations - longer phrases and specific headings
WAVE2 = [
    # Common heading patterns
    ('Giới thiệu về', 'Introduction to'),
    ('Giới thiệu', 'Introduction'),
    ('Lịch sử hình thành', 'History'),
    ('Lịch sử', 'History'),
    ('Kiến trúc độc đáo', 'Unique Architecture'),
    ('Kiến trúc', 'Architecture'),
    ('Điểm đặc biệt', 'Special Features'),
    ('Điểm nổi bật', 'Highlights'),
    ('Vì sao gọi là', 'Why Is It Called'),
    ('Ăn gì gần', 'Where to Eat Near'),
    ('Ăn gì ở', 'What to Eat in'),
    ('Ăn gì', 'What to Eat'),
    ('Các điểm du lịch gần', 'Nearby Attractions Around'),
    ('Các điểm du lịch', 'Tourist Attractions'),
    ('Điểm du lịch', 'Tourist Spot'),
    ('Giờ lễ', 'Mass Schedule'),
    ('có thu phí không', 'is there an admission fee'),
    ('thời điểm đẹp nhất', 'the best time to visit'),
    ('Kinh nghiệm tham quan chi tiết', 'Detailed Visiting Guide'),
    
    # Place name-related
    ('quán cà phê', 'café'),
    ('quán cafe', 'café'),
    ('Quán cà phê', 'Café'),
    ('vườn hoa', 'flower garden'),
    ('Vườn hoa', 'Flower Garden'),
    ('thác nước', 'waterfall'),
    ('Thác nước', 'Waterfall'),
    ('hồ nước', 'lake'),
    ('đồi thông', 'pine hills'),
    ('Đồi thông', 'Pine Hills'),
    ('đồi cỏ', 'grass hill'),
    ('rừng thông', 'pine forest'),
    ('thung lũng', 'valley'),
    ('Thung lũng', 'Valley'),
    ('đỉnh núi', 'mountain peak'),
    ('vườn dâu', 'strawberry farm'),
    ('nhà thờ', 'church'),
    ('Nhà thờ', 'Church'),
    ('chùa', 'pagoda'),
    ('Chùa', 'Pagoda'),
    ('thiền viện', 'zen monastery'),
    ('Thiền viện', 'Zen Monastery'),
    ('dinh thự', 'palace'),
    ('Dinh', 'Palace'),
    ('quảng trường', 'square'),
    ('Quảng trường', 'Square'),
    ('chợ đêm', 'night market'),
    ('Chợ đêm', 'Night Market'),
    ('chợ', 'market'),
    ('ga xe lửa', 'railway station'),
    ('Ga xe lửa', 'Railway Station'),
    ('xe lửa', 'train'),
    ('tàu hỏa', 'train'),
    ('đường hầm', 'tunnel'),
    ('Đường hầm', 'Tunnel'),
    ('khu du lịch', 'tourist area'),
    ('Khu du lịch', 'Tourist Area'),
    ('công viên', 'park'),
    ('Công viên', 'Park'),
    
    # Specific Da Lat places
    ('Hồ Xuân Hương', 'Xuan Huong Lake'),
    ('Quảng trường Lâm Viên', 'Lam Vien Square'),
    ('Chợ Đà Lạt', 'Da Lat Market'),
    ('Ga Đà Lạt', 'Da Lat Railway Station'),
    ('Dinh Bảo Đại', 'Bao Dai Palace'),
    ('Thác Datanla', 'Datanla Waterfall'),
    ('Thác Prenn', 'Prenn Waterfall'),
    ('Thác Pongour', 'Pongour Waterfall'),
    ('Thác Cam Ly', 'Cam Ly Waterfall'),
    ('Hồ Tuyền Lâm', 'Tuyen Lam Lake'),
    ('Hồ Than Thở', 'Lake of Sighs'),
    ('Đỉnh Langbiang', 'Langbiang Peak'),
    ('Núi Langbiang', 'Langbiang Mountain'),
    ('Thiền viện Trúc Lâm', 'Truc Lam Zen Monastery'),
    ('Đồi Robin', 'Robin Hill'),
    ('Thung Lũng Tình Yêu', 'Valley of Love'),
    ('Thung lũng Tình Yêu', 'Valley of Love'),
    ('Đường Hầm Điêu Khắc', 'Sculpture Tunnel'),
    ('Nhà thờ Con Gà', 'Rooster Church'),
    ('Đèo Prenn', 'Prenn Pass'),
    ('Đỉnh LangBiang', 'Langbiang Peak'),
    ('Chợ Đêm Đà Lạt', 'Da Lat Night Market'),
    ('Vườn Hoa Thành Phố', 'City Flower Garden'),
    ('Crazy House', 'Crazy House'),
    ('Cầu Đất', 'Cau Dat'),
    ('Cầu Đất Farm', 'Cau Dat Farm'),
    
    # More phrases
    ('Vẻ đẹp', 'The Beauty of'),
    ('vẻ đẹp', 'beauty'),
    ('cổ kính', 'ancient'),
    ('cổ điển', 'classic'),
    ('biểu tượng', 'icon/symbol'),
    ('Biểu tượng', 'Icon'),
    ('trăm năm', 'century-old'),
    ('nổi bật', 'prominent'),
    ('đặc sắc', 'distinctive'),
    ('độc đáo', 'unique'),
    ('tuyệt đẹp', 'stunning'),
    ('tuyệt vời', 'wonderful'),
    ('ngoạn mục', 'spectacular'),
    ('hùng vĩ', 'majestic'),
    ('ấn tượng', 'impressive'),
    ('lý tưởng', 'ideal'),
    ('hoàn hảo', 'perfect'),
    ('phù hợp', 'suitable'),
    ('thuận tiện', 'convenient'),
    ('phong phú', 'diverse'),
    ('đa dạng', 'diverse'),
    
    # Action phrases
    ('Bạn có thể', 'You can'),
    ('bạn có thể', 'you can'),
    ('Bạn nên', 'You should'),
    ('bạn nên', 'you should'),
    ('đừng quên', "don't forget"),
    ('Đừng quên', "Don't forget"),
    ('đừng bỏ lỡ', "don't miss"),
    ('Đừng bỏ lỡ', "Don't miss"),
    ('hãy ghé', 'do visit'),
    ('Hãy ghé', 'Do visit'),
    ('nên ghé', 'should visit'),
    ('ghé thăm', 'visit'),
    ('tận hưởng', 'enjoy'),
    ('cảm nhận', 'feel/experience'),
    
    # Connectors / transitions
    ('Ngoài ra', 'In addition'),
    ('ngoài ra', 'in addition'),
    ('Bên cạnh đó', 'Besides that'),
    ('bên cạnh đó', 'besides that'),
    ('Đặc biệt', 'Especially'),
    ('đặc biệt', 'especially'),
    ('Tuy nhiên', 'However'),
    ('tuy nhiên', 'however'),
    ('Vì vậy', 'Therefore'),
    ('vì vậy', 'therefore'),
    ('Theo đó', 'Accordingly'),
    ('Không chỉ', 'Not only'),
    ('không chỉ', 'not only'),
    ('mà còn', 'but also'),
    ('Chính vì thế', "That's why"),
    ('Với', 'With'),
    
    # Numbers/measurements
    ('người lớn', 'adults'),
    ('trẻ em', 'children'),
    ('người', 'people'),
    ('phút', 'minutes'),
    ('giờ', 'hours'),
    ('km', 'km'),
    ('mét', 'meters'),
    
    # Quality/description
    ('chất lượng', 'quality'),
    ('dịch vụ', 'service'),
    ('phục vụ', 'service'),
    ('nhân viên', 'staff'),
    ('thân thiện', 'friendly'),
    ('nhiệt tình', 'enthusiastic'),
    ('chuyên nghiệp', 'professional'),
    ('sạch sẽ', 'clean'),
    ('rộng rãi', 'spacious'),
    ('tiện nghi', 'amenities'),
    ('sang trọng', 'luxurious'),
    ('hiện đại', 'modern'),
    ('truyền thống', 'traditional'),
    ('dân dã', 'rustic'),
    
    # Seasons/time
    ('mùa hè', 'summer'),
    ('mùa đông', 'winter'),
    ('mùa mưa', 'rainy season'),
    ('mùa khô', 'dry season'),
    ('mùa hoa', 'flower season'),
    ('Tết', 'Tet (Lunar New Year)'),
    ('lễ hội', 'festival'),
    ('cuối năm', 'end of year'),
    ('đầu năm', 'beginning of year'),
    
    # Closing / CTA
    ('Chúc bạn', 'Wish you'),
    ('chuyến du lịch', 'travel journey'),
    ('những kỷ niệm đẹp', 'beautiful memories'),
    ('trọn vẹn', 'complete/perfect'),
]

def translate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for vn, en in WAVE2:
        if vn != en:
            content = content.replace(vn, en)
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        vn_count = len(re.findall(r'[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]', content))
        return True, vn_count
    return False, 0

def main():
    blog_dir = 'blog'
    count = 0
    for fn in sorted(os.listdir(blog_dir)):
        if fn.endswith('-en.html'):
            fp = os.path.join(blog_dir, fn)
            changed, vn = translate_file(fp)
            if changed:
                count += 1
    
    # Also translate main EN pages
    for fn in ['en.html', 'about-en.html', 'about-us-en.html', 'menu-en.html', 'blog-en.html']:
        if os.path.exists(fn):
            changed, _ = translate_file(fn)
            if changed:
                count += 1
    
    print(f"Wave 2: Translated {count} files.")
    
    # Show remaining stats
    remaining = []
    for fn in sorted(os.listdir(blog_dir)):
        if fn.endswith('-en.html'):
            fp = os.path.join(blog_dir, fn)
            with open(fp, 'r', encoding='utf-8') as f:
                c = f.read()
            vn = len(re.findall(r'[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]', c))
            if vn > 0:
                remaining.append((fn[:55], vn))
    
    remaining.sort(key=lambda x: -x[1])
    total_vn = sum(v for _, v in remaining)
    print(f"\nTotal remaining VN chars across all blog EN files: {total_vn}")
    print(f"Files with remaining VN text: {len(remaining)}")

if __name__ == '__main__':
    main()
