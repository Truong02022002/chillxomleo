import os
import re

menu_map = {
    # Menu strings
    "The Menu Tinh Hoa": "The Essence Menu",
    "The Menu Quán Nướng Đà Lạt – BBQ Than Hồng & Lẩu Cá Tầm Xóm Lèo": "Da Lat BBQ Menu – Charcoal BBQ & Sturgeon Hotpot Xom Leo",
    r"Tất\s*Cả": "All",
    r'"Tất Cả"': '"All"',
    r'"BBQ Nướng Tại Bàn"': '"Table BBQ"',
    r'>BBQ\s*Nướng Tại Bàn<': '>Table BBQ<',
    r'"Món Ăn Kèm"': '"Side Dishes"',
    r'>Món\s*Ăn Kèm<': '>Side Dishes<',
    r'"No Cái Bụng"': '"Hearty Meals"',
    r'>No\s*Cái Bụng<': '>Hearty Meals<',
    r'"Lai Rai"': '"Bar Snacks"',
    r'>Lai\s*Rai<': '>Bar Snacks<',
    r'"Trà Lạnh"': '"Iced Tea"',
    r'>Trà\s*Lạnh<': '>Iced Tea<',
    r'"Trà Nóng"': '"Hot Tea"',
    r'>Trà\s*Nóng<': '>Hot Tea<',
    r'"Nước"': '"Water"',
    r'>Nước<': '>Water<',
    
    "Best seller đặc biệt": "Special Best Seller",
    "Thịt bò mỹ thượng hạng": "Premium US Beef",
    "Đậm đà tươi ngon": "Rich and fresh",
    "Đặc sản truyền thống": "Traditional specialty",
    "Cá tầm tươi Đơn Dương": "Fresh Don Duong Sturgeon",
    "Cá tầm rang muối ớt": "Salt & Chili Roasted Sturgeon",
    "Đỉnh cao tháp sườn cay": "Spicy Rib Tower Masterpiece",
    "Tôm tươi sốt trứng muối béo ngậy": "Fresh shrimp with rich salted egg sauce",
    "Thơm nức mũi dòn da": "Fragrant and crispy skin",
    "Ướp chuẩn vị Hàn": "Korean-style marinated",
    "Sườn que ướp vị mật ong": "Honey glazed ribs",
    "Lai rai cực đỉnh": "Ultimate top-tier snacks",
    "Mái vị vàng": "Golden crispy perfection",
    "Ếch đồng tươi": "Fresh field frogs",
    "Dinh dưỡng ngon ngọt": "Nutritious and sweet",
    "Mực ống giòn ngọt": "Sweet & crunchy cuttlefish",
    "Tôm tươi rói nhảy múa": "Dancing fresh shrimp",
    "Bạch tuộc đại dương": "Ocean octopus",
    "Giòn rụm đậm vị": "Crispy and flavorful",
    "Kèm tương ớt cay nồng": "Served with spicy chili sauce",
    "Món phụ ngọt nhẹ": "Light sweet side dish",
    "Rau củ Đà Lạt tươi sạch": "Fresh Da Lat vegetables",
    "Hương vị dân dã": "Rustic flavor",
    "Mực tôm hoà quyện": "Shrimp & squid harmony",
    "Sợi mì dai ngon": "Delicious chewy noodles",
    "Bò mềm ngọt vị": "Sweet and tender beef",
    "Tinh tuý Phú Yên giữa lòng Đà LẠt": "Phu Yen essence in Da Lat",
    "Chua cay thập cẩm": "Mixed sour and spicy",
    "Đặc sản Đà Lạt không thể bỏ qua": "A must-try Da Lat specialty",
    "Dai dòn": "Chewy & crispy",
    "Thơm nức xóm": "Aroma that fills the neighborhood",
    "Bò mềm, sốt đậm đà": "Tender beef, rich sauce",
    "Đậu hũ non mát lạnh": "Cool silken tofu",
    "Chua ngọt đưa miệng": "Sweet & sour appetizer",

    # Titles and names 
    "Ba Chỉ Bò Nướng Muối Tiêu": "Salt & Pepper Grilled Beef Belly",
    "Ba Chỉ Cuộn Nấm Kim Châm": "Beef Belly Enoki Rolls",
    "Ốc Nhồi Thịt": "Stuffed Snails with Meat",
    "Cá Tầm Lúc Lắc": "Shaking Sturgeon",
    "Cá Tầm Rang Muối": "Salt Roasted Sturgeon",
    "Sườn Cay Thái Lan": "Thai Spicy Ribs",
    "Tôm Chiên Trứng Muối": "Salted Egg Fried Shrimp",
    "Ba Chỉ Heo Nướng Ngũ Vị": "Five-Spice Grilled Pork Belly",
    "Ba Chỉ Heo Hàn Quốc": "Korean Grilled Pork Belly",
    "Sườn Que Nướng": "Grilled Ribs",
    "Chân Gà Nướng Muối Ớt": "Chili Salt Grilled Chicken Feet",
    "Cánh Gà Nướng Muối Ớt": "Chili Salt Grilled Chicken Wings",
    "Ếch Nướng Muối Ớt": "Chili Salt Grilled Frogs",
    "Cá Tầm Nướng": "Grilled Sturgeon",
    "Mực Nướng Muối Ớt": "Chili Salt Grilled Cuttlefish",
    "Tôm Nướng Muối Ớt": "Chili Salt Grilled Shrimp",
    "Bạch Tuộc Nướng": "Grilled Octopus",
    "Chả Ram Tôm Đất": "Shrimp Spring Rolls",
    "Khoai Tây Chiên": "French Fries",
    "Khoai Lang Kén": "Sweet Potato Fries",
    "Salad Trộn Dầu Giấm": "Vinaigrette Salad",
    "Cơm Chiên Cao Nguyên": "Highland Fried Rice",
    "Cơm Chiên Hải Sản": "Seafood Fried Rice",
    "Mì Xào Hải Sản": "Seafood Fried Noodles",
    "Mì Xào Bò": "Beef Fried Noodles",
    "Lẩu Hải Sản": "Seafood Hotpot",
    "Lẩu Cá Tầm": "Sturgeon Hotpot",
    "Xúc Xích Đức Nướng": "Grilled German Sausage",
    "Ếch Chiên Nước Mắm": "Fish Sauce Fried Frogs",
    "Bò Lúc Lắc": "Shaking Beef",
    "Bò Tảng Nướng Phô Mai Trứng Muối": "Block Beef BBQ with Salted Egg Cheese",
}

