"""Translate all remaining Vietnamese text in menu-en.html"""
import re

with open('menu-en.html', 'r', encoding='utf-8') as f:
    content = f.read()

translations = [
    # Filter tabs
    ('data-filter="Lẩu"', 'data-filter="Hotpot"'),
    ('>Lẩu</button>', '>Hotpot</button>'),
    ('data-filter="Bia"', 'data-filter="Beer"'),
    ('>Bia</button>', '>Beer</button>'),
    ('data-filter="Rượu"', 'data-filter="Wine"'),
    ('>Rượu</button>', '>Wine</button>'),
    
    # Data categories
    ('data-category="Lẩu"', 'data-category="Hotpot"'),
    ('data-category="Bia"', 'data-category="Beer"'),
    ('data-category="Rượu"', 'data-category="Wine"'),
    
    # Menu item names - Food
    ('>Ốc Nhồi Thịt<', '>Stuffed Snails with Pork<'),
    ('alt="Ốc Nhồi Thịt"', 'alt="Stuffed Snails with Pork"'),
    ('>Cá Tầm Lắc<', '>Shaking Sturgeon<'),
    ('alt="Cá Tầm Lắc"', 'alt="Shaking Sturgeon"'),
    ('>Cá Tầm Nướng Muối Ớt<', '>Salt & Chili Roasted Sturgeon<'),
    ('alt="Cá Tầm Nướng Muối Ớt"', 'alt="Salt and Chili Roasted Sturgeon"'),
    ('>Cánh Gà Chiên Nước Mắm<', '>Fish Sauce Fried Chicken Wings<'),
    ('alt="Cánh Gà Chiên Nước Mắm"', 'alt="Fish Sauce Fried Chicken Wings"'),
    ('>Gà Nướng Lá É<', '>Grilled Chicken with Basil Leaves<'),
    ('alt="Gà Nướng Lá É"', 'alt="Grilled Chicken with Basil Leaves"'),
    ('>Bò Bít Tết<', '>Beef Steak<'),
    ('alt="Bò Bít Tết"', 'alt="Beef Steak"'),
    ('>Nạm Bò Nướng Tỏi<', '>Garlic Grilled Beef Flank<'),
    ('alt="Nạm Bò Nướng Tỏi"', 'alt="Garlic Grilled Beef Flank"'),
    ('>Bê Xào Lá Lốt<', '>Stir-Fried Veal with Wild Betel Leaves<'),
    ('alt="Bê Xào Lá Lốt"', 'alt="Stir-Fried Veal with Wild Betel Leaves"'),
    ('>Da Gà Nướng<', '>Grilled Chicken Skin<'),
    ('alt="Da Gà Nướng"', 'alt="Grilled Chicken Skin"'),
    ('>Xúc Xích Nướng<', '>Grilled Sausage<'),
    ('alt="Xúc Xích Nướng"', 'alt="Grilled Sausage"'),
    ('>Nem Nướng Đà Lạt<', '>Da Lat Grilled Pork Rolls<'),
    ('alt="Nem Nướng Đà Lạt"', 'alt="Da Lat Grilled Pork Rolls"'),
    ('>Bắp Xào Tôm Khô<', '>Corn Stir-Fried with Dried Shrimp<'),
    ('alt="Bắp Xào Tôm Khô"', 'alt="Corn Stir-Fried with Dried Shrimp"'),
    ('>Khoai Lang Nướng Bơ Mật Ong<', '>Honey Butter Roasted Sweet Potato<'),
    ('alt="Khoai Lang Nướng Bơ Mật Ong"', 'alt="Honey Butter Roasted Sweet Potato"'),
    ('>Tôm Nướng Muối Ớt<', '>Salt & Chili Grilled Shrimp<'),
    ('alt="Tôm Nướng Muối Ớt"', 'alt="Salt and Chili Grilled Shrimp"'),
    ('>Mực Nướng Muối Ớt<', '>Salt & Chili Grilled Squid<'),
    ('alt="Mực Nướng Muối Ớt"', 'alt="Salt and Chili Grilled Squid"'),
    ('>Cơm Rang Bò<', '>Beef Fried Rice<'),
    ('alt="Cơm Rang Bò"', 'alt="Beef Fried Rice"'),
    ('>Cơm Chiên Trứng<', '>Egg Fried Rice<'),
    ('alt="Cơm Chiên Trứng"', 'alt="Egg Fried Rice"'),
    ('>Mỳ Xào Hải Sản<', '>Seafood Stir-Fried Noodles<'),
    ('alt="Mỳ Xào Hải Sản"', 'alt="Seafood Stir-Fried Noodles"'),
    ('>Mỳ Xào Bò<', '>Beef Stir-Fried Noodles<'),
    ('alt="Mỳ Xào Bò"', 'alt="Beef Stir-Fried Noodles"'),
    ('>Rau Xào Thập Cẩm<', '>Mixed Stir-Fried Vegetables<'),
    ('alt="Rau Xào Thập Cẩm"', 'alt="Mixed Stir-Fried Vegetables"'),
    
    # Hotpot items
    ('>Lẩu Cá Tầm<', '>Sturgeon Hotpot<'),
    ('alt="Lẩu Cá Tầm"', 'alt="Sturgeon Hotpot"'),
    ('>Lẩu Gà Thả Vườn<', '>Free-Range Chicken Hotpot<'),
    ('alt="Lẩu Gà Thả Vườn"', 'alt="Free-Range Chicken Hotpot"'),
    
    # Bar snacks
    ('>Phô Mai Que<', '>Cheese Sticks<'),
    ('alt="Phô Mai Que"', 'alt="Cheese Sticks"'),
    ('>Khoai Tây Chiên<', '>French Fries<'),
    ('alt="Khoai Tây Chiên"', 'alt="French Fries"'),
    ('>Trứng Cút Lộn Xào Me<', '>Quail Eggs in Tamarind Sauce<'),
    ('alt="Trứng Cút Lộn Xào Me"', 'alt="Quail Eggs in Tamarind Sauce"'),
    ('>Chả Giò Hải Sản<', '>Seafood Spring Rolls<'),
    ('alt="Chả Giò Hải Sản"', 'alt="Seafood Spring Rolls"'),
    ('>Đậu Hũ Chiên Giòn<', '>Crispy Fried Tofu<'),
    ('alt="Đậu Hũ Chiên Giòn"', 'alt="Crispy Fried Tofu"'),
    ('>Há Cảo Chiên<', '>Fried Dumplings<'),
    ('alt="Há Cảo Chiên"', 'alt="Fried Dumplings"'),
    
    # Tea / Drinks
    ('>Trà Đào<', '>Peach Tea<'),
    ('alt="Trà Đào"', 'alt="Peach Tea"'),
    ('>Trà Vải<', '>Lychee Tea<'),
    ('alt="Trà Vải"', 'alt="Lychee Tea"'),
    ('>Trà Chanh Leo<', '>Passion Fruit Tea<'),
    ('alt="Trà Chanh Leo"', 'alt="Passion Fruit Tea"'),
    ('>Trà Bí Đao<', '>Winter Melon Tea<'),
    ('alt="Trà Bí Đao"', 'alt="Winter Melon Tea"'),
    ('>Trà Atiso<', '>Artichoke Tea<'),
    ('alt="Trà Atiso"', 'alt="Artichoke Tea"'),
    ('>Trà Gừng<', '>Ginger Tea<'),
    ('alt="Trà Gừng"', 'alt="Ginger Tea"'),
    
    # Water / Soda
    ('>Nước Suối<', '>Mineral Water<'),
    ('alt="Nước Suối"', 'alt="Mineral Water"'),
    
    # Beer names (keep Vietnamese brand names but add context)
    ('>Tiger Bạc<', '>Tiger Silver<'),
    ('alt="Tiger Bạc"', 'alt="Tiger Silver"'),
    ('>Tiger Nâu<', '>Tiger Brown<'),
    ('alt="Tiger Nâu"', 'alt="Tiger Brown"'),
    ('>Sài Gòn Xanh', '>Saigon Green'),
    ('alt="Sài Gòn Xanh', 'alt="Saigon Green'),
    ('>Sài Gòn Chill', '>Saigon Chill'),
    ('alt="Sài Gòn Chill"', 'alt="Saigon Chill"'),
    ('>Sài Gòn Lager', '>Saigon Lager'),
    ('alt="Sài Gòn Lager"', 'alt="Saigon Lager"'),
    ('>Heineken Lùn', '>Heineken Small'),
    ('alt="Heineken Lùn"', 'alt="Heineken Small"'),
    
    # Wine / Spirits
    ('>Rượu Mơ Hương', '>Apricot Wine Peach'),
    ('Đào (18%)</h3>', 'Bloom (18%)</h3>'),
    ('alt="Rượu Mơ Hương Đào (18%)"', 'alt="Apricot Wine Peach Bloom 18%"'),
    ('>Rượu Mơ 300ml', '>Plum Wine 300ml'),
    ('alt="Rượu Mơ 300ml', 'alt="Plum Wine 300ml'),
    ('>Rượu Mơ 350ml', '>Plum Wine 350ml'),
    ('alt="Rượu Mơ 350ml', 'alt="Plum Wine 350ml'),
    ('>Rượu Mơ 500ml', '>Plum Wine 500ml'),
    ('alt="Rượu Mơ 500ml', 'alt="Plum Wine 500ml'),
    ('>Rượu Vang', '>Red Wine'),
    ('alt="Rượu Vang', 'alt="Red Wine'),
    ('>Rượu Táo Mèo', '>Wild Apple Wine'),
    ('alt="Rượu Táo Mèo', 'alt="Wild Apple Wine'),
    ('>Rượu Mơ Ume', '>Ume Plum Wine'),
    ('alt="Rượu Mơ Ume', 'alt="Ume Plum Wine'),
    ('Soju Mix Vị', 'Soju Mix Flavors'),
    ('alt="Soju Mix Vị', 'alt="Soju Mix Flavors'),
    
    # Descriptions
    ('Giải nhiệt cao nguyên', 'Highland refresher'),
    ('Hương vị hấp dẫn wonderful', 'Refreshing taste'),
    ('Bình rượu êm say', 'Smooth and mellow'),
    ('Mơ nặng chill', 'Strong plum kick'),
    ('Cho cặp đôi', 'Perfect for two'),
    ('Uống say mềm', 'Blissfully smooth'),
    ('Soju chuẩn Hàn', 'Authentic Korean soju'),
    ('Rượu vang cực đã', 'Delightfully bold wine'),
    ('Cao cấp vang ngoại', 'Premium imported wine'),
    ('Táo mèo nồng nàn', 'Rich wild apple aroma'),
    ('Mơ ume đậm vị mộc', 'Deep authentic ume flavor'),
    ('Nhẹ nhàng chớm say', 'Gently intoxicating'),
    ('Thượng hạng', 'Premium quality'),
    ('Đặc biệt ngon', 'Exceptionally delicious'),
    ('Tươi ngon', 'Fresh and delicious'),
    ('Hương vị đặc trưng', 'Distinctive flavor'),
    ('Giòn rụm', 'Crispy and crunchy'),
    ('Béo ngậy', 'Rich and creamy'),
    ('Đậm đà', 'Rich & savory'),
    ('Nóng hổi', 'Piping hot'),
    ('Thơm lừng', 'Fragrant'),
    ('Chuẩn vị', 'Authentic flavor'),
    ('Ngọt thanh', 'Subtly sweet'),
    ('Ấm bụng', 'Warming'),
    ('Đặc sản Đà Lạt', 'Da Lat specialty'),
    ('Đặc sản địa phương', 'Local specialty'),
    ('Món nhà làm', 'Homemade style'),
    ('Gia vị đặc biệt', 'Special seasoning'),
    ('Nướng than hồng', 'Charcoal grilled'),
    ('Thịt bò Mỹ nhập khẩu', 'Imported US beef'),
    ('Cá tầm tươi Đơn Dương', 'Fresh sturgeon from Don Duong'),
    ('Gà thả vườn', 'Free-range chicken'),
    ('Lá é thơm', 'Fragrant basil leaves'),
    ('Phong cách Đà Lạt', 'Da Lat style'),
    ('Combo no nê', 'Hearty combo'),
    ('Dùng kèm rau sống', 'Served with fresh greens'),
    ('Nướng lửa than', 'Charcoal-fired'),
    ('Lẩu nóng', 'Hot pot'),
    ('Combo cho nhóm', 'Group combo'),
]

for vn, en in translations:
    content = content.replace(vn, en)

with open('menu-en.html', 'w', encoding='utf-8') as f:
    f.write(content)

# Count remaining
vn_count = len(re.findall(r'[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]', content))
print(f"Translated menu-en.html! Remaining VN chars: {vn_count}")
