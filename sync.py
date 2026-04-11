import os
import re

files_to_sync = ['about.html', 'menu.html', 've-chung-toi.html', 'blog.html', 'en.html', 'about-en.html', 'menu-en.html', 'about-us-en.html', 'blog-en.html']

def extract_block(content, pattern):
    match = re.search(pattern, content, re.DOTALL)
    return match.group(0) if match else None

with open('index.html', 'r', encoding='utf-8') as f:
    source = f.read()

nav_block = extract_block(source, r'<nav id="navbar".*?</nav>')
mobile_menu_block = extract_block(source, r'<div id="mobile-menu".*?</div>\s*</div>\s*</div>')
# Better way to extract mobile menu: grab from <div id="mobile-menu" to the next <!--
mobile_menu_block = extract_block(source, r'<div id="mobile-menu".*?(?=<!--)')
footer_block = extract_block(source, r'<footer.*?</footer>')

if not all([nav_block, mobile_menu_block, footer_block]):
    print("Extraction failed")
    exit(1)

for fname in files_to_sync:
    if not os.path.exists(fname): continue
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'<nav id="navbar".*?</nav>', nav_block, content, flags=re.DOTALL)
    content = re.sub(r'<div id="mobile-menu".*?(?=<!--)', mobile_menu_block, content, flags=re.DOTALL)
    content = re.sub(r'<footer.*?</footer>', footer_block, content, flags=re.DOTALL)
    
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Synced {fname}")