blog_map = {
    # Blog strings
    r'>Tin Tức<': '>News<',
    r'"Tin Tức"': '"News"',
    r'>Sự Kiện<': '>Events<',
    r'"Sự Kiện"': '"Events"',
    "TIN TỨC GẦN ĐÂY": "LATEST NEWS",
    "ƯU ĐÃI & Sự KIỆN": "OFFERS & EVENTS",
    "Nhật ký Xóm Lèo": "Xom Leo Diary",
    "Blog Quán Nướng Đà Lạt – Nhật Ký Xóm Lèo & Ưu Đãi Đặc Biệt": "Da Lat BBQ Blog – Xom Leo Diary & Special Offers",
    r'placeholder="Tìm kiếm bài viết..."': 'placeholder="Search articles..."',
    r'aria-label="Xóa tìm kiếm"': 'aria-label="Clear search"',
    "Đọc Bài Viết": "Read Article",
    "Quán nướng Đà Lạt view xe lửa – Địa điểm chill buổi tối 2026": "Da Lat BBQ with Train View – The Best Chill Spot in 2026",
    "Tìm quán nướng Đà Lạt view xe lửa, không gian chill\? Xem gợi ý địa điểm phù hợp cho nhóm bạn, cặp đôi và trải nghiệm ăn tối lý tưởng\.": "Looking for a Da Lat BBQ with a train view and chill space? Discover the perfect spot for groups, couples, and an ideal dinner experience.",
    "Đà Lạt 2026: Cẩm nang du lịch và tọa độ \"chill\" nên thử": "Da Lat 2026: Travel Guide and \"Chill\" Coordinates to Try",
    "Khám phá vẻ đẹp Đà Lạt 2026 và trải nghiệm ẩm thực tuyệt vời tại Tiệm Nướng Trạm Dừng Chill - nơi ngắm thung lũng đẹp nhất phố núi\.": "Discover the beauty of Da Lat in 2026 and experience wonderful cuisine at Tiem Nuong Chill Stop - the best place to view the valley in the mountain town.",
    "Khám phá Cao đẳng Sư phạm Đà Lạt – Kiến trúc cổ ấn tượng": "Explore Da Lat Pedagogical College – Impressive Ancient Architecture",
    "Trường Cao đẳng Sư phạm Đà Lạt – điểm check-in kiến trúc Pháp giữa phố núi\. Kết thúc hành trình với view tàu lửa tại Tiệm Nướng & Chill Xóm Lèo: 0764 527 336": "Da Lat Pedagogical College – a French architecture check-in point in the mountain town. End the journey with a train view at Tiem Nuong & Chill Xom Leo: 0764 527 336",
    # Dates
    r">(\d{1,2})/(0?[1-9]|1[0-2])/(\d{4})<": r">\2/\1/\3<",
}

