"""Fix remaining Vietnamese drink names and descriptions in menu-en.html"""
import re

with open('menu-en.html', 'r', encoding='utf-8') as f:
    content = f.read()

fixes = [
    # Schema/JSON-LD
    ('"Ba Chỉ Cuốn Nấm Kim Châm"', '"Beef Belly Enoki Rolls"'),
    ('"name": "Lẩu"', '"name": "Hotpot"'),
    
    # Remaining food descriptions
    ('Điểm nhấn protein', 'Protein-packed highlight'),
    ('Gấp đôi canxi', 'Double the calcium'),
    
    # Remaining food item
    ('>Cánh Gà Chiên\r\n', '>Fish Sauce Fried Chicken\r\n'),
    ('Nước Mắm</h3>', 'Wings</h3>'),
    
    # Tea items - Iced
    ('>Trà Vải Hạt', '>Lychee Chia Seed'),
    ('alt="Trà Vải Hạt Chia"', 'alt="Lychee Chia Seed Tea"'),
    ('>Trà Dứa Đào', '>Pineapple Peach Tea'),
    ('alt="Trà Dứa Đào"', 'alt="Pineapple Peach Tea"'),
    ('>Trà Trái Cây\r\nNhiệt Đới', '>Tropical Fruit\r\nTea'),
    ('alt="Trà Trái Cây Nhiệt Đới"', 'alt="Tropical Fruit Tea"'),
    ('>Trà Đào Cam Sả', '>Peach Orange Lemongrass Tea'),
    ('alt="Trà Đào Cam Sả"', 'alt="Peach Orange Lemongrass Tea"'),
    ('>Trà Tắc Xí Muội', '>Kumquat Preserved Plum Tea'),
    ('alt="Trà Tắc Xí Muội"', 'alt="Kumquat Preserved Plum Tea"'),
    ('>Trà Ổi Hồng', '>Pink Guava Tea'),
    ('alt="Trà Ổi Hồng"', 'alt="Pink Guava Tea"'),
    
    # Tea items - Hot
    ('>Trà Hoa Cúc Táo\r\nĐỏ', '>Chrysanthemum Red Date\r\nTea'),
    ('alt="Trà Hoa Cúc Táo Đỏ"', 'alt="Chrysanthemum Red Date Tea"'),
    ('>Trà Thảo Mộc', '>Herbal Tea'),
    ('alt="Trà Thảo Mộc"', 'alt="Herbal Tea"'),
    ('>Trà Gừng Táo Đỏ\r\nMật Ong', '>Ginger Red Date\r\nHoney Tea'),
    ('alt="Trà Gừng Táo Đỏ Mật Ong"', 'alt="Ginger Red Date Honey Tea"'),
    ('>Trà Chanh Nóng\r\nHạt Chia', '>Hot Lemon Chia\r\nSeed Tea'),
    ('alt="Trà Chanh Nóng Hạt Chia"', 'alt="Hot Lemon Chia Seed Tea"'),
    ('>Trà Lipton Nóng', '>Hot Lipton Tea'),
    ('alt="Trà Lipton Nóng"', 'alt="Hot Lipton Tea"'),
    
    # Tea descriptions
    ('Thanh mát', 'Cool and refreshing'),
    ('Hương dứa thơm', 'Fragrant pineapple aroma'),
    ('Cực kì healthy', 'Super healthy'),
    ('Khởi đầu mát lạnh', 'A cool fresh start'),
    ('Chua chua ngọt ngọt', 'Sweet and sour delight'),
    ('Ngọt ngào lãng mạn', 'Sweet and romantic'),
    ('Giữ ấm dạ dày', 'Warm your belly'),
    ('Thư giãn tâm hồn', 'Relax your soul'),
    ('Sưởi ấm đêm Đà Lạt', 'Warm up a Da Lat night'),
    ('Thơm nồng hạt chia', 'Aromatic with chia seeds'),
    
    # Soda items
    ('>Soda Việt Quốc', '>Vietnamese Soda'),
    ('alt="Soda Việt Quốc"', 'alt="Vietnamese Soda"'),
    ('Tươi mới rạng rỡ', 'Fresh and vibrant'),
    ('Chanh the lạnh', 'Cool lemon zest'),
    ('>Soda Dâu Tây', '>Strawberry Soda'),
    ('alt="Soda Dâu Tây"', 'alt="Strawberry Soda"'),
    ('Ngọt dịu', 'Gently sweet'),
    ('>Soda Đào', '>Peach Soda'),
    ('alt="Soda Đào"', 'alt="Peach Soda"'),
]

for vn, en in fixes:
    content = content.replace(vn, en)

with open('menu-en.html', 'w', encoding='utf-8') as f:
    f.write(content)

vn_count = len(re.findall(r'[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]', content))
print(f"Fixed remaining menu items! VN chars left: {vn_count}")
