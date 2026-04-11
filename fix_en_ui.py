"""
Fix all Vietnamese UI strings in English (-en.html / en.html) pages.
Group 1: Header, Footer, TOC, badges, buttons, labels.
"""
import os

# Replacement pairs: (Vietnamese, English)
REPLACEMENTS = [
    # --- HEADER / NAVBAR ---
    ('>Trang chủ</a>', '>Home</a>'),
    ('>Trải\n          nghiệm</a>', '>Experience</a>'),
    ('>Trải nghiệm</a>', '>Experience</a>'),
    ('>Trải\r\n          nghiệm</a>', '>Experience</a>'),
    ('>Về\r\n          chúng tôi</a>', '>About Us</a>'),
    ('>Về chúng tôi</a>', '>About Us</a>'),
    ('>Về\n          chúng tôi</a>', '>About Us</a>'),
    ('>Menu</a>', '>Menu</a>'),  # already English
    ('>Blog</a>', '>Blog</a>'),  # already English
    
    # --- MOBILE MENU ---
    ('>Trang chủ</a>\r\n', '>Home</a>\r\n'),
    ('>Trang chủ</a>\n', '>Home</a>\n'),
    
    # --- BOOKING BUTTON ---
    ('\n          Đặt bàn\n', '\n          Book a Table\n'),
    ('\r\n          Đặt bàn\r\n', '\r\n          Book a Table\r\n'),
    ('>Đặt bàn</a>', '>Book a Table</a>'),
    ('ĐẶT BÀN NGAY</a>', 'BOOK NOW</a>'),
    
    # --- FOOTER ---
    # Brand tagline
    ('Ẩn mình giữa đồi thông xanh ngát — chốn dừng chân của những tâm hồn tìm kiếm sự bình yên giữa cái lạnh Đà Lạt.',
     'Nestled among lush pine hills — a haven for souls seeking tranquility in the cool Da Lat breeze.'),
    
    # Footer section titles
    ('>Liên kết</h4>', '>Quick Links</h4>'),
    ('>Liên hệ</h4>', '>Contact</h4>'),
    ('>Bản đồ</h4>', '>Map</h4>'),
    
    # Footer links
    ('>Thực Đơn</a>', '>Menu</a>'),
    ('>Đặt bàn</a>', '>Book a Table</a>'),
    
    # Footer contact
    ('>Thời gian mở cửa</span>', '>Opening Hours</span>'),
    ('15:00 – 23:00 hàng ngày', '15:00 – 23:00 Daily'),
    ('>Địa chỉ</span>', '>Address</span>'),
    
    # Footer CTA button
    ('Giữ Chỗ / Đặt Bàn', 'Reserve / Book a Table'),
    
    # Footer map link
    ('>Xem đường đi</a>', '>Get Directions</a>'),
    ('Xem đường đi\r\n', 'Get Directions\r\n'),
    ('Xem đường đi\n', 'Get Directions\n'),
    ('\n            Xem đường đi\n', '\n            Get Directions\n'),
    ('\r\n            Xem đường đi\r\n', '\r\n            Get Directions\r\n'),
    
    # Copyright
    ('© 2026 Tiệm Nướng &amp; Chill Xóm Lèo. Đà Lạt, Việt Nam.',
     '© 2026 Tiệm Nướng &amp; Chill Xóm Lèo. Da Lat, Vietnam.'),
    
    # --- BLOG UI ---
    # TOC
    ('Mục lục bài viết', 'Table of Contents'),
    
    # Category badge
    ('>Tin Tức</span>', '>News</span>'),
    
    # Back to blog
    ('Quay lại Blog', 'Back to Blog'),
    ('Quay lại thẻ bài gốc', 'Back to Blog'),
    
    # Read article
    ('Đọc Bài Viết', 'Read Article'),
    
    # --- BOOKING FORM (en.html) ---
    # Section titles in booking area - be careful with context
]

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    changes = 0
    
    for vn, en in REPLACEMENTS:
        if vn in content and vn != en:
            count = content.count(vn)
            content = content.replace(vn, en)
            changes += count
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return changes
    return 0

def main():
    root = '.'
    en_files = []
    
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn.endswith('-en.html') or fn == 'en.html':
                en_files.append(os.path.join(dirpath, fn))
    
    en_files.sort()
    print(f"Processing {len(en_files)} English files...\n")
    
    total = 0
    for filepath in en_files:
        changes = fix_file(filepath)
        if changes > 0:
            total += changes
            print(f"  Fixed {changes} strings in {os.path.basename(filepath)}")
    
    print(f"\nDone! Fixed {total} Vietnamese UI strings across all English pages.")

if __name__ == '__main__':
    main()
