import json
import os
import re

translation_map = {
    # Titles
    "Wonderland Đà Lạt: Địa điểm vui chơi, sống ảo hot nhất 2025": "Wonderland Da Lat: The Hottest Amusement and Photo Spot in 2025",
    "🌸 Review Du Lịch Đà Lạt - Thành Phố Ngàn Hoa🌸": "🌸 Da Lat Travel Review - The City of a Thousand Flowers🌸",
    "Top 30 quán ăn sáng ở Đà Lạt được du khách yêu thích": "Top 30 Breakfast Spots in Da Lat Loved by Tourists",
    "[REVIEW] Món ngon Đà Lạt: Recommended 25 đặc sản không nên bỏ lỡ": "[REVIEW] Da Lat Delicacies: 25 Highly Recommended Specialties Not to be Missed",
    "Ăn Gì Ở Đà Lạt?": "What To Eat In Da Lat?",
    "Đà Lạt ăn gì hôm nay ?": "What to Eat in Da Lat Today?",
    "Dinh Bảo Đại Đà Lạt – Di tích lịch sử nổi bật nên ghé thăm": "Bao Dai Palace Da Lat – An Outstanding Historical Relic Worth Visiting",
    "Khám phá khách sạn Đà Lạt: Thiên đường nghỉ dưỡng": "Discover Da Lat Hotels: A Resort Paradise",
    "Đường Hầm Điêu Khắc – Tuyệt tác kiến trúc giữa lòng Đà Lạt": "Clay Tunnel – An Architectural Masterpiece in the Heart of Da Lat",
    "Recommended homestay Đà Lạt lý tưởng cho chuyến đi 3N2Đ thư giãn": "Recommended Ideal Da Lat Homestays for a Relaxing 3D2N Trip",
    "Top 7 những địa điểm du lịch Đà Lạt đang hot nhất năm 2025": "Top 7 Hottest Tourist Destinations in Da Lat in 2025",
    "Khám Phá Đà Lạt – Thành Phố Sương Mù": "Discovering Da Lat – The Misty City",
    "Du lịch Đà Lạt nên đi đâu và ăn gì? Cẩm nang chi tiết 2025": "Where to Go and What to Eat in Da Lat? Detailed Guide for 2025",
    "Đà Lạt Về Đêm - Top Những Nơi Phải Đến": "Da Lat By Night - Top Must-Visit Places",
    "Trải nghiệm Đà Lạt trọn vẹn tại Tiệm Nướng & Chill Xóm Lèo – Không gian ẩm thực & chill tuyệt vời": "A Complete Da Lat Experience at Tiem Nuong & Chill Xom Leo – Great Dining & Chill Space",
    "Khám Phá Đà Lạt – Thiên đường nghỉ dưỡng": "Discovering Da Lat – The Resort Paradise",
    "✨ Khám phá Đà Lạt 2 ngày 1 đêm": "✨ Exploring Da Lat in 2 Days 1 Night",
    "Khám phá góc chill yên bình tại làng Xóm Lèo Đà Lạt ban đêm": "Discovering the Peaceful Chill Corner at Xom Leo Village Da Lat at Night",
    "Hành trình khám phá Đà Lạt - Thành phố ngàn hoa": "Journey to Discover Da Lat - The City of a Thousand Flowers",
    "Khám phá Đà Lạt: Top những địa điểm check-in không thể bỏ qua": "Discover Da Lat: Top Check-in Locations You Can't Miss",
    "🌟 Top 9 địa điểm chill ở Đà Lạt cho trải nghiệm thư giãn & sống ảo": "🌟 Top 9 Chill Spots in Da Lat for a Relaxing & Cinematic Experience",
    "Top 5 cánh đồng hoa cẩm tú cầu Đà Lạt rực rỡ nhất 2025": "Top 5 Most Vibrant Hydrangea Fields in Da Lat 2025",
    "Vi vu Thung Lũng Tình Yêu 2025 – Chốn Mộng Mơ Giữa Đà Lạt": "Cruising Valley of Love 2025 – A Dreamy Place Amidst Da Lat",
    "Cẩm nang du lịch Đà Lạt 2025 – Khám phá Thành Phố sương mù": "Da Lat Travel Guide 2025 – Discover the Misty City",
    "Đà Lạt Có Gì - Top Địa Điểm Chill Tại Đà Lạt": "What Does Da Lat Have? - Top Chill Spots in Da Lat",
    "Tháng 3 Đà Lạt Có Gì ?": "What Does Da Lat Have in March?",
    "Top 23 quán cà phê đẹp ở Đà Lạt khiến giới trẻ mê mẩn nhất hiện nay": "Top 23 Beautiful Coffee Shops in Da Lat Most Loved by Youth Today",
    "Top 11 địa điểm chill ở Đà Lạt để thư giãn và check-in đẹp": "Top 11 Chill Spots in Da Lat for Relaxing and Beautiful Check-ins",
    "Nhà thờ Con Gà – Vẻ đẹp cổ điển giữa lòng Đà Lạt mộng mơ": "Rooster Church – Classic Beauty in the Heart of Dreamy Da Lat",
    "Review điểm đến Đà Lạt mới nhất năm 2025": "Review of the Newest Da Lat Destinations in 2025",
    "Thiền Viện Trúc Lâm Đà Lạt – Review chi tiết, đường đi, kinh nghiệm tham quan 2026": "Truc Lam Zen Monastery Da Lat – Detailed Review, Route, Visitor Experience 2026",
    "Đà Lạt chơi ở đâu? Khám phá 10 điểm đến hấp dẫn nhất 2025": "Where to Play in Da Lat? Discover 10 of the Most Attractive Destinations in 2025",
    "Chợ đêm Đà Lạt – Thiên đường ẩm thực giữa lòng thành phố": "Da Lat Night Market – A Food Paradise in the Heart of the City",
    "Địa điểm nổi tiếng ở Đà Lạt Năm 2025": "Famous Destinations in Da Lat in 2025",
    "Quán nướng Đà Lạt – Thiên đường ẩm thực lúc se lạnh": "Da Lat BBQ Spot – A Food Paradise in the Cold Weather",
    "Khám Phá Đỉnh Langbiang – Biểu Tượng Huyền Thoại tại Đà Lạt": "Discover Langbiang Peak – A Legendary Symbol in Da Lat",
    "Tour Đà Lạt: Hành trình khám phá thành phố ngàn hoa": "Da Lat Tour: A Journey to Discover the City of a Thousand Flowers",
    
    # Descriptions
    "Review Thiền viện Trúc Lâm Đà Lạt chi tiết 2026: đường đi, kinh nghiệm, thời điểm đẹp nhất và gợi ý địa điểm ăn uống sau khi tham quan.": "Detailed Truc Lam Zen Monastery Da Lat review 2026: route, experience, best time to visit, and suggestions for dining spots afterwards.",
    "Đà Lạt không chỉ nổi tiếng với phong cảnh đẹp và khí hậu dễ chịu mà còn với những lựa chọn lưu trú và ẩm thực tuyệt vời. Khi lên kế hoạch cho chuyến đi, đừng quên chọn một khách sạn phù hợp để nghỉ dưỡng. Đồng thời, hãy ghé qua 🔥 Tiệm Nướng & Chill Xóm Lèo để thưởng thức bữa ăn ngon và tận hưởng không gian ấm cúng, góp phần làm nên chuyến đi đáng nhớ của bạn.": "Da Lat is famous not only for its beautiful scenery and pleasant climate but also for its wonderful dining and lodging options. When planning your trip, don't forget to choose a suitable hotel. Also, stop by 🔥 Tiem Nuong & Chill Xom Leo to enjoy a delicious meal in a cozy atmosphere, contributing to your memorable trip.",
    "Đà Lạt – điểm đến lý tưởng cho mọi du khách. Tận hưởng thiên nhiên, ẩm thực và văn hóa độc đáo. Đặc biệt, đừng bỏ lỡ Tiệm Nướng & Chill Xóm Lèo để trải nghiệm không gian chill và món nướng hấp dẫn!": "Da Lat – an ideal destination for all tourists. Enjoy unique nature, cuisine, and culture. Specifically, don't miss Tiem Nuong & Chill Xom Leo to experience the chill space and attractive BBQ food!",
    "ới những địa điểm check-in nổi bật nêu trên, Đà Lạt đích thực là một thiên đường cho những tâm hồn yêu thích cảnh đẹp và sống ảo. Đặc biệt, chuyến đi của bạn sẽ không trọn vẹn nếu thiếu một buổi tối ấm cúng tại Tiệm Nướng & Chill Xóm Lèo, nơi bạn có thể thưởng thức đồ nướng thơm ngon, tận hưởng không gian chill và lưu giữ những kỷ niệm đẹp bên bạn bè và người thân. Hãy sắp xếp hành trang và khám phá ngay nhé!": "With the outstanding check-in locations mentioned above, Da Lat is truly a paradise for those who love beautiful scenery. Your trip will be incomplete without a cozy evening at Tiem Nuong & Chill Xom Leo, where you can enjoy delicious BBQ, chill atmosphere, and keep beautiful memories. Pack your bags and explore now!",
    "🌿 Đà Lạt – thiên đường mộng mơ với khí hậu se lạnh, cảnh sắc thơ mộng. 🔥 Tiệm Nướng & Chill Xóm Lèo là điểm dừng chân lý tưởng, nơi bạn tận hưởng thịt nướng thơm lừng giữa không gian chill ấm cúng, view đồi thông lãng mạn. 🍢 Trải nghiệm ẩm thực độc đáo, hòa mình vào không khí Đà Lạt đầy mê hoặc! ✨": "🌿 Da Lat – a dreamy paradise with cool weather and poetic scenery. 🔥 Tiem Nuong & Chill Xom Leo is an ideal stopover where you can enjoy fragrant BBQ meat amidst a cozy chill space and romantic pine hill view. 🍢 Experience unique cuisine and immerse yourself in Da Lat's enchanting atmosphere! ✨",
    "Tour Đà Lạt là lựa chọn lý tưởng để khám phá vẻ đẹp thơ mộng của thành phố ngàn hoa mà không cần lo lắng về lịch trình hay phương tiện di chuyển. Với sự sắp xếp khoa học, dịch vụ trọn gói và hướng dẫn viên chuyên nghiệp, tour Đà Lạt sẽ mang đến cho bạn trải nghiệm du lịch trọn vẹn và đáng nhớ. Đừng quên tận hưởng ẩm thực đặc sắc và ghé Tiệm Nướng & Chill Xóm Lèo tại 113 Huỳnh Tấn Phát, Phường 11, Đà Lạt để thưởng thức bữa tiệc nướng ngon miệng trong không gian ấm cúng. Chúc bạn có một hành trình thật tuyệt vời tại thành phố lãng mạn này! 🌸": "The Da Lat Tour is an ideal choice to discover the poetic beauty of the city of thousands of flowers without worrying about itineraries. With professional services, the tour provides a complete experience. Don't forget to visit Tiem Nuong & Chill Xom Leo at 113 Huynh Tan Phat, Ward 11 to enjoy a delicious BBQ feast in a cozy space. Wishing you an amazing journey! 🌸",
    "Đỉnh Langbiang Đà Lạt ở đâu, giá vé bao nhiêu, có gì hấp dẫn? Cùng khám phá cung đường, truyền thuyết tình yêu và top trải nghiệm thú vị tại đây.": "Where is Langbiang Peak Da Lat, what's the ticket price, and what's interesting? Let's trace the route, the love legend, and top exciting experiences here.",
    "Khám phá Thung lũng tình yêu thơ mộng, vui chơi thỏa thích và đừng quên ghé Tiệm nướng & Chill Xóm Lèo để khép lại hành trình Đà Lạt thật trọn vẹn.": "Discover the poetic Valley of Love, have endless fun, and don't forget to visit Tiem Nuong & Chill Xom Leo to perfectly wrap up your Da Lat journey.",
    "Cổng trời Bali Đà Lạt – điểm check-in cực chill giữa thiên nhiên, kết hợp khám phá tiệm nướng xóm lèo để chuyến đi thêm trọn vẹn và đáng nhớ hơn.": "Bali Heaven Gate Da Lat – an ultra chill check-in spot among nature, combine this with visiting Xom Leo's BBQ place to make the trip memorable.",
    "Khám phá homestay Đà Lạt đẹp, view rừng thông, giá cả hợp lý và gần trung tâm. Đừng quên ghé Tiệm Nướng & Chill Xóm Lèo – quán nướng Đà Lạt được yêu thích.": "Discover beautiful Da Lat homestays with pine forest views, reasonable prices, and city center access. Don't forget to drop by Tiem Nuong & Chill Xom Leo – a beloved Da Lat BBQ.",
    "🌟 Đà Lạt về đêm lung linh, huyền diệu với không gian chill đầy lãng mạn. Tiệm Nướng & Chill Xóm Lèo là điểm đến không thể bỏ lỡ, nơi bạn vừa thưởng thức món nướng thơm ngon, vừa ngắm tàu đêm và ánh đèn nhà lồng rực rỡ. Hãy ghé thăm để tận hưởng trọn vẹn vẻ đẹp Đà Lạt về đêm!": "🌟 Da Lat at night is sparkling and magical with a romantic chill vibe. Tiem Nuong & Chill Xom Leo is a must-visit spot, where you can enjoy delicious BBQ while watching night trains and greenhouse lights. Visit to fully enjoy Da Lat's night beauty!",
    "Khám phá Đà Lạt 2025 với danh sách địa điểm đẹp và món ngon nổi tiếng. Recommended chi tiết giúp bạn biết nên đi đâu, ăn gì khi du lịch Đà Lạt.": "Discover Da Lat 2025 with a list of beautiful spots and famous dishes. We recommend details helping you know where to go and what to eat.",
    "Đà Lạt luôn là điểm đến lý tưởng cho những ai yêu thích thiên nhiên và không khí trong lành. Hy vọng những kinh nghiệm chia sẻ ở trên sẽ giúp bạn có một chuyến đi trọn vẹn và đáng nhớ. Đừng quên ghé Tiệm Nướng & Chill Xóm Lèo tại 113 Huỳnh Tấn Phát để tận hưởng món ăn ngon và không gian ấm áp. Chúc bạn có những khoảnh khắc tuyệt vời tại thành phố ngàn hoa!": "Da Lat is an ideal destination for those who love nature. Hope the experiences shared will help your trip become memorable. Don't forget to drop by Tiem Nuong & Chill Xom Leo at 113 Huynh Tan Phat to enjoy delicious food. Have wonderful moments!",
    "Du lịch Đà Lạt là lựa chọn lý tưởng để tận hưởng không khí trong lành. Đừng quên ghé TIỆM NƯỚNG & CHILL XÓM LÈO để chill và thưởng thức món nướng ngon!": "Traveling to Da Lat is an ideal choice to enjoy the fresh air. Don't forget to visit TIEM NUONG & CHILL XOM LEO to chill and enjoy yummy BBQ items!",
    "Khám phá Đường Hầm Điêu Khắc – công trình nghệ thuật độc đáo giữa lòng Đà Lạt. Thưởng ngoạn cảnh đẹp rồi ghé Tiệm Nướng & Chill Xóm Lèo để chill đúng điệu!": "Discover the Clay Tunnel – a unique art structure in Da Lat. Enjoy the scenery and drop by Tiem Nuong & Chill Xom Leo to chill out perfectly!",
    "Khám phá địa điểm ăn sáng ở Đà Lạt hấp dẫn, đậm chất địa phương. Recommended: ghé Tiệm nướng & Chill Xóm Lèo để có những trải nghiệm chill đúng điệu.": "Discover attractive local breakfast spots in Da Lat. Recommended: visit Tiem Nuong & Chill Xom Leo for a true chill experience.",
    "Khám phá chợ đêm Đà Lạt – thiên đường ẩm thực, mua sắm và sống ảo giữa lòng thành phố mộng mơ. Đừng quên ghé Tiệm Nướng & Chill Xóm Lèo nhé!": "Discover Da Lat Night Market – a food, shopping, and photo paradise in the dreamy city. Don't forget to visit Tiem Nuong & Chill Xom Leo!",
    "Khám phá cánh đồng hoa cẩm tú cầu Đà Lạt, sống ảo cực chill rồi ghé Tiệm Nướng & Chill Xóm Lèo trải nghiệm săn xe lửa. Gọi 076.45.27.336 để đặt bàn ngay": "Discover Da Lat's hydrangea fields, take cinematic photos, then visit Tiem Nuong & Chill Xom Leo for train hunting. Call 076.45.27.336 to book a table.",
    "Đà Lạt là điểm đến lý tưởng cho những ai yêu thích sự bình yên, lãng mạn. Nơi đây nổi bật với khí hậu se lạnh quanh năm, cảnh quan thơ mộng và nền ẩm thực phong phú, mang đến trải nghiệm khó quên cho du khách.": "Da Lat is an ideal destination for peace and romance. Standing out with chill year-round weather, poetic scenes, and rich cuisine, it provides an unforgettable experience.",
    "Tiệm Nướng & Chill Xóm Lèo – quán nướng Đà Lạt view đẹp, không gian ấm cúng, menu đa dạng, giá hợp lý. Thưởng thức món ngon giữa trời se lạnh khó quên!": "Tiem Nuong & Chill Xom Leo – a Da Lat BBQ spot with a beautiful view, cozy space, diverse menu, and reasonable prices. Enjoying delicacies in the chilly weather is unforgettable!",
    "Món ngon Đà Lạt là sự hòa quyện giữa hương vị truyền thống và hiện đại, nổi bật với bánh tráng nướng, nem nướng và không gian chill tại Xóm Lèo.": "Da Lat delicacies are a harmony between traditional and modern flavors, highlighted by grilled rice paper, grilled sausage, and the chill space at Xom Leo.",
    "Top 11 địa điểm chill ở Đà Lạt để sống ảo, thư giãn, check-in. Recommended chỗ đi chơi Đà Lạt yên tĩnh, nổi bật có Tiệm Nướng & Chill Xóm Lèo!": "Top 11 chill locations in Da Lat for taking photos, relaxing, and checking in. Recommended quiet places, prominently featuring Tiem Nuong & Chill Xom Leo!",
    "Đà Lạt không chỉ làm say mê du khách bởi cảnh đẹp mà còn bởi nền ẩm thực đa dạng, phong phú. Dù là món ăn đường phố hay những bữa tiệc nướng ấm cúng tại 🔥 Tiệm Nướng & Chill Xóm Lèo, chắc chắn bạn sẽ có những trải nghiệm ẩm thực khó quên. Hãy lên kế hoạch ngay để thưởng thức tất cả những món ngon này trong hành trình đến Đà Lạt nhé! 🌸": "Da Lat fascinates tourists not only with its beauty but also with diverse cuisine. Whether it's street food or cozy BBQ feasts at 🔥 Tiem Nuong & Chill Xom Leo, you will have unforgettable culinary experiences. Plan now to enjoy it all in your journey! 🌸",
    "Khám phá Đà Lạt trọn vẹn hơn với ẩm thực nướng! 🔥 Đừng quên ghé Tiệm Nướng & Chill Xóm Lèo để thưởng thức món nướng thơm ngon trong không gian ấm cúng giữa tiết trời se lạnh. Lên kế hoạch ngay hôm nay!": "Discover Da Lat perfectly through grilled cuisine! 🔥 Don't forget to visit Tiem Nuong & Chill Xom Leo to enjoy delicious BBQ in a cozy space among the cold weather. Plan today!",
    "Đà Lạt luôn là điểm đến lý tưởng để bạn tận hưởng không gian yên bình, khám phá vẻ đẹp thiên nhiên và nền văn hóa đặc sắc. Đừng quên ghé qua 🔥 Tiệm Nướng & Chill Xóm Lèo để thư giãn trong không gian chill và thưởng thức các món nướng thơm ngon. Đây chắc chắn sẽ là điểm nhấn hoàn hảo cho hành trình của bạn tại thành phố ngàn hoa!": "Da Lat is always an ideal spot for you to enjoy a peaceful space. Don't forget to visit 🔥 Tiem Nuong & Chill Xom Leo to relax and enjoy delicious BBQs. This will be the perfect highlight for your journey in the city of a thousand flowers!",
    "Khám phá những quán cà phê đẹp ở Đà Lạt với view tuyệt đẹp, không gian thoáng mát, phù hợp để thư giãn và sống ảo cùng bạn bè.": "Discover beautiful coffee shops in Da Lat with stunning views and airy spaces, suitable for relaxing and taking amazing photos with friends.",
    "Đà Lạt là nơi hội tụ của cảnh sắc thiên nhiên, văn hóa và ẩm thực phong phú. Dù là lần đầu đến hay đã ghé thăm nhiều lần, thành phố này vẫn luôn mang đến những trải nghiệm thú vị và mới mẻ. Đừng quên ghé qua các địa điểm nổi tiếng trên, và đặc biệt là thưởng thức bữa ăn ngon tại Tiệm Nướng & Chill Xóm Lèo để chuyến đi của bạn thêm trọn vẹn! 🌸": "Da Lat converges beautiful natural scenery, culture, and cuisine. Even if it's your first time or repeated visits, it always brings exciting feelings. Don't forget to drop by top destinations, specifically Tiem Nuong & Chill Xom Leo, to fulfill your trip! 🌸",
    "Đà Lạt hấp dẫn không chỉ bởi cảnh đẹp mà còn bởi ẩm thực đa dạng. Nếu chưa biết ăn gì, hãy tham khảo danh sách trên để có trải nghiệm đáng nhớ! Đừng quên ghé Tiệm nướng & Chill Xóm Lèo để thưởng thức món nướng thơm ngon trong không gian ấm cúng! 🔥🍢": "Da Lat is attractive not just because of its scenery but also its diverse cuisine. If you don't know what to eat, refer to the list above! Remember to visit Tiem Nuong & Chill Xom Leo to enjoy savory meats in a cozy environment! 🔥🍢",
    "Khám phá top 9 địa điểm chill ở Đà Lạt 2025: săn mây, cà phê sống ảo, cắm trại, quán nướng chill cực chất cho trải nghiệm thư giãn & check-in đỉnh cao.": "Discover top 9 chill destinations in Da Lat 2025: cloud hunting, cinematic cafes, camping, and ultra chill BBQ spots for a relaxing experience.",
    "Khám phá Nhà thờ Con Gà Đà Lạt – biểu tượng kiến trúc Pháp cổ nổi tiếng. Xem ngay giờ lễ, đường đi, kinh nghiệm tham quan và địa điểm ăn uống cực chill gần đó.": "Discover Rooster Church Da Lat – a famous ancient French symbol. Check mass times, routes, visiting experiences, and nearby ultra chill dining spots.",
    "Khám phá du lịch Đà Lạt với loạt địa điểm check-in hot: quán cà phê, đồi săn mây, tiệm nướng chill. Cập nhật ngay để có chuyến đi đáng nhớ! 🌿✨": "Discover Da Lat travel with a series of hot check-in locations: cafes, cloud hunting hills, and chill BBQs. Update now for a memorable trip! 🌿✨",
    "Khám phá Xóm Lèo Đà Lạt về đêm – không gian chill đậm chất vintage, ẩm thực đặc sắc và Tiệm Nướng & Chill cực hút khách giữa khung cảnh mộng mơ.": "Discover Xom Leo Da Lat at night – an essential vintage chill space featuring excellent cuisine and highly attractive Tiem Nuong & Chill among dreamy scenery.",
    "Khám phá Dinh Bảo Đại Đà Lạt – công trình kiến trúc Pháp cổ, nơi lưu giữ dấu ấn vua Bảo Đại. Giá vé, giờ mở cửa, trải nghiệm check-in hấp dẫn.": "Discover Bao Dai Palace Da Lat – an old French architectural structure, keeping the marks of King Bao Dai. Ticket prices, hours, and engaging experiences.",
    "Dù chỉ với 2 ngày 1 đêm, Đà Lạt vẫn mang đến cho bạn những trải nghiệm đáng nhớ. Từ khung cảnh thiên nhiên thơ mộng, ẩm thực phong phú, đến các điểm check-in lung linh, hành trình ngắn này sẽ giúp bạn thư giãn và làm mới bản thân. Đừng quên ghé thăm 🔥 Tiệm Nướng & Chill Xóm Lèo để tận hưởng hương vị độc đáo và lưu lại những kỷ niệm đẹp cùng bạn bè, gia đình. Đà Lạt luôn chào đón bạn với không khí trong lành và những trải nghiệm tuyệt vời!": "Even with just 2 Days 1 Night, Da Lat still gives you memorable experiences. From poetic nature, rich cuisine, to sparkling check-in points, this short trip helps you relax. Don't forget to visit 🔥 Tiem Nuong & Chill Xom Leo to enjoy unique favors and save sweet memories with friends and family. Da Lat welcomes you with fresh air!",
    "Trải nghiệm Đà Lạt – Thành phố lãng mạn với thiên nhiên tuyệt đẹp và ẩm thực phong phú. Đừng quên ghé qua TIỆM NƯỚNG & CHILL XÓM LÈO để thưởng thức món nướng thơm ngon trong không gian chill lý tưởng.": "Experience Da Lat – A romantic city with beautiful nature and diverse cuisine. Don't forget to visit TIEM NUONG & CHILL XOM LEO to savor tasty BBQ in an ideal chill space.",
    "Đà Lạt chơi ở đâu? Đừng quên ghé Tiệm Nướng & Chill Xóm Lèo để thưởng thức món ngon và chill giữa không gian cực “đã” trong lòng thành phố mộng mơ!": "Where to play in Da Lat? Don't forget to visit Tiem Nuong & Chill Xom Leo to enjoy meals and chill amidst an absolutely 'awesome' space within the dreamy city!",
    "Đà Lạt luôn biết cách làm mới mình với những địa điểm và trải nghiệm thú vị, hấp dẫn. Hy vọng bài viết trên sẽ giúp bạn có thêm những gợi ý tuyệt vời cho chuyến đi sắp tới. Đừng quên ghé Tiệm Nướng & Chill Xóm Lèo để thưởng thức các món ngon và tận hưởng không gian thư giãn. Chúc bạn có một hành trình tràn đầy kỷ niệm tại thành phố ngàn hoa! 🌸": "Da Lat always knows how to renew itself with exciting destinations and experiences. Hope the post will give you wonderful ideas for your incoming trips. Don't forget to swing by Tiem Nuong & Chill Xom Leo for savory treats and a relaxing space. Wishing you a trip full of memories in the city of a thousand flowers! 🌸"
}

def escape_regex(text):
    words = text.split()
    return r'\s+'.join([re.escape(w).replace(r'\ ', r'\s+') for w in words])

missing = []

with open('blog-en.html', 'r', encoding='utf-8') as f:
    html = f.read()

for vi_str, en_str in translation_map.items():
    pattern = escape_regex(vi_str)
    # Be more flexible - allow match anywhere, ignoring case
    try:
        html, num_subs = re.subn(pattern, en_str, html, flags=re.IGNORECASE)
        if num_subs == 0:
            # Maybe it contains special chars like "..." or "!" that got weird? Just simple replace
            if vi_str in html:
                html = html.replace(vi_str, en_str)
            else:
                missing.append(vi_str)
    except Exception as e:
        print(f"Failed pattern {pattern}: {e}")

with open('blog-en.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Translated all missing blog texts.")
if missing:
    print(f"Failed to find {len(missing)} strings: {missing}")

