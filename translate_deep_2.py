import os
import re

about_us_map = {
    # Text in about-us-en.html
    r"THE STORY của chúng tôi": "Our Story",
    r"THE STORY Xóm Lèo – Quán Nướng Đà Lạt Với View Đẹp Nhất Trại Mát": "The Story of Xom Leo – Da Lat BBQ with the Best Valley View",
    r"Ẩn mình bên sườn đồi lộng gió, Xóm Lèo không chỉ bán thịt nướng\. Chúng tôi mang đến cho bạn một bản giao hưởng của sương mù, than hồng, và ánh hoàng hôn rực rỡ nhất Đà Lạt\.": "Tucked away on a windy hillside, Xom Leo offers more than just BBQ. We bring you a symphony of mist, glowing charcoal, and the most vibrant sunsets in Da Lat.",
    r"Chạm vào <span class=\"text-primary\">cảm xúc</span>, <br/>thức tỉnh vị giác\.": "Touch your <span class=\"text-primary\">emotions</span>, <br/>awaken your taste buds.",
    r"Đà Lạt có muôn vàn quán nướng, nhưng Xóm Lèo chọn cho mình một lối đi rất riêng\. Đó là nơi bạn có thể vừa đảo miếng bò tảng trên vỉ than lép bép, vừa ngước nhìn bầu trời đỏ ối dần buông\.": "Da Lat has countless BBQ spots, but Xom Leo carves its own unique path. It's a place where you can grill sizzling beef while gazing up at the fiery sunset sky.",
    r"Giữa cái se lạnh của phố núi, không gì sưởi ấm lòng người nhanh bằng một ngọn lửa hồng và những người bạn tri kỷ nâng ly cạn nốt\. Chúng tôi thiết kế Không Gian mở hoàn toàn, đảm bảo dù bạn ngồi ở góc nào, &quot;View xe lửa&quot; và thung lũng đêm lấp lánh nhà lồng vẫn trọn vẹn trong tầm mắt\.": "In the chilly mountain air, nothing warms the heart faster than a glowing fire and true friends raising a toast. Our completely open-space design ensures that no matter where you sit, the \"Train View\" and the glittering greenhouse valley remain perfectly in sight.",
    r"5\+": "5+",
    r">Năm phục vụ<": ">Years of service<",
    r"1M\+": "1M+",
    r">Lượt khách ghé thăm<": ">Visitors<",
    r"Điều Gì Trữ Tình Nên Xóm Lèo\?": "What Makes Xom Leo So Poetic?",
    r"Không chỉ là nơi dừng chân, đây là chốn nương tựa của những tâm hồn đồng điệu\.": "Not just a stopover, this is a sanctuary for kindred spirits.",
    r"View Panorama Cực Đỉnh": "Stunning Panoramic View",
    r"Thu trọn thung lũng Trại Mát vào tầm mắt\. Góc đón hoàng hôn đẹp nhất nhì Đà Lạt\.": "Take in the entire Trai Mat valley. One of the best sunset spots in Da Lat.",
    r"Thịt Tảng Thượng Hạng": "Premium Quality Meats",
    r"Ướp đẫm sốt độc quyền, thịt mềm mọng nước xèo xèo trên lửa than hồng rực\.": "Marinated in our exclusive sauce, tender and juicy meats sizzle over red-hot charcoal.",
    r"Chăm Sóc Chu Đáo": "Attentive Service",
    r"Nhân viên thân thiện, hỗ trợ nướng tại bàn\. Miễn phí setup bàn tiệc sinh nhật lãng mạn\.": "Friendly staff with table-side grilling. Free romantic birthday table setup.",
    r"Góc Sống Ảo Triệu View": "Million-View Photo Spots",
    r"Đến Xóm Lèo, không lo thiếu ảnh đẹp mang về\.": "At Xom Leo, you'll never run out of beautiful photos to take home.",
    r"Trải Nghiệm Hoàn Mỹ": "Perfect Experience",
    r"Sẵn sàng để Xóm Lèo chiều chuộng bạn chưa\?": "Ready to let Xom Leo pamper you?",
    r"Bạn Đã Sẵn Sàng Trải Nghiệm\?": "Are You Ready To Experience It?",
    r"Đừng lỡ hẹn với chiều hoàng hôn đẹp nhất Đà Lạt\. Đặt bàn ngay hôm nay để nhận ngay vị trí view xuất sắc nhất\.": "Don't miss the most beautiful sunset in Da Lat. Book a table today to secure the best view.",
    r"Book a Table, Xóm Lèo Chờ!": "Book a Table, Xom Leo is Waiting!"
}

