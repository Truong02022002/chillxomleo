import re

def robust_replace(filepath, mapping):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    for vn, en in mapping.items():
        # Escape regex but allow any whitespace between words
        pattern = r'\s+'.join(re.escape(w).replace(r'\-', '-') for w in vn.split())
        content, n = re.subn(pattern, en.replace('\\', r'\\'), content)
        if n == 0:
             print(f"FAILED to replace in {filepath}:\n'{vn}'")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Finished {filepath}")

# For da-lat-co-gi
repl_co_gi = {
    'Đà Lạt Có Gì - Top Địa Điểm Chill Tại Đà Lạt': "What's in Da Lat? – Top Chill Spots",
    'Đà Lạt là destination ideal cho những ai yêu thích sự bình yên, romantic. Nơi đây prominent với khí hậu chilly quanh năm, cảnh quan poetic và nền cuisine phong phú': 'Da Lat is the perfect destination for anyone seeking peace and romance. Famous for its year-round cool climate, poetic landscapes, and rich cuisine',
    'Giới thiệu về Đà Lạt': 'Introduction to Da Lat',
    'Top Địa điểm chill tại Đà Lạt': 'Top Chill Spots in Da Lat',
    'Hồ Tuyền Lâm': 'Tuyen Lam Lake',
    'Cánh đồng cối xay gió Langbiang': 'Langbiang Windmill Fields',
    'Nhà thờ Domain De Marie': 'Domain De Marie Church',
    'Kinh nghiệm du lịch Đà Lạt': 'Da Lat Travel Tips',
    'Đà Lạt – “Thành phố ngàn hoa”, famous for khí hậu chilly quanh năm, cảnh quan thiên nhiên stunning, là destination ideal cho những ai want to tìm kiếm một chút bình yên.': 'Da Lat – "The City of a Thousand Flowers" – is famous for its year-round cool climate and stunning natural scenery, making it the perfect destination for anyone seeking a little peace.',
    'Hãy cùng discover những location chill nhất mà you can\'t miss khi đến với nơi đây!': 'Let\'s explore the chillest spots you absolutely can\'t miss!',
    'được xem là “tiểu đồng bằng” giữa lòng Đà Lạt, nơi you can tham gia các hoạt động như chèo thuyền kayak, cắm trại bên hồ hay đơn giản là ngồi nhở nhắm nhí ly cà phê bên hồ.': 'is often called the "little countryside" in the heart of Da Lat, where you can enjoy activities like kayaking, lakeside camping, or simply sitting back with a coffee by the lake.',
    'Ngắm sunset trên những cánh đồng cối xay gió gợi nhớ hình ảnh đồng nắng châu Âu. You can lều trữ qua đêm tại đây và enjoy atmosphere tĩnh lặng, rest/relax.': 'Watching the sunset over these windmill-dotted fields evokes the sun-drenched landscapes of the European countryside. You can camp overnight here and soak in the peaceful, relaxing atmosphere.',
    'Cách city center khoảng 20km, Mê Linh Coffee Garden mang đến khung cảnh stunning với view trên cao bao quát thung lũng cà phê xanh mướt. Do enjoy một ly cà phê chồn lừng danh tại đây.': 'About 20km from the city center, Me Linh Coffee Garden offers a breathtaking hilltop view overlooking a lush green coffee valley. Don\'t miss the chance to try their famous weasel coffee here.',
    'not only là location tâm linh but also hút khách với lối kiến trúc Pháp unique, sắc hồng của tường nhà thờ rất “chill” dưới ánh chiều sunset.': 'isn\'t just a place of worship — it also captivates visitors with its unique French colonial architecture and pastel-pink walls that look incredibly "chill" under the sunset.',
    'Nếu muốn vừa enjoy món nướng ngon vừa chill giữa núi rừng Đà Lạt,': 'If you want to enjoy delicious BBQ while chilling amid Da Lat\'s mountain scenery,',
    'là lựa chọn ideal. Quán có view tàu sunset, nhà lồng lung linh về đêm, tạo atmosphere romantic, rest/relax.': 'is the perfect choice. The restaurant features sunset train views and twinkling greenhouse lights at night, creating a romantic and relaxing atmosphere.',
    'Nổi bật với': 'Known for its',
    'bò tảng đậm đà, ba chỉ bò kim châm, ba chỉ bò tiêu cay nồng, ốc nhồi thịt thơm ngon': 'rich grilled beef blocks, beef belly enoki rolls, peppery beef brisket, and savory stuffed snails',
    ', nơi đây mang đến trải nghiệm cuisine wonderful bên bếp lửa hồng trong cái lạnh Đà Lạt.': ', this place offers an incredible dining experience by the charcoal grill in Da Lat\'s cool mountain air.',
    'Especially, quán còn có trải nghiệm': 'A special highlight: the restaurant offers',
    '“test nhân phẩm” săn tàu đêm': 'a thrilling "night train spotting" experience',
    '—nếu may mắn, you will bắt gặp khoảnh khắc tàu chạy ngang trong ánh đèn vàng huyền ảo, một kỷ niệm đáng nhớ!': '—if you\'re lucky, you\'ll catch the magical moment when the train rolls past under the warm golden lights. A memory you won\'t forget!',
    'Bạn có thể đi Đà Lạt bằng xe khách, máy bay hoặc tự lái motorbike if you want trải nghiệm cung đường đồi núi.': 'You can reach Da Lat by bus, plane, or by riding a motorbike for an adventurous mountain road experience.',
    'Lựa chọn khách sạn, homestay:': 'Accommodation:',
    'Có nhiều homestay với view cực chill như The Kupid, Lá Nhà, Le Bleu…': 'There are many homestays with ultra-chill views, such as The Kupid, La Nha, Le Bleu, and more.',
    'Nhất định phải thử bầu nóng,': 'You absolutely must try the local specialties — clay-pot rice,',
    'chuẩn vị Đà Lạt, hãy ghé ngay': 'with authentic Da Lat flavors, head straight to',
    'để enjoy hương vị thơm ngon giữa atmosphere ấm cúng, chill hết nấc!': 'for an unforgettable meal in a cozy, incredibly chill atmosphere!',
    'Vậy Đà Lạt có gì? Nơi đây có vô số destination ideal dành cho những ai thích sự bình yên, romantic. If you want to enjoy không khí chilly và discover cuisine đặc trưng,': 'So, what does Da Lat have? This dreamy city offers countless destinations for those who love tranquility and romance. If you want to embrace the cool mountain air and discover unique cuisine,',
    'là lựa chọn perfect với': 'is the perfect pick with its',
    'và nhiều grilled dishes hấp dẫn. Ngồi bên bếp lửa hồng, enjoy món ngon giữa khung cảnh núi rừng chắc chắn sẽ là trải nghiệm đáng nhớ. Hãy lên kế hoạch ngay và enjoy một trip đầy cảm xúc!': 'and many irresistible grilled dishes. Sitting by the warm charcoal grill, savoring great food amid the mountain forest backdrop is guaranteed to be a memory you\'ll treasure forever. Start planning your trip today!'
}

