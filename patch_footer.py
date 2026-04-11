import os
import re
import glob

missing_map = {
    r">\s*Giữ Chỗ / Đặt Bàn\s*<": ">Reserve / Book Table<",
    r">\s*Đặt bàn\s*<": ">Book Table<",
    r"Wonderland Đà Lạt – khu vui chơi giữa thiên nhiên thơ mộng\. Thưởng thức món nướng, ngắm view tàu lửa tại Tiệm Nướng & Chill Xóm Lèo\. Đặt bàn ngay: 0764 527 336": "Wonderland Da Lat – a dreamy amusement park amidst nature. Enjoy BBQ and a train view at Tiem Nuong & Chill Xom Leo. Book a table now: 0764 527 336",
    r"Thung Lũng Tình Yêu Đà Lạt – biểu tượng lãng mạn không thể lỡ 2025": "Valley of Love Da Lat – An unmissable romantic symbol in 2025",
    r"Thung lũng Tình Yêu Đà Lạt – biểu tượng lãng mạn vĩnh cửu\. Check-in để lưu giữ kỷ niệm và kết thúc trọn vẹn tại Tiệm Nướng & Chill Xóm Lèo\.": "Valley of Love Da Lat – the eternal symbol of romance. Check in to save memories and perfectly end your day at Tiem Nuong & Chill Xom Leo.",
    r"Review Nông Trại Chó Puppy Farm Đà Lạt Mới Nhất 2025": "Latest Review of Puppy Farm Da Lat 2025",
    r"Thú cưng đáng yêu, vườn hoa rực rỡ và nông sản sạch tại Puppy Farm Đà Lạt\. Kết thúc hành trình bằng món nướng cực chill tại Xóm Lèo\. Đặt bàn ngay!": "Adorable pets, vibrant flower gardens, and clean farm produce at Puppy Farm Da Lat. End the journey with ultra chill BBQ at Xom Leo. Book a table now!",
    r"Khám Phá Dinh 1 Đà Lạt – Dấu Ấn Lịch Sử Giữa Lòng Phố Núi": "Discover Palace 1 Da Lat – A Historical Mark in the Mountain Town",
    r"Khám phá Dinh 1 Đà Lạt – công trình kiến trúc Pháp ấn tượng\. Đừng quên kết hợp cùng trải nghiệm ẩm thực view hoàng hôn tại Tiệm Nướng Xóm Lèo\.": "Discover Palace 1 Da Lat – an impressive French architectural structure. Don't forget to combine it with a sunset view dining experience at Tiem Nuong Xom Leo."
}

files = glob.glob('*-en.html')

for fname in files:
    with open(fname, 'r', encoding='utf-8') as f:
        html = f.read()
    
    for vi_str, en_str in missing_map.items():
        try:
            html = re.sub(vi_str, en_str, html, flags=re.IGNORECASE)
        except Exception as e:
            print(f"Failed pattern {vi_str}: {e}")
            
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Patched translations in {fname}")
