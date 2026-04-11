"""Translate nha-tho-con-ga-en.html body content to English."""
import re

filepath = 'blog/nha-tho-con-ga-en.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# SEO meta tags
replacements = {
    '<title>Nhà thờ Con Gà – Vẻ đẹp cổ điển giữa lòng Đà Lạt mộng mơ | Xóm Lèo</title>':
        '<title>Rooster Church – Timeless Beauty in the Heart of Dreamy Da Lat | Xom Leo</title>',
    'content="Khám phá Nhà thờ Con Gà Đà Lạt – biểu tượng kiến trúc Pháp cổ nổi tiếng. Xem ngay giờ lễ, đường đi, kinh nghiệm tham quan và địa điểm ăn uống cực chill gần đó."':
        'content="Discover Rooster Church in Da Lat – a famous French colonial landmark. Check mass times, directions, visiting tips and ultra chill dining spots nearby."',
    '"headline": "Nhà thờ Con Gà – Vẻ đẹp cổ điển giữa lòng Đà Lạt mộng mơ | Xóm Lèo"':
        '"headline": "Rooster Church – Timeless Beauty in the Heart of Dreamy Da Lat | Xom Leo"',
    '"description": "Khám phá Nhà thờ Con Gà Đà Lạt – biểu tượng kiến trúc Pháp cổ nổi tiếng. Xem ngay giờ lễ, đường đi, kinh nghiệm tham quan và địa điểm ăn uống cực chill gần đó."':
        '"description": "Discover Rooster Church in Da Lat – a famous French colonial landmark. Check mass times, directions, visiting tips and ultra chill dining spots nearby."',
    'content="Nhà thờ Con Gà – Vẻ đẹp cổ điển giữa lòng Đà Lạt mộng mơ | Xóm Lèo"':
        'content="Rooster Church – Timeless Beauty in the Heart of Dreamy Da Lat | Xom Leo"',
    '"name": "Trang chủ"': '"name": "Home"',
    '"name": "Nhà Thờ Con Gà Đà Lạt – Biểu Tượng Kiến Trúc Cổ | Xóm Lèo"':
        '"name": "Rooster Church Da Lat – Iconic French Architecture | Xom Leo"',
    
    # H1 title
    '>Nhà thờ Con Gà – Vẻ đẹp cổ điển giữa lòng Đà Lạt mộng mơ</h1>':
        '>Rooster Church – Timeless Beauty in the Heart of Dreamy Da Lat</h1>',
    'alt="Nhà thờ Con Gà – Vẻ đẹp cổ điển giữa lòng Đà Lạt mộng mơ"':
        'alt="Rooster Church – Timeless beauty in the heart of dreamy Da Lat"',
    'Ảnh: Nhà thờ Con Gà – Vẻ đẹp cổ điển giữa lòng Đà Lạt mộng mơ':
        'Photo: Rooster Church – Timeless beauty in the heart of dreamy Da Lat',
    
    # TOC
    '>1. Giới thiệu về Nhà thờ Con Gà – Biểu tượng trăm năm giữa lòng Đà Lạt</a>':
        '>1. Introduction – A Century-Old Icon in the Heart of Da Lat</a>',
    '>2. Nhà thờ Con Gà có thu phí không?</a>':
        '>2. Is There an Admission Fee?</a>',
    '>3. Giờ mở cửa Nhà Thờ Con Gà & thời điểm đẹp nhất</a>':
        '>3. Opening Hours & Best Time to Visit</a>',
    '>4. Hướng dẫn đường đi đến Nhà thờ Con Gà</a>':
        '>4. How to Get to Rooster Church</a>',
    '>5. Lịch sử hình thành Nhà Thờ Con Gà</a>':
        '>5. The History Behind the Church</a>',
    '>6. Điểm đặc biệt của Nhà thờ Con Gà</a>':
        '>6. What Makes Rooster Church Special</a>',
    '>6.1. Vì sao gọi là \u201c Nhà Thờ Con Gà\u201d?</a>':
        '>6.1. Why Is It Called "Rooster Church"?</a>',
    '>6.2. Kiến trúc độc đáo</a>':
        '>6.2. Unique Architecture</a>',
    '>7. Giờ lễ Nhà thờ Con Gà Đà Lạt</a>':
        '>7. Mass Schedule</a>',
    '>8. Các điểm du lịch gần Nhà thờ Con Gà</a>':
        '>8. Nearby Attractions</a>',
    '>9. Ăn gì gần Nhà thờ Con Gà? (Gợi ý cực HOT 🔥)</a>':
        '>9. Where to Eat Nearby (Super HOT Tip 🔥)</a>',
    '>10. FAQ – Câu hỏi thường gặp</a>':
        '>10. FAQ – Frequently Asked Questions</a>',
    
    # Body headings
    '>1. Giới thiệu về Nhà thờ Con Gà – Biểu tượng trăm năm giữa lòng Đà Lạt</h2>':
        '>1. Introduction – A Century-Old Icon in the Heart of Da Lat</h2>',
    '>2. Nhà thờ Con Gà có thu phí không?</h2>':
        '>2. Is There an Admission Fee?</h2>',
    '>3. Giờ mở cửa Nhà Thờ Con Gà & thời điểm đẹp nhất</h2>':
        '>3. Opening Hours & Best Time to Visit</h2>',
    '>4. Hướng dẫn đường đi đến Nhà thờ Con Gà</h2>':
        '>4. How to Get to Rooster Church</h2>',
    '>5. Lịch sử hình thành Nhà Thờ Con Gà</h2>':
        '>5. The History Behind the Church</h2>',
    '>6. Điểm đặc biệt của Nhà thờ Con Gà</h2>':
        '>6. What Makes Rooster Church Special</h2>',
    '>6.1. Vì sao gọi là "Nhà Thờ Con Gà"?</h3>':
        '>6.1. Why Is It Called "Rooster Church"?</h3>',
    '>6.2. Kiến trúc độc đáo</h3>':
        '>6.2. Unique Architecture</h3>',
    '>7. Giờ lễ Nhà thờ Con Gà Đà Lạt</h2>':
        '>7. Mass Schedule</h2>',
    '>8. Các điểm du lịch gần Nhà thờ Con Gà</h2>':
        '>8. Nearby Attractions</h2>',
    '>9. Ăn gì gần Nhà thờ Con Gà? (Gợi ý cực HOT 🔥)</h2>':
        '>9. Where to Eat Nearby (Super HOT Tip 🔥)</h2>',
    '>10. FAQ – Câu hỏi thường gặp</h2>':
        '>10. FAQ – Frequently Asked Questions</h2>',
    
    # Body paragraphs
    'Tọa lạc ngay trung tâm Đà Lạt, <strong>Nhà thờ Con Gà</strong> là một trong những công trình kiến trúc cổ kính và biểu tượng lâu đời của thành phố sương mù. Với vẻ đẹp mang đậm dấu ấn châu Âu cùng lịch sử gần trăm năm, nơi đây luôn nằm trong danh sách địa điểm check-in không thể bỏ lỡ.':
        'Standing proudly in the heart of Da Lat, <strong>Rooster Church</strong> (Nhà thờ Con Gà) is one of the city\'s most iconic and time-honored architectural landmarks. With its distinctly European charm and nearly a century of history, this majestic church remains a must-visit check-in spot for every traveler.',
    'Nếu bạn đang tìm review nhà thờ Con Gà Đà Lạt, giờ lễ, đường đi và kinh nghiệm tham quan, bài viết này sẽ giúp bạn đầy đủ nhất.':
        'Looking for a complete guide to Rooster Church — from mass times and directions to visiting tips? You\'ve come to the right place.',
    'Nhà thờ Con Gà, tên chính thức là Nhà thờ Chính tòa Thánh Nicôla Bari, được xây dựng từ năm 1931 và hoàn thành vào năm 1942.<br>\r\nĐây là:':
        'Rooster Church, officially known as the Cathedral of Saint Nicholas of Bari, was built starting in 1931 and completed in 1942.<br>\r\nIt holds the distinction of being:',
    '<li>Nhà thờ lớn nhất tại Đà Lạt</li>': '<li>The largest church in Da Lat</li>',
    '<li>Một trong những công trình kiến trúc Pháp tiêu biểu</li>': '<li>One of the finest examples of French colonial architecture</li>',
    '<li>Biểu tượng du lịch nổi bật của thành phố</li>': '<li>A beloved tourism icon of the city</li>',
    'Nhà thờ nằm trên đường Trần Phú – tuyến đường trung tâm, rất thuận tiện để kết hợp tham quan các địa điểm nổi tiếng như:':
        'Located on Tran Phu Street — the main boulevard — it\'s perfectly situated for combining with visits to other famous landmarks:',
    '<li>Chợ Đà Lạt</li>': '<li>Da Lat Market</li>',
    '<li>Quảng trường Lâm Viên</li>': '<li>Lam Vien Square</li>',
    '<li>Hồ Xuân Hương</li>': '<li>Xuan Huong Lake</li>',
    'Tin vui là: 👉 Tham quan hoàn toàn miễn phí': 'Great news: 👉 Admission is completely free!',
    'Bạn có thể thoải mái:': 'You\'re welcome to:',
    '<li>Check-in sống ảo</li>': '<li>Take photos and explore the grounds</li>',
    '<li>Tham quan kiến trúc</li>': '<li>Admire the stunning architecture</li>',
    '<li>Tham dự thánh lễ</li>': '<li>Attend a holy mass</li>',
    'Nhà thờ mở cửa hằng ngày, tuy nhiên:<br>\r\n👉 Thời điểm đẹp nhất:':
        'The church is open daily. However:<br>\r\n👉 Best times to visit:',
    '<li>Sáng sớm (ánh sáng đẹp, ít người)</li>': '<li>Early morning (beautiful light, fewer crowds)</li>',
    '<li>Chiều (hoàng hôn rất chill)</li>': '<li>Late afternoon (the sunset glow is absolutely chill)</li>',
    '👉 Phù hợp để:': '👉 Perfect for:',
    '<li>Chụp ảnh</li>': '<li>Photography</li>',
    '<li>Tham quan nhẹ nhàng</li>': '<li>Leisurely sightseeing</li>',
    'Từ trung tâm:': 'From the city center:',
    '<li>Xuất phát từ vòng xoay Chợ Đà Lạt</li>': '<li>Start from the Da Lat Market roundabout</li>',
    '<li>Đi qua cầu → đường Lê Đại Hành</li>': '<li>Cross the bridge → onto Le Dai Hanh Street</li>',
    '<li>Rẽ phải → đi thêm ~300m</li>': '<li>Turn right → continue for about 300m</li>',
    '<li>Lên dốc → thấy nhà thờ</li>': '<li>Head uphill → you\'ll see the church</li>',
    '👉 Rất dễ tìm vì:': '👉 Very easy to find because:',
    '<li>Nằm ngay trung tâm</li>': '<li>It\'s right in the city center</li>',
    '<li>Tháp chuông cao nổi bật</li>': '<li>The tall bell tower is hard to miss</li>',
    'Nhà thờ gắn liền với sự phát triển của Đà Lạt từ thời Pháp.':
        'The church is deeply intertwined with Da Lat\'s French colonial heritage.',
    '<li>Năm 1893: Alexandre Yersin khám phá cao nguyên</li>': '<li>1893: Alexandre Yersin discovered the highland plateau</li>',
    '<li>1917: xây dựng cơ sở Công giáo đầu tiên</li>': '<li>1917: The first Catholic facility was established</li>',
    '<li>1931: khởi công nhà thờ</li>': '<li>1931: Construction of the church began</li>',
    '<li>1942: hoàn thành</li>': '<li>1942: The church was completed</li>',
    '👉 Đây được xem là "chứng nhân lịch sử" của thành phố.':
        '👉 It\'s considered a "living witness" to the city\'s history.',
    'Tên gọi xuất phát từ: 👉 Tượng con gà trên đỉnh tháp chuông':
        'The name comes from: 👉 A rooster statue perched atop the bell tower',
    '<li>Cao 58cm, dài 66cm</li>': '<li>58cm tall, 66cm long</li>',
    '<li>Là biểu tượng: Văn hóa Pháp, Thánh Phêrô (trong Kinh Thánh)</li>':
        '<li>Symbolizes: French culture and Saint Peter (from the Bible)</li>',
    'Nhà thờ mang phong cách Roman châu Âu:': 'The church features European Romanesque design:',
    '<li>Dài: 65m</li>': '<li>Length: 65m</li>',
    '<li>Rộng: 14m</li>': '<li>Width: 14m</li>',
    '<li>Tháp chuông cao: 47m</li>': '<li>Bell tower height: 47m</li>',
    'Điểm nổi bật:': 'Standout features:',
    '<li>Hình chữ thập đối xứng</li>': '<li>Symmetrical cross-shaped layout</li>',
    '<li>Cửa chính hướng về Núi Langbiang</li>': '<li>Main entrance facing Langbiang Mountain</li>',
    '<li>70 tấm kính màu nhập từ Pháp</li>': '<li>70 stained glass panels imported from France</li>',
    '👉 Ánh sáng xuyên qua kính tạo hiệu ứng cực đẹp bên trong.':
        '👉 Sunlight streaming through the glass creates a breathtakingly beautiful effect inside.',
    '👉 Ngày thường:': '👉 Weekdays:',
    '👉 Chủ nhật:': '👉 Sundays:',
    'Bạn có thể kết hợp đi trong 1 buổi:': 'You can easily combine these spots in a single outing:',
    '<li>Hồ Xuân Hương (~1.2km)</li>': '<li>Xuan Huong Lake (~1.2km)</li>',
    '<li>Quảng trường Lâm Viên (~1.2km)</li>': '<li>Lam Vien Square (~1.2km)</li>',
    '<li>Dinh Bảo Đại III (~1.8km)</li>': '<li>Bao Dai Palace III (~1.8km)</li>',
    '<li>Ga Đà Lạt (~2.3km)</li>': '<li>Da Lat Railway Station (~2.3km)</li>',
    '<li>Thác Datanla (~5.8km)</li>': '<li>Datanla Waterfall (~5.8km)</li>',
    'Sau khi tham quan, bạn nên ghé: 👉': 'After exploring, you should definitely stop by: 👉',
    '<li>View ngắm tàu + hoàng hôn cực chill</li>': '<li>Train-watching views + stunning sunsets — incredibly chill vibes</li>',
    '<li>Không gian mở, thoáng</li>': '<li>Open-air, breezy atmosphere</li>',
    '<li>Rất hợp: Đi nhóm, Hẹn hò, Chill buổi tối</li>': '<li>Perfect for: Groups, Date night, Evening chill sessions</li>',
    'Món nổi bật:': 'Signature dishes:',
    '<li>Thịt nướng đậm vị</li>': '<li>Richly marinated grilled meats</li>',
    '<li>Hải sản nướng</li>': '<li>Grilled seafood</li>',
    '<li>Combo ăn uống hợp lý</li>': '<li>Great-value combo sets</li>',
    '📍 Địa chỉ: 113 Huỳnh Tấn Phát, Phường 11, Đà Lạt': '📍 Address: 113 Huynh Tan Phat, Ward 11, Da Lat',
    '⏰ Giờ mở cửa: 15:00 – 23:00 mỗi ngày': '⏰ Opening Hours: 15:00 – 23:00 daily',
    '📞 Hotline đặt bàn:': '📞 Reservation Hotline:',
    '❓ Nhà thờ Con Gà có mất vé không?': '❓ Is there an entrance fee for Rooster Church?',
    '→ Không, tham quan hoàn toàn miễn phí': '→ No, admission is completely free.',
    '❓ Nên đi lúc nào đẹp?': '❓ When is the best time to visit?',
    '→ Thời điểm đẹp nhất là vào sáng sớm hoặc buổi chiều khi ánh sáng đẹp và không khí mát mẻ.':
        '→ Early morning or late afternoon, when the light is beautiful and the air is cool and refreshing.',
    '❓ Có được chụp ảnh không?': '❓ Can I take photos?',
    '→ Có, du khách có thể chụp ảnh thoải mái nhưng nên giữ trật tự và tôn trọng không gian linh thiêng.':
        '→ Yes! Visitors are welcome to take photos, but please be respectful of the sacred space and keep noise to a minimum.',
    'Nhà thờ Con Gà không chỉ là một công trình tôn giáo mà còn là biểu tượng kiến trúc đặc sắc của Đà Lạt. Với vẻ đẹp cổ kính, vị trí trung tâm và giá trị lịch sử lâu đời, đây chắc chắn là điểm đến bạn không nên bỏ lỡ.':
        'Rooster Church is far more than a place of worship — it\'s a stunning architectural treasure and an enduring symbol of Da Lat. With its timeless elegance, central location, and rich history, this is one landmark you absolutely shouldn\'t miss.',
    '👉 Và đừng quên kết thúc hành trình bằng một buổi tối thật chill tại':
        '👉 And don\'t forget to cap off your journey with an unforgettable evening at',
    'để chuyến đi thêm trọn vẹn.': 'for the perfect ending to your Da Lat adventure.',
    
    # FAQ schema
    '"name": "Nhà thờ Con Gà có mất vé không?"': '"name": "Is there an entrance fee for Rooster Church?"',
    '"text": "Không, tham quan hoàn toàn miễn phí."': '"text": "No, admission is completely free."',
    '"name": "Nên đi Nhà thờ Con Gà lúc nào đẹp?"': '"name": "When is the best time to visit Rooster Church?"',
    '"text": "Thời điểm đẹp nhất là vào sáng sớm hoặc buổi chiều khi ánh sáng đẹp và không khí mát mẻ."':
        '"text": "Early morning or late afternoon, when the light is beautiful and the air is cool and refreshing."',
    '"name": "Có được chụp ảnh tại Nhà thờ Con Gà không?"': '"name": "Can I take photos at Rooster Church?"',
    '"text": "Có, du khách có thể chụp ảnh thoải mái nhưng nên giữ trật tự và tôn trọng không gian linh thiêng."':
        '"text": "Yes! Visitors are welcome to take photos, but please be respectful of the sacred space."',
}

for vn, en in replacements.items():
    content = content.replace(vn, en)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Translated {filepath} successfully!")
