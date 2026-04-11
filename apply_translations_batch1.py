import re
import glob

def process_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    for vn, en in replacements.items():
        if vn in content:
            content = content.replace(vn, en)
        else:
            # Also try without specific whitespace
            vn_clean = re.sub(r'\s+', ' ', vn).strip()
            content_clean = re.sub(r'\s+', ' ', content)
            if vn_clean not in content_clean:
                print(f"  [!] Missing string in {filepath}: {vn[:50]}...")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")


# 1. Thien Vien Truc Lam
repl_thien_vien = {
    'Thiền Viện Trúc Lâm Đà Lạt – Điểm Tâm Linh Yên Bình | Xóm Lèo': 'Truc Lam Zen Monastery – A Serene Spiritual Retreat | Xom Leo',
    'Khám phá Thiền Viện Trúc Lâm Đà Lạt - ngôi pagoda famous for kiến trúc trang nghiêm, hồ Tuyền Lâm poetic. Ghé Xóm Lèo enjoy BBQ sau chuyến visit/explore.': 'Discover Truc Lam Zen Monastery - an iconic pagoda famous for its solemn architecture and the poetic Tuyen Lam Lake. Stop by Xom Leo for BBQ after your visit.',
    'Thiền Viện Trúc Lâm Đà Lạt – Điểm Tâm Linh Yên Bình Giữa Núi Rừng': 'Truc Lam Zen Monastery – A Serene Spiritual Retreat Nestled in the Mountains',
    'Architecture và atmosphere': 'Architecture & Atmosphere',
    'Cáp treo đến Thiền Viện': 'Cable Car to the Monastery',
    'Lưu ý khi visit/explore': 'Tips for Your Visit',
    'Thiền Viện Trúc Lâm Đà Lạt': 'Truc Lam Zen Monastery',
    'là một trong những zen monastery lớn và đẹp nhất Việt Nam, tọa lạc trên đồi Phượng Hoàng, from the city center Đà Lạt khoảng 5km về phía nam. Nơi đây mang đến atmosphere tĩnh lặng, thanh tịnh giữa núi pine forest bạt ngàn.': 'is one of the largest and most beautiful Zen monasteries in Vietnam, perched atop Phoenix Hill (Đồi Phượng Hoàng), approximately 5km south of downtown Da Lat. This sacred place offers a tranquil, meditative atmosphere surrounded by endless pine forests.',
    'Zen Monastery được xây dựng theo phong cách kiến trúc traditional Việt Nam với mái ngói cong thanh thoát, cổng tam quan uy nghiêm. Khuôn viên rộng lớn với flower garden, hồ cá, và nhiều loại cây xanh quý hiếm. Từ sân chính, visitors có thể phóng tầm mắt ra toàn cảnh': 'The monastery was built in traditional Vietnamese architectural style, featuring gracefully curved tile roofs and an imposing triple-gate entrance (Tam Quan). The expansive grounds are adorned with flower gardens, koi ponds, and rare plant species. From the main courtyard, visitors can gaze out over the breathtaking panorama of',
    'poetic bên dưới.': 'stretching peacefully below.',
    'Du khách có thể đi': 'Visitors can take the',
    'cáp treo Robin Hill': 'Robin Hill Cable Car',
    'để đến Thiền Viện Trúc Lâm, vừa enjoy the scenery Đà Lạt từ trên cao. Giá vé cáp treo khoảng 80.000 – 100.000 VNĐ/people. Thời gian di chuyển khoảng 15 minutes với tầm nhìn 360 độ stunning.': 'to reach Truc Lam Zen Monastery while enjoying aerial views of Da Lat from above. Cable car tickets cost approximately 80,000 – 100,000 VND per person. The ride takes about 15 minutes and offers a stunning 360-degree view of the surrounding landscape.',
    'Du khách nên ăn mặc lịch sự, kín đáo khi vào zen monastery. Giữ yên lặng và tôn trọng atmosphere tu hành. Thời gian visit/explore thường kéo dài khoảng 1-2 tiếng.': 'Visitors should dress modestly and respectfully when entering the monastery. Please maintain silence and show respect for the monks and meditation spaces. A typical visit lasts between 1–2 hours.',
    "Sau khi visit/explore Thiền Viện Trúc Lâm, don't forget ghé qua": 'After exploring Truc Lam Zen Monastery, don\'t miss a visit to',
    'để enjoy những grilled dishes thơm lừng. Quán prominent với atmosphere gần gũi, view thiên nhiên thoáng đãng, ngắm sunset và săn tàu lửa.': 'to savor some irresistible grilled dishes. The restaurant stands out for its cozy atmosphere, open nature views, stunning sunsets, and the chance to watch the train pass by.',
    'Nên đi Zen Monastery Trúc Lâm vào thời gian nào đẹp nhất?': 'When is the best time to visit Truc Lam Zen Monastery?',
    'You should đi vào early morning hoặc chiều mát để enjoy atmosphere yên tĩnh và beautiful scenery rõ nét nhất.': 'You should go in the early morning or late afternoon to enjoy the peaceful atmosphere and beautiful scenery at its best.',
    'Có nên đi cáp treo đến Zen Monastery Trúc Lâm không?': 'Should I take the cable car to the monastery?',
    'Có, đi cáp treo là trải nghiệm rất đáng thử vì you can ngắm toàn cảnh Đà Lạt từ trên cao.': 'Yes, taking the cable car is a highly recommended experience as you can enjoy a panoramic view of Da Lat from above.',
    'Tham quan Zen Monastery Trúc Lâm mất bao lâu?': 'How long does a visit usually take?',
    'Thời gian visit/explore thường kéo dài khoảng 1 đến 2 tiếng tùy vào itinerary của bạn.': 'The visit usually takes about 1 to 2 hours depending on your itinerary.',
    'Ghé Xóm Lèo sau chuyến visit/explore': 'Stop by Xom Leo After Your Visit'
}

