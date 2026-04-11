import os
import re

files_to_sync = ['about.html', 'menu.html', 've-chung-toi.html', 'blog.html', 'en.html', 'about-en.html', 'menu-en.html', 'about-us-en.html', 'blog-en.html']

def get_block(text, start_tag, tags_to_count=("div",)):
    start_idx = text.find(start_tag)
    if start_idx == -1: return None
    
    depth = 0
    tag_pattern = re.compile(r'</?(?:' + '|'.join(tags_to_count) + r')\b[^>]*>')
    
    for match in tag_pattern.finditer(text, start_idx):
        tag = match.group(0)
        # Skip self-closing like <img .../> if any, but div/nav aren't.
        if tag.startswith('</'):
            depth -= 1
        elif not tag.endswith('/>'):
            depth += 1
            
        if depth == 0:
            return text[start_idx:match.end()]
    return None

with open('index.html', 'r', encoding='utf-8') as f:
    source = f.read()

# For Nav, we just count <nav> and </nav>
nav_block = get_block(source, '<nav id="navbar"', tags_to_count=('nav',))
# For Mobile Menu, we count <div> and </div>
mobile_menu_block = get_block(source, '<div id="mobile-menu"', tags_to_count=('div',))
# For Footer, we count <footer> and </footer>
footer_block = get_block(source, '<footer', tags_to_count=('footer',))

if not all([nav_block, mobile_menu_block, footer_block]):
    print("Block extraction from index.html failed")
    exit(1)

for fname in files_to_sync:
    if not os.path.exists(fname): continue
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    
    old_nav = get_block(content, '<nav id="navbar"', tags_to_count=('nav',))
    old_mobile = get_block(content, '<div id="mobile-menu"', tags_to_count=('div',))
    old_footer = get_block(content, '<footer', tags_to_count=('footer',))
    
    if old_nav: content = content.replace(old_nav, nav_block)
    if old_mobile: content = content.replace(old_mobile, mobile_menu_block)
    if old_footer: content = content.replace(old_footer, footer_block)
    
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Safe sync complete.")