blog_map = {
    # Article 1
    "Khám phá thác Datanla Đà Lạt: Thiên đường phiêu lưu lý tưởng": "Discover Datanla Waterfall Da Lat: An Ideal Adventure Paradise",
    "Thác Datanla – điểm hẹn phiêu lưu giữa núi rừng Đà Lạt\. Trải nghiệm săn tàu lửa, thư giãn và thưởng thức món nướng tại Tiệm Nướng & Chill Xóm Lèo: 0764 527 336": "Datanla Waterfall – an adventure rendezvous amidst the mountains of Da Lat. Experience train hunting, relaxing, and enjoying BBQ at Tiem Nuong & Chill Xom Leo: 0764 527 336",
    # Article 2
    "Khám phá Hồ Than Thở Đà Lạt: Cảnh đẹp và trải nghiệm thú vị": "Discover Lake of Sighs Da Lat: Beautiful Scenery and Interesting Experiences",
    "Hồ Than Thở – điểm đến nên thơ giữa lòng Đà Lạt\. Thưởng thức món nướng, chill và trải nghiệm săn tàu lửa tại Tiệm Nướng & Chill Xóm Lèo: 0764 527 336\.": "Lake of Sighs – a poetic destination in the heart of Da Lat. Enjoy BBQ, chill, and experience train hunting at Tiem Nuong & Chill Xom Leo: 0764 527 336.",
    # Article 3
    "Khám phá Hồ Xuân Hương Đà Lạt kèm review chi tiết 2025": "Discover Xuan Huong Lake Da Lat with Detailed Review 2025",
    "Hồ Xuân Hương Đà Lạt – trái tim thơ mộng giữa lòng thành phố\. Dạo hồ, check-in lãng mạn, ăn ngon và ngắm xe lửa tại Tiệm Nướng & Chill Xóm Lèo: 0764 527 336\.": "Xuan Huong Lake Da Lat – the poetic heart of the city. Stroll around the lake, check-in romantically, eat deliciously, and watch trains at Tiem Nuong & Chill Xom Leo: 0764 527 336.",
    # Article 4
    "Ga xe lửa Đà Lạt – Góc sống ảo cổ kính bậc nhất Đà Lạt 2025": "Da Lat Railway Station – The Most Vintage Photo Spot in Da Lat 2025",
    "Ga xe lửa Đà Lạt – công trình cổ đẹp bậc nhất Đông Dương, điểm check-in không thể bỏ lỡ\. Thưởng thức món nướng tại Tiệm Nướng & Chill Xóm Lèo, gọi: 0764 527 336": "Da Lat Railway Station – one of the most beautiful ancient structures in Indochina, an unmissable check-in spot. Enjoy BBQ at Tiem Nuong & Chill Xom Leo, call: 0764 527 336",
    # Article 5
    "Kinh nghiệm tham quan Chùa Linh Phước Đà Lạt mới nhất 2026": "Latest Experience Visiting Linh Phuoc Pagoda Da Lat 2026",
    "Khám phá Chùa Linh Phước \(Chùa Ve Chai\) Đà Lạt: Kiến trúc khảm sành độc đáo, 18 tầng địa ngục kỳ bí và 11 kỷ lục Việt Nam\. Kinh nghiệm tham quan từ A-Z!": "Discover Linh Phuoc Pagoda (Bottle Pagoda) Da Lat: Unique ceramic mosaic architecture, the mysterious 18 levels of hell, and 11 Vietnam records. A-Z visiting experience!",
    # Article 6
    "Đèo Prenn – cung đường quyến rũ níu chân phượt thủ 2025": "Prenn Pass – The Charming Route that Captivates Backpackers 2025",
    "Trải nghiệm khám phá đèo Prenn Đà Lạt với khung cảnh thiên nhiên hùng vĩ, dừng chân tại Tiệm Nướng & Chill Xóm Lèo view tàu lửa cực chill\. Đặt bàn: 0764527336\.": "Experience exploring Prenn Pass Da Lat with majestic natural scenery, stop by Tiem Nuong & Chill Xom Leo with an ultra-chill train view. Book a table: 0764527336.",
    # Article 7
    "Đồi Robin – Ngắm toàn cảnh Đà Lạt mộng mơ từ trên cao 2025": "Robin Hill – Enjoy the Panoramic View of Dreamy Da Lat from Above 2025",
    "Đồi Robin Đà Lạt – điểm đến lý tưởng để săn mây, ngắm cảnh từ cáp treo xuyên rừng\. Kết thúc hành trình, ghé Tiệm Nướng & Chill Xóm Lèo để thưởng thức bữa tối ấm cúng\.": "Robin Hill Da Lat – an ideal destination for cloud hunting and sightseeing from the forest cable car. End the journey by visiting Tiem Nuong & Chill Xom Leo for a cozy dinner.",
    # Article 8
    "Đi ăn ở Đà Lạt\? Ghé Tiệm Nướng & Chill Xóm Lèo nhé!": "Eating out in Da Lat? Stop by Tiem Nuong & Chill Xom Leo!",
    "Đi ăn ở Đà Lạt chill tại Xóm Lèo: setup miễn phí, ngắm hoàng hôn, săn xe lửa, nghe saxophone\. Đặt bàn ngay: 076\.45\.27\.336 – số lượng chỗ có hạn!": "Eat out in Da Lat chilling at Xom Leo: free setup, watch sunsets, hunt trains, listen to saxophone. Book a table now: 076.45.27.336 – limited seats!",
    # Article 9
    "Tiệm nướng Đà Lạt được yêu thích, nơi lý tưởng để chill": "Beloved Da Lat BBQ spot, the ideal place to chill",
    "Tiệm Nướng & Chill Xóm Lèo – tiệm nướng Đà Lạt ngon, không gian chill, phục vụ thân thiện, giá hợp lý, điểm đến lý tưởng cho bạn bè tụ họp\.": "Tiem Nuong & Chill Xom Leo – delicious Da Lat BBQ, chill space, friendly service, reasonable prices, an ideal destination for friends gathering.",
    # Article 10
    "Quán nướng Đà Lạt nhất định phải thử khi du lịch đến đây": "The Da Lat BBQ spot you must try when traveling here",
    "Quán nướng Đà Lạt ngon và chill\? Tiệm Nướng & Chill Xóm Lèo là điểm đến lý tưởng với món ngon khó cưỡng và không gian ấm cúng khiến bạn mê mẩn!": "Delicious and chill Da Lat BBQ? Tiem Nuong & Chill Xom Leo is an ideal destination with irresistible delicacies and a cozy space that will mesmerize you!",
    # Article 11
    "8/3 – Lên kèo đến Tiệm Nướng & Chill Xóm Lèo: Trốn phố, chạm bình yên": "March 8th – Plan a Trip to Tiem Nuong & Chill Xom Leo: Escape the City, Touch Peace",
    "Xóm Lèo Đà Lạt là điểm dừng chân lý tưởng cho ai yêu thích sự bình yên, muốn tránh xa phố thị\. Đừng quên ghé Tiệm Nướng & Chill Xóm Lèo để thưởng thức món nướng ngon giữa núi rừng\. Sẵn sàng cho chuyến đi đầy trải nghiệm chưa\? Lên kèo thôi! 🎒": "Xom Leo Da Lat is an ideal stop for those who love peace and want to escape the city. Don't forget to visit Tiem Nuong & Chill Xom Leo to enjoy delicious BBQ amidst the mountains. Ready for an experiential trip? Let's go! 🎒",
    # Article 12
    "Dalat Fairytale Land 2025 - Bỏ túi kinh nghiệm vui chơi": "Dalat Fairytale Land 2025 - Pocket Play Experience",
    "Dalat Fairytale Land là điểm đến cổ tích đầy kỷ niệm\. Đừng quên ghé Tiệm Nướng & Chill Xóm Lèo để thưởng thức món ngon và chill giữa lòng Đà Lạt!": "Dalat Fairytale Land is a fairyland destination full of memories. Don't forget to visit Tiem Nuong & Chill Xom Leo to enjoy delicious food and chill in the heart of Da Lat!",
    # Article 13
    "Hồ Tuyền Lâm – thiên đường thơ mộng giữa núi rừng Đà Lạt": "Tuyen Lam Lake – A poetic paradise amidst Da Lat's mountains",
    "Hồ Tuyền Lâm là hồ nước thơ mộng giữa lòng Đà Lạt, nổi bật với cảnh sắc thiên nhiên hữu tình, không khí trong lành và nhiều hoạt động khám phá hấp dẫn cho du khách\.": "Tuyen Lam Lake is a poetic lake in the heart of Da Lat, standing out with its charming natural scenery, fresh air, and many attractive activities for tourists.",
    # Article 14
    "Quảng trường Lâm Viên - Biểu tượng độc đáo giữa lòng Đà Lạt": "Lam Vien Square - A unique symbol in the heart of Da Lat",
    "Quảng trường Lâm Viên Đà Lạt – điểm check-in nổi bật, kiến trúc ấn tượng, view hồ Xuân Hương đẹp, thu hút đông đảo du khách ghé thăm\.": "Lam Vien Square Da Lat – an outstanding check-in spot, impressive architecture, beautiful Xuan Huong Lake view, attracting many tourists.",
    # Article 15
    "Cổng Trời Bali Đà Lạt – Góc sống ảo đẹp tựa Bali hot 2025": "Bali Heaven Gate Da Lat – A Bali-like photo spot hot in 2025",
    "Góc sống ảo đẹp tựa Bali giữa lòng Đà Lạt 2025\. Trải nghiệm cổng trời ảo diệu, chụp hình cực chất\.": "A Bali-like photo spot in the heart of Da Lat 2025. Experience the magical heaven gate and take awesome cinematic photos.",
    # Article 16
    "Cây cô đơn Đà Lạt – Điểm check-in nổi rần rần 2025": "Lonely Pine Tree Da Lat – A extremely popular check-in spot in 2025",
    "Cây cô đơn Đà Lạt – biểu tượng thơ mộng giữa đồi thông\. Đừng quên check-in ngay khi ghé qua và kết thúc ngày dài tại Tiệm Nướng & Chill Xóm Lèo\.": "Lonely Pine Tree Da Lat – a poetic symbol amidst the pine hills. Don't forget to check in when you drop by and end the long day at Tiem Nuong & Chill Xom Leo.",
    
    # Missing from before
    "Chạm vào cảm xúc, thức tỉnh vị giác": "Touch your emotions, awaken your taste buds",
    "Năm phục vụ": "Years of service",
    "Lượt khách ghé thăm": "Visitors",
    "Điều Gì Trữ Tình Nên Xóm Lèo?": "What Makes Xom Leo So Poetic?",
    "Không chỉ là nơi dừng chân, đây là chốn nương tựa của những tâm hồn đồng điệu": "Not just a stopover, this is a sanctuary for kindred spirits",
    "Trải Nghiệm Hoàn Mỹ": "Perfect Experience",
    "Góc Sống Ảo Triệu View": "Million-View Photo Spots",
    "Bạn Đã Sẵn Sàng Trải Nghiệm?": "Are You Ready To Experience It?",
    "Book a Table, Xóm Lèo Chờ!": "Book a Table, Xom Leo is Waiting!"
}

def convert_to_regex(text):
    if text.startswith(r'>') or text.startswith(r'"') or text.startswith(r'.*') or text.startswith(r'^') or '\\' in text:
        return text
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
            print(f"Failed pattern {pattern}: {e}")
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Translated {filepath}")


translate_content('blog-en.html', blog_map)
translate_content('about-us-en.html', about_us_map)
