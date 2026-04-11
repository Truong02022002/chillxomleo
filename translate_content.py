import os
import glob

replacements = [
    # about-en.html & index.html sections
    ("Khám Phá · Cảm Nhận · Lưu Giữ", "Explore · Feel · Cherish"),
    ("Trải Nghiệm Quán Nướng View Đẹp Đà Lạt – Hoàng Hôn, Xe Lửa & Than Hồng", "Experience Da Lat's Best BBQ - Sunset, Train & Charcoal"),
    ("Không chỉ là một bữa ăn. Đây là tập hợp những khoảnh khắc độc đáo chỉ có thể tìm thấy tại", "More than just a meal. This is a collection of unique moments only found at"),
    ("Lượt thích", "Likes"),
    ("Giờ vàng hoàng hôn", "Golden Sunset Hour"),
    ("5 Điều Đặc Biệt", "5 Special Things"),
    ("Những Khoảnh Khắc <br/><span class=\"italic font-light text-foreground/40\">Không Thể Quên</span>", "Unforgettable <br/><span class=\"italic font-light text-foreground/40\">Moments</span>"),
    ("Click vào từng trải nghiệm để xem video thực tế tại TikTok của chúng tôi.", "Click on each experience to watch the real video on our TikTok."),
    ("Khoảnh Khắc Vàng", "Golden Moment"),
    ("Hoàng Hôn &quot;Cục Trứng Muối&quot;", "The &quot;Salted Egg&quot; Sunset"),
    ("Mặt trời đỏ rực như lòng đỏ trứng muối chìm dần sau dãy đồi xanh ngắt của Đà Lạt. Giờ vàng từ 4:30 – 5:30 chiều là thời điểm không thể bỏ lỡ — đẹp đến nghẹt thở.", "The blazing red sun fades behind Da Lat's green hills. Golden hour from 4:30 – 5:30 PM is unmissable — breathtakingly beautiful."),
    ("Đến trước 4:30 PM để chọn bàn đẹp", "Arrive before 4:30 PM for the best table"),
    ("Độc quyền · Chỉ ở đây", "Exclusive · Only Here"),
    ("Trải Nghiệm Độc Nhất", "Unique Experience"),
    ("Đoàn Tàu Lướt Qua Bên Cạnh", "The Passing Train Beside You"),
    ("Trong khi bạn đang nướng thịt và nhâm nhi ly rượu, một đoàn tàu cổ điển bỗng lướt sát qua — đủ gần để cảm nhận làn gió và tiếng còi vang. Trải nghiệm chỉ có duy nhất ở Xóm Lèo.", "While grilling and sipping wine, a vintage train suddenly passes by — close enough to feel the breeze and hear the whistle. An experience only available at Xom Leo."),
    ("Tàu chạy nhiều lần mỗi ngày, phụ thuộc lịch trình", "Train runs multiple times daily, depending on schedule"),
    ("Đêm Rực Ánh Đèn", "Glowing Night Lights"),
    ("Thung Lũng Nhà Lồng Lấp Lánh", "The Sparkling Greenhouses Valley"),
    ("Khi màn đêm buông xuống, hàng nghìn nhà kính trồng rau ở thung lũng bên dưới bừng sáng như một dải ngân hà trên mặt đất. Một cảnh tượng huyền ảo chỉ có thể thấy từ Xóm Lèo.", "As night falls, thousands of greenhouses in the valley below light up like a galaxy on earth. A magical sight to behold."),
    ("Đẹp nhất lúc 6:30 – 8:00 PM", "Best viewed from 6:30 – 8:00 PM"),
    ("Ảnh thực tế · Không chỉnh sửa", "Real Photo · No Edits"),
    ("Chốn Lãng Mạn", "Romantic Spot"),
    ("Điểm Hẹn Của Những Tình Yêu", "Rendezvous for Romance"),
    ("Không khí lãng mạn tự nhiên từ khói bếp, ánh lửa, tiếng tàu và bầu trời đầy sao đã biến Xóm Lèo thành nơi nhiều cặp đôi chọn để cầu hôn. Và câu trả lời luôn là... có.", "The natural romantic atmosphere of smoke, firelight, passing trains, and a starry sky makes Xom Leo the choice for many proposals. And the answer is always... yes."),
    ("Đặt bàn góc view đẹp để có khoảnh khắc hoàn hảo", "Reserve a scenic table for the perfect moment"),
    ("Nhiều cặp đôi cầu hôn thành công", "Many successful proposals"),
    ("Check-in Nổi Tiếng", "Famous Check-in"),
    ("Hot Spot Viral Của Đà Lạt", "Da Lat's Viral Hotspot"),
    ("74.8K followers trên TikTok và hơn 2.000 đánh giá Google không tự nhiên mà có. Xóm Lèo là địa điểm check-in viral nhất Đà Lạt nhờ sự kết hợp hoàn hảo giữa thức ăn ngon và khung cảnh không đâu có được.", "74.8K TikTok followers and 2,000+ Google Reviews don't lie. Xom Leo is Da Lat's most viral check-in spot due to perfect food and unmatched scenery."),
    ("Địa chỉ đúng: 113 Huỳnh Tấn Phát, P11, Đà Lạt", "Exact Address: 113 Huynh Tan Phat, Ward 11, Da Lat"),
    ("Lịch Trình Lý Tưởng", "Ideal Itinerary"),
    ("Một Ngày Tại <span class=\"italic font-light text-primary/70\">Xóm Lèo</span>", "A Day At <span class=\"italic font-light text-primary/70\">Xom Leo</span>"),
    ("Đến sớm", "Arrive Early"),
    ("Check-in, chọn bàn đẹp", "Check-in, secure a prime table"),
    ("Giờ vàng bắt đầu", "Golden Hour Starts"),
    ("Hoàng hôn &quot;trứng muối&quot; xuất hiện", "The 'salted egg' sunset appears"),
    ("Tàu lửa qua", "Train Passes By"),
    ("Đoàn tàu lướt sát bên bàn ăn", "Vintage train glides right by your table"),
    ("Lên bếp than", "Fire Up the Grill"),
    ("Nướng thịt, nhâm nhi đồ uống", "Grill meat, sip your drink"),
    ("Đêm xuống", "Night Falls"),
    ("Thung lũng nhà kính bừng sáng", "Greenhouse valley illuminates"),
    ("Chill đêm", "Nighttime Chill"),
    ("Ánh đèn thung lũng rực rỡ nhất", "The valley lights are at their brightest"),
    ("TikTok Nổi Bật", "Featured TikToks"),
    ("Video Thực Tế Từ <span class=\"italic text-primary/70\">Khách Hàng</span>", "Real Videos From <span class=\"italic text-primary/70\">Customers</span>"),
    ("Xem Tất Cả", "Watch All"),
    ("Ghim", "Pinned"),
    ("Hoàng hôn &amp; nhà lồng đêm", "Sunset &amp; Night Greenhouses"),
    ("Check-in viral Đà Lạt", "Viral Da Lat Check-in"),
    ("Hướng dẫn đường đến tiệm", "Directions to the Restaurant"),
    ("Sunset &quot;cục trứng muối&quot;", "&quot;Salted Egg&quot; Sunset"),
    ("Lịch tàu lửa qua tiệm", "Train Schedule"),
    ("Đến lúc 4PM và trải nghiệm", "Arrive at 4PM to Experience"),
    ("Cầu hôn lãng mạn tại tiệm", "Romantic Proposal"),
    ("Tàu lướt ngay cạnh bàn ăn", "Train gliding next to table"),
    ("Đừng Bỏ Lỡ", "Don't Miss Out"),
    ("Giữ Bàn View Tàu <br/><span class=\"italic font-light opacity-70\">Ngay Hôm Nay</span>", "Reserve a Train View Table <br/><span class=\"italic font-light opacity-70\">Today</span>"),
    ("Bàn view tàu và view hoàng hôn có số lượng giới hạn. Đặt trước để đảm bảo khoảnh khắc hoàn hảo nhất cho bạn.", "Train view and sunset seats are limited. Book in advance to guarantee your perfect moment."),
    ("Đặt Bàn Ngay", "Book a Table"),
    ("Xem TikTok", "Watch TikTok"),
    ("Tìm trên Google Maps với 2,000+ đánh giá", "Find us on Google Maps with 2,000+ reviews"),
    ("Xem đường đi", "Get Directions"),
    
    # menu-en.html
    ("Thực Đơn", "The Menu"),
    ("Thịt nướng, lẩu và những món chill", "BBQ Meat, Hotpot and Chill Dishes"),
    ("Món Bò & Heo", "Beef & Pork"),
    ("Hải Sản & Món Khác", "Seafood & Others"),
    ("Lẩu Xóm Lèo", "Xom Leo Hotpot"),
    ("Tráng Miệng & Nước", "Desserts & Drinks"),
    ("Bò Tảng Nướng Phô Mai Trứng Muối", "Block Beef BBQ with Salted Egg Cheese"),
    ("Lõi vai bò Úc thượng hạng, cắt tảng dày, nướng trực tiếp tại bàn. Quệt cùng sốt phô mai trứng muối béo ngậy độc quyền.", "Premium Australian beef chuck, thickly cut and grilled right at your table. Served with our exclusive rich salted egg cheese sauce."),
    ("Thêm", "Add to order"),
    ("Best Seller", "Best Seller"),
    ("Sườn Cây Thái Lan", "Thai Style BBQ Ribs"),
    ("Sườn heo tảng lớn ướp sốt chua cay kiểu Thái, nướng than hồng thơm lừng, thịt mềm mọng nước.", "Large pork ribs marinated in Thai spicy-sour sauce, grilled over charcoal, juicy and tender."),
    ("Gợi ý", "Recommended"),
    ("Ba Chỉ Bò Cuộn Kim Châm", "Beef Belly Enoki Rolls"),
    ("Món khai vị hoàn hảo. Ba chỉ bò Mỹ mỏng cuộn nấm kim châm giòn ngọt.", "The perfect appetizer. Thinly sliced US beef belly rolled with crunchy sweet enoki mushrooms."),
    ("Ba Chỉ Heo Nướng Ngũ Vị", "Five-Spice BBQ Pork Belly"),
    ("Thịt heo thái lát tẩm ướp 5 loại gia vị bí truyền của Xóm Lèo, nướng xém cạnh.", "Sliced pork marinated with Xom Leo's secret five-spice recipe, grilled with crispy edges."),
    ("Cá Tầm Nướng Muối Ớt", "Chili Salt Grilled Sturgeon"),
    ("Cá Tầm nguyên con tươi rói, thịt dai ngọt, nướng muối ớt xanh cay nồng đậm vị núi rừng.", "Fresh whole sturgeon, sweet and firm meat, grilled with authentic forest green chili salt."),
    ("Tôm Sú Nướng Phô Mai", "Cheese Grilled Black Tiger Shrimp"),
    ("Tôm sú biển size lớn, xẻ lưng nướng cùng phô mai Mozzarella chảy.", "Large sea tiger shrimp, butterflied and grilled with melting mozzarella cheese."),
    ("Mực Nang Nướng Sa Tế", "Satay Grilled Cuttlefish"),
    ("Mực nang dày mình, khứa ca rô, quệt sốt sa tế tôm cay xé lưỡi mồi bén.", "Thick cuttlefish scored and coated in fiery spicy shrimp satay sauce. Great with beers."),
    ("Lẩu Bò Atiso Đà Lạt", "Da Lat Artichoke Beef Hotpot"),
    ("Đặc sản không thể bỏ qua. Nước lẩu thanh ngọt từ hoa Atiso hầm sụn bò, thịt bò tươi nhúng kèm rau xanh Đà Lạt.", "A must-try specialty. Sweet clear broth from slow-cooked Artichoke and beef cartilage, with fresh beef and local veggies."),
    ("Lẩu Gà Lá É", "É Leaf Chicken Hotpot"),
    ("Nồi lẩu bốc khói nghi ngút, vị chua cay nhẹ của lá é trắng và măng chua, gà ta thịt chắc nhúng lẩu sưởi ấm đêm se lạnh.", "Steaming hotpot with the slightly sour and spicy taste of É leaves and bamboo shoots, firm free-range chicken perfect for chilly nights."),
    ("Xem Toàn Bộ Menu Món Khác", "View Full Menu for Other Dishes"),
    ("Trải nghiệm thực tế", "Real Experiences"),

    # about-us-en.html
    ("Về Chúng Tôi", "About Us"),
    ("Câu chuyện của Xóm Lèo", "The Story of Xom Leo"),
    ("Từ Một Ngọn Đồi Hoang...", "From a Wild Hill..."),
    ("Nhiều năm trước, khu vực Huỳnh Tấn Phát (Phường 11) chỉ là một ngọn đồi vắng vẻ, ít người qua lại", "Years ago, the Huynh Tan Phat area (Ward 11) was just a quiet, deserted hill"),
    ("Chỉ có những người dân địa phương mới biết đến vị trí này - một nơi có tầm nhìn bao quát toàn bộ thung lũng Trại Mát, nơi mặt trời lặn xuống đỏ rực mỗi buổi chiều, và cũng là nơi bạn có thể nhìn thấy trọn vẹn những chuyến tàu ga Trại Mát chạy xình xịch ngang qua.", "Only locals knew of this spot - a place with a panoramic view of the Trai Mat valley, where the sun sets deep red every afternoon, and where you can see the Trai Mat trains rumbling past."),
    ("Chúng tôi, những người trẻ yêu Đà Lạt", "We, the youths who love Da Lat"),
# Blog
    ("Kiến Thức & Chia Sẻ", "Knowledge & Sharing"),
    ("Trải nghiệm du lịch, ăn uống, và sống chậm tại Đà Lạt.", "Travel, dining, and slow living experiences in Da Lat."),
    ("Đọc Thêm", "Read More"),
    ("Ngày", "Date")
]

def translate_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    for vi_str, en_str in replacements:
        html = html.replace(vi_str, en_str)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)

for html_file in ['about-en.html', 'menu-en.html', 'about-us-en.html', 'blog-en.html']:
    translate_file(html_file)
print("Translated sections")