robust_replace('blog/da-lat-co-gi-top-dia-diem-chill-tai-da-lat-en.html', repl_co_gi)

# For thien duong
repl_thien_duong = {
    'Giới Thiệu Về Đà Lạt': 'Introduction to Da Lat',
    'Những Địa Điểm Không Thể Bỏ Qua Khi Đến Với Đà Lạt': 'Must-Visit Spots in Da Lat',
    'Quảng Trường Lâm Viên': 'Lam Vien Square',
    'Chợ Đà Lạt': 'Da Lat Market',
    'Trải Nghiệm Ẩm Thực Đà Lạt': 'Da Lat Culinary Adventures',
    'Gợi Ý Tour Du Lịch Đà Lạt': 'Suggested Da Lat Tours',
    'Kết Luận': 'Conclusion',
    'Đà Lạt – Thiên Đường Nghỉ Dưỡng Giữa Lòng Cao Nguyên': 'Da Lat – A Paradise Retreat in the Heart of the Highlands',
    'Đà Lạt – the City of a Thousand Flowers': 'Da Lat – the City of a Thousand Flowers',
    'famous for khí hậu chilly quanh năm, những cánh đồng hoa rực rỡ, cảnh quan poetic và nền cuisine phong phú. Nơi đây not only thu hút du khách bởi những địa danh tuyệt đẹp như Hồ Xuân Hương, Thung lũng Tình Yêu hay Đồi chè Cầu Đất, but also bởi atmosphere bình yên, thích hợp để rest/relax và discover. Dù bạn thích sự romantic hay đam mê chinh phục những cung đường mới, thành phố sương mù luôn là destination you can\'t miss.': 'famous for its year-round cool climate, vibrant flower fields, poetic landscapes, and rich culinary scene. This misty mountain city attracts visitors not only for its breathtaking landmarks like Xuan Huong Lake, the Valley of Love, and Cau Dat Tea Hills, but also for its serene atmosphere – perfect for relaxation and discovery. Whether you\'re drawn to romance or eager to explore new trails, Da Lat is a destination you simply can\'t miss.',
    'Địa điểm check-in you can\'t miss': 'An unmissable check-in spot',
    'với hai biểu tượng unique là': 'featuring two iconic symbols:',
    'Bông Hoa Dã Quỳ': 'Wild Sunflower',
    'và': 'and',
    'Nụ Hoa Atiso khổng lồ': 'Giant Artichoke Bud',
    ', tượng trưng cho beauty đặc trưng của Đà Lạt. Quảng trường rộng lớn, thoáng đãng, thích hợp cho những buổi dã ngoại, vui chơi cùng bạn bè, take photos kỷ niệm hoặc đơn giản là dạo bước enjoy không khí chilly đặc trưng của phố núi. Đây cũng là nơi thường xuyên diễn ra các sự kiện văn hóa, lễ hội sôi động, thu hút đông đảo du khách visit/explore và trải nghiệm.': ', both representing Da Lat\'s unique natural beauty. The spacious, airy square is ideal for picnics, hanging out with friends, capturing memories, or simply strolling through the cool highland breeze. It\'s also a popular venue for cultural events and lively festivals that attract visitors from near and far.',
    '– destination ideal để enjoy các grilled dishes thơm ngon trong atmosphere ấm cúng giữa khí trời chilly của Đà Lạt. Quán prominent với menu diverse, từ': '– the perfect spot to enjoy mouthwatering grilled dishes wrapped in a cozy atmosphere amid Da Lat\'s cool mountain air. The restaurant boasts a diverse menu, from',
    'bò tảng đậm đà, ba chỉ bò kim châm béo ngậy, ba chỉ bò tiêu cay nồng đến ốc nhồi thịt thơm ngon': 'rich grilled beef blocks, creamy beef belly enoki rolls, and peppery beef brisket to savory stuffed snails',
    '. Especially, nơi đây sở hữu': '. What truly sets it apart is the',
    'view tàu sunset và nhà lồng lung linh về đêm': 'sunset train view and the glittering greenhouse valley at night',
    ', tạo nên khung cảnh romantic, thích hợp để chill cùng bạn bè và people thân. Do visit thăm và enjoy trải nghiệm cuisine đáng nhớ tại đây!': ', creating a romantic setting that\'s perfect for chilling with friends and loved ones. Come by and savor an unforgettable culinary experience!',
    'Thiên đường mua sắm và cuisine, nơi you can tìm thấy vô số specialty như': 'A shopping and food paradise where you can find countless local specialties such as',
    'dâu tây tươi, mứt hoa, rượu dâu, bánh tráng nướng': 'fresh strawberries, flower jams, strawberry wine, grilled rice paper',
    'và nhiều món ngon hấp dẫn. Đây cũng là điểm check-in sôi động, mang đậm nét đặc trưng của phố núi Đà Lạt.': 'and many other irresistible treats. It\'s also a buzzing check-in spot that perfectly captures the quintessential highland town vibe of Da Lat.',
    '– “Pizza Đà Lạt” giòn rụm, thơm ngon.': '– Da Lat\'s famous "Vietnamese pizza" – crispy, fragrant, and utterly addictive.',
    '– Món ăn trờn vẹn vị giữa chua, cay và thanh ngọt.': '– A harmonious blend of sour, spicy, and sweet flavors.',
    '– Tràng miệng hấp dẫn, ngọt dễ chịu.': '– A delightful dessert with a gentle sweetness.',
    'If you want to một trip perfect, hãy tham khảo các tour đồng hành:': 'For a perfect trip, consider these curated tours:',
    'Tour discover đà lạt trong 1 ngày.': 'One-day Da Lat exploration tour.',
    'Tour săn mây cực chất tại Cau Dat.': 'Cloud-hunting adventure at Cau Dat.',
    'Tour check-in các café Instagrammable hot nhất.': 'Instagrammable café hopping tour.',
    'Khám phá Đà Lạt là một trải nghiệm wonderful you can\'t miss. If you are people thích cuisine nướng, don\'t forget ghé': 'Exploring Da Lat is an unforgettable experience you simply can\'t miss. If you love BBQ, don\'t forget to visit',
    '. Atmosphere ấm cúng, menu diverse với các grilled dishes thơm ngon sẽ mang đến cho bạn một bữa ăn đầy impressive giữa tiết trời chilly của Đà Lạt. Hãy lên kế hoạch và trải nghiệm ngay today!': '. The cozy atmosphere and diverse menu of irresistible grilled dishes will give you a truly memorable meal amid Da Lat\'s refreshing cool weather. Start planning your trip today!',
    'Discover Da Lat – A Paradise Retreat | Xóm Lèo': 'Discover Da Lat – A Paradise Retreat | Xom Leo'
}

robust_replace('blog/kham-pha-da-lat-thien-duong-nghi-duong-en.html', repl_thien_duong)

