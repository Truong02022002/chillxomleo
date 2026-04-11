import glob
import re

files = glob.glob('*-en.html') + glob.glob('blog/*-en.html')

found = False
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # find href="something.html"
    links = re.findall(r'href="([^"]+\.html)"', content)
    for link in links:
        if not link.endswith('-en.html'):
            if not link.startswith('http'):
                print(f"File {f} contains leak to vn: {link}")
                found = True

if not found:
    print("No VN links found inside EN files.")