about_us_map = {
    "Về Chúng Tôi": "About Us",
    "Câu chuyện của Xóm Lèo": "The Story of Xom Leo",
    "TỪ MỘT NGỌN ĐỒI HOANG\.\.\.": "FROM A WILD HILL...",
    "Từ Một Ngọn Đồi Hoang": "From A Wild Hill",
    "Nhiều năm trước, khu vực Huỳnh Tấn Phát \(Phường 11\) chỉ là một ngọn đồi vắng vẻ, ít người qua lại": "Years ago, the Huynh Tan Phat area (Ward 11) was just a quiet, deserted hill.",
    "Chỉ có những người dân địa phương mới biết đến vị trí này - một nơi có tầm nhìn bao quát toàn bộ thung lũng Trại Mát, nơi mặt trời lặn xuống đỏ rực mỗi buổi chiều, và cũng là nơi bạn có thể nhìn thấy trọn vẹn những chuyến tàu ga Trại Mát chạy xình xịch ngang qua\.": "Only locals knew of this spot - a place with a panoramic view of the entire Trai Mat valley, where the sun sets deep red every afternoon, and where you can see the historic trains from Trai Mat station rumbling past.",
    "CHUYẾN TÀU CỦA THANH XUÂN VÀ KÝ ỨC": "THE TRAIN OF YOUTH AND MEMORIES",
    "Chúng tôi, những người trẻ yêu Đà Lạt, đã tình cờ dừng chân tại ngọn đồi này trong một buổi chiều lộng gió\. Khi hoàng hôn buông xuống, nhuộm vàng cả thung lũng, và tiếng còi tàu vang lên từ xa, một cảm giác bình yên đến lạ kỳ ùa về\.": "We, young people deeply in love with Da Lat, accidentally stumbled upon this hill on a windy afternoon. As sunset fell, painting the valley gold, and the whistle of a train echoed from afar, a profound sense of peace washed over us.",
    "Giây phút ấy, chúng tôi biết mình phải tạo ra một không gian để chia sẻ khoảnh khắc tuyệt diệu này với mọi người, một trạm dừng chân cho những tâm hồn mỏi mệt tìm về sự tĩnh lặng\.": "At that moment, we knew we had to create a space to share this magical experience with everyone—a resting stop for weary souls seeking tranquility.",
    "KHÔNG CHỈ LÀ THƯỞNG THỨC ẨM THỰC": "MORE THAN JUST DINING",
    "Tiệm Nướng & Chill Xóm Lèo ra đời không đơn thuần chỉ là một quán ăn, mà là một trải nghiệm trọn vẹn\.": "Tiem Nuong & Chill Xom Leo was born not just as a restaurant, but as a complete immersive experience.",
    "Bạn đến đây để thưởng thức những miếng bò tảng nướng phô mai xèo xèo trên bếp than hồng, xì xụp bên nồi lẩu cá tầm nghi ngút khói giữa tiết trời se lạnh\. Nhưng bạn cũng đến đây để hít hà mùi thông, ngắm nhìn thung lũng lên đèn lấp lánh như ngàn vì sao khi đêm xuống, và để lưu giữ lại những tấm ảnh hoài niệm bên đoàn tàu cổ kính\.\.\.": "You come here to savor sizzling cheese beef blocks on a charcoal grill, to slurp hot sturgeon hotpot in the chilly weather. But you also come here to breathe in the pine scent, gaze at the glowing valley like a thousand stars falling to earth, and capture nostalgic photos alongside the vintage train...",
    "Với phương châm &quot;Tận tâm từ những điều nhỏ nhất&quot;, mỗi nguyên liệu tại Xóm Lèo đều được tuyển chọn kỹ lưỡng mỗi ngày\. Rau củ thu hoạch từ các nông trại sạch ở Đà Lạt, các loại thịt và hải sản luôn đảm bảo độ tươi mới nhất\.": "With the motto \"Devoted to the smallest details\", every ingredient at Xom Leo is carefully selected daily. Vegetables are sourced from clean farms in Da Lat, and meats and seafood are guaranteed to be the freshest.",
    "Chúng tôi mong muốn mỗi thực khách khi đến với Xóm Lèo không chỉ no bụng mà còn ra về với một trái tim tràn ngập niềm vui và một tâm hồn đã được &quot;chữa lành&quot;\.": "We hope every guest visiting Xom Leo not only leaves with a full stomach but also a heart full of joy and a completely \"healed\" soul.",
    "Hãy đến, ngồi xuống, gọi đồ ăn, rót một ly rượu nồng và cùng Xóm Lèo tạo nên những kỷ niệm khó quên bạn nhé!": "Come, take a seat, order some food, pour a rich glass of wine, and let's create unforgettable memories together at Xom Leo!",
    "TRẠI MÁT, ĐÀ LẠT": "TRAI MAT, DA LAT",
    "CÂU CHUYỆN": "THE STORY",
}

def convert_to_regex(text):
    if text.startswith(r'>') or text.startswith(r'"') or text.startswith(r'.*') or text.startswith(r'^') or '\\' in text:
        return text # Already a regex or strict pattern
    else:
        words = text.split()
        return r'\s+'.join([re.escape(w) for w in words])

def translate_content(filepath, text_map):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    for vi_str, en_str in text_map.items():
        pattern = convert_to_regex(vi_str)
        try:
            html = re.sub(pattern, en_str, html, flags=re.IGNORECASE)
        except Exception as e:
            print(f"Failed regex: {pattern}")
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Translated {filepath}")


translate_content('menu-en.html', menu_map)
translate_content('blog-en.html', blog_map)
translate_content('about-us-en.html', about_us_map)
