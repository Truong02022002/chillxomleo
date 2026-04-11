import re
from html.parser import HTMLParser

class VNTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.texts = []
        self.skip = False
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'nav', 'footer', 'head'):
            self.skip = True
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'nav', 'footer', 'head'):
            self.skip = False
    def handle_data(self, data):
        if not self.skip:
            s = data.strip()
            if s and re.search(r'[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]', s):
                self.texts.append(s)

files = [
    'blog/da-lat-co-gi-top-dia-diem-chill-tai-da-lat-en.html',
    'blog/kham-pha-da-lat-thien-duong-nghi-duong-en.html',
    'blog/review-diem-den-da-lat-moi-nhat-nam-2025-en.html',
    'blog/thien-vien-truc-lam-en.html'
]

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    print(f'\n--- {f} ---')
    parser = VNTextExtractor()
    parser.feed(content)
    
    title_match = re.search(r'<title>(.*?)</title>', content)
    if title_match and re.search(r'[àáảã]', title_match.group(1)):
        print('TITLE:', title_match.group(1).strip())
    
    desc_match = re.search(r'<meta name="description" content="(.*?)">', content)
    if desc_match and re.search(r'[àáảã]', desc_match.group(1)):
        print('DESC:', desc_match.group(1).strip())
        
    for t in parser.texts:
        if 'Tiệm Nướng' not in t and 'Xóm' not in t and 'Huỳnh Tấn Ph' not in t and 'Quay lại' not in t and '000đ' not in t:
            print('TEXT:', repr(t))
