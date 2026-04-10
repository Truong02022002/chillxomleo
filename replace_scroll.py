import os
import re

html_files = []
for root, dirs, files in os.walk('e:\\tiemnuongchillxomleo\\project\\static-html-version'):
    for file in files:
        if file.endswith('.html'):
            html_files.append(os.path.join(root, file))

pattern = re.compile(r'\s*<!-- Scroll to Top \(Positioned\) -->\s*<button.*?onclick="window\.scrollTo\(\{top: 0, behavior: \'smooth\'\}\)".*?</button>', re.DOTALL)

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = pattern.sub('', content)
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file}")