# 2. Da Lat co gi 
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

# 3. Kham pha thien duong nghi duong
repl_thien_duong = {
    'Khám Phá Đà Lạt – Thiên đường nghỉ dưỡng': 'Discover Da Lat – A Paradise Retreat',
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

# 4. Review diem den 2025
repl_review = {
    'Review destination Đà Lạt mới nhất năm 2025': 'Da Lat Destination Review – Latest Spots in 2025',
    'Đà Lạt luôn biết cách làm mới mình với những location và interesting experience, hấp dẫn. Hy vọng bài viết trên sẽ giúp bạn có thêm những suggestion wonderful cho chuyến': 'Da Lat always finds ways to reinvent itself with exciting new destinations and experiences. We hope this guide inspires you for your upcoming trip.',
    'Đà Lạt, với beauty romantic và khí hậu trong lành, là destination you can\'t miss cho những ai yêu thích du lịch. Thành phố này luôn mang đến cho visitors những trải nghiệm mới mẻ, unique. Below are bài review chi tiết về những destination mới nhất tại Đà Lạt, giúp bạn có thêm ý tưởng cho hành trình discover sắp tới.': 'Da Lat, with its romantic charm and fresh highland air, is an unmissable destination for travel lovers. This dreamy city never fails to surprise visitors with new and unique experiences. Below is a detailed review of the latest must-visit spots in Da Lat to inspire your next adventure.',
    'Khám phá những destination mới tại Đà Lạt': 'Discover New Destinations in Da Lat',
    'Đồi Thiên Phúc Đức': 'Thien Phuc Duc Hill',
    'Đặc điểm prominent:': 'Standout feature:',
    'Đây là location yêu thích của các nhiếp ảnh gia với cây thông cô đơn nổi tiếng và view ngắm mây stunning vào early morning.': 'A favorite spot for photographers, famous for its lone pine tree and breathtaking cloud-hunting views at dawn.',
    'Hoạt động:': 'Activities:',
    'Chụp ảnh, cắm trại qua đêm để trải nghiệm cảnh sunrise stunning.': 'Photography and overnight camping to witness a stunning sunrise.',
    'Hồ Vô Cực': 'Infinity Lake',
    'Đặc điểm:': 'What makes it special:',
    'Là một trong những location check-in hot nhất hiện nay với bức tượng hai khuôn mặt khổng lồ hướng ra lake.': 'One of the hottest new check-in spots, featuring a massive two-faced sculpture overlooking the lake.',
    'Lý tưởng cho:': 'Ideal for:',
    'Các cặp đôi hoặc nhóm bạn muốn lưu giữ những bức ảnh “Instagrammable” đậm chất nghệ thuật.': 'Couples or friend groups looking to capture artistic, Instagrammable photos.',
    'Tourist Area Lá Phong': 'La Phong Tourist Area',
    'Khuôn viên được thiết kế với cảm hứng từ Nhật Bản, bao gồm những khu rừng lá phong đỏ, suối nước trong xanh và các công trình nghệ thuật unique.': 'The grounds are designed with Japanese-inspired aesthetics, including red maple forests, crystal-clear streams, and distinctive art installations.',
    'Gợi ý:': 'Suggestion:',
    'Đi dạo hoặc rest/relax tại các café trong khuôn viên.': 'Take a leisurely walk or relax at one of the cafés within the complex.',
    'Những hoạt động interesting experience': 'Fun & Unique Experiences',
    'Săn mây trên đỉnh Langbiang': 'Cloud Hunting on Langbiang Peak',
    'Lý do nên thử:': 'Why you should try it:',
    'Langbiang Peak not only famous for cảnh quan thiên nhiên majestic but also là location ideal để săn mây vào early morning.': 'Langbiang Peak is famous not only for its majestic natural scenery but also as the ultimate spot for cloud hunting at dawn.',
    'Hoạt động khác:': 'Other activities:',
    'Leo núi, đi xe jeep và tìm hiểu văn hóa dân tộc K’ho.': 'Mountain trekking, jeep rides, and exploring the culture of the K\'ho ethnic group.',
    'Trải nghiệm tour hái dâu tây': 'Strawberry Picking Tours',
    'Điểm đến:': 'Where to go:',
    'Các nông trại dâu tây lớn tại Đà Lạt như Hiệp Lực hoặc Biofresh.': 'Large strawberry farms in Da Lat such as Hiep Luc or Biofresh.',
    'Lợi ích:': 'The experience:',
    'Du khách được tự tay hái và enjoy dâu tây tươi ngay tại vườn.': 'Visitors get to pick and taste sun-ripened strawberries straight from the garden.',
    'Tham quan những café độc lạ': 'Explore Quirky Cafés',
    'Không gian ấm cúng với cà phê quality cao.': 'A warm, cozy space serving premium-quality coffee.',
    'Kokoro Café:': 'Kokoro Café:',
    'Café mang phong cách Nhật Bản, prominent với hồ cá Koi và góc take photos đẹp như tranh.': 'A Japanese-inspired café featuring a beautiful koi pond and picture-perfect photo corners.',
    'Ẩm thực Đà Lạt: Hương vị không thể quên': 'Da Lat Cuisine: Unforgettable Flavors',
    'Không gian ấm cúng, menu diverse với các grilled dishes hấp dẫn.': 'A cozy atmosphere with a diverse menu of irresistible grilled dishes.',
    'Liên hệ:': 'Contact:',
    'Night Market Đà Lạt:': 'Da Lat Night Market:',
    'Don\'t forget enjoy các dishes vặt như bánh tráng nướng, sữa đậu nành nóng.': 'Don\'t miss the beloved street food snacks like grilled rice paper and hot soybean milk.',
    'Lưu ý khi du lịch Đà Lạt': 'Tips for Traveling in Da Lat',
    'Trang phục:': 'Clothing:',
    'Nên mang theo áo khoác và giày thoải mái do weather ở đây khá lạnh, especially vào early morning và tối.': 'Bring a jacket and comfortable shoes, as the weather gets quite cold, especially in the early morning and at night.',
    'Thuê motorbike:': 'Rent a motorbike:',
    'Để convenient discover các location, you should thuê motorbike với giá hợp lý.': 'For convenient exploration, renting a motorbike is the best option at very affordable rates.',
    'Ý thức bảo vệ môi trường:': 'Be eco-friendly:',
    'Đừng để lại rác tại các điểm du lịch để giữ gìn cảnh quan thiên nhiên.': 'Please don\'t leave trash at tourist sites — help preserve Da Lat\'s beautiful natural landscapes.',
    'Đà Lạt luôn biết cách làm mới mình với những location và interesting experience, hấp dẫn. Hy vọng bài viết trên sẽ giúp bạn có thêm những suggestion wonderful cho trip sắp tới. Don\'t forget ghé': 'Da Lat always finds ways to reinvent itself with exciting new destinations and experiences. We hope this guide inspires you for your upcoming trip. Don\'t forget to stop by',
    'để enjoy các món ngon và enjoy atmosphere thư giãn. Wish you có một hành trình tràn đầy kỷ niệm tại the City of a Thousand Flowers! 🌸': 'to enjoy incredible food and a truly relaxing space. Wishing you a journey filled with beautiful memories in the City of a Thousand Flowers! 🌸'
}

process_file('blog/thien-vien-truc-lam-en.html', repl_thien_vien)
process_file('blog/da-lat-co-gi-top-dia-diem-chill-tai-da-lat-en.html', repl_co_gi)
process_file('blog/kham-pha-da-lat-thien-duong-nghi-duong-en.html', repl_thien_duong)
process_file('blog/review-diem-den-da-lat-moi-nhat-nam-2025-en.html', repl_review)

print("Batch 1 completed!")
