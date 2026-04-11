"""
Sync EN header/footer from en.html to all other EN pages.
Uses en.html as the reference source of truth.
"""
import os, re

# Read en.html as reference
with open('en.html', 'r', encoding='utf-8') as f:
    ref = f.read()

# Extract VN header from index.html for reference
with open('index.html', 'r', encoding='utf-8') as f:
    vi_ref = f.read()

# ===== EXTRACT REFERENCE SECTIONS FROM en.html =====

# 1. Desktop nav links (between the nav items div)
def extract_between(content, start, end):
    s = content.find(start)
    e = content.find(end, s + len(start))
    if s == -1 or e == -1:
        return None
    return content[s:e + len(end)]

# Extract navbar (from <!-- NAVBAR --> to </nav>)
nav_start = ref.find('<!-- NAVBAR -->')
nav_end = ref.find('</nav>', nav_start) + len('</nav>')
ref_nav = ref[nav_start:nav_end]

# Extract mobile menu (from <!-- MOBILE MENU to closing </div>)
mobile_start = ref.find('<!-- MOBILE MENU OVERLAY -->')
mobile_end = ref.find('</div>\r\n\r\n', mobile_start + 100)
if mobile_end == -1:
    mobile_end = ref.find('</div>\n\n', mobile_start + 100)
mobile_end += len('</div>')
ref_mobile = ref[mobile_start:mobile_end]

# Extract footer (from <!-- FOOTER --> to </footer>)
footer_start = ref.find('<!-- FOOTER -->')
footer_end = ref.find('</footer>', footer_start) + len('</footer>')
ref_footer = ref[footer_start:footer_end]

print(f"Reference nav length: {len(ref_nav)}")
print(f"Reference mobile length: {len(ref_mobile)}")
print(f"Reference footer length: {len(ref_footer)}")

# ===== SYNC TO OTHER EN FILES =====
def sync_file(filepath, is_blog=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Adjust paths for blog pages (need ../ prefix)
    nav = ref_nav
    mobile = ref_mobile
    footer = ref_footer
    
    if is_blog:
        # Replace href paths for blog subdir
        nav = nav.replace('href="en.html"', 'href="../en.html"')
        nav = nav.replace('href="about-en.html"', 'href="../about-en.html"')
        nav = nav.replace('href="menu-en.html"', 'href="../menu-en.html"')
        nav = nav.replace('href="about-us-en.html"', 'href="../about-us-en.html"')
        nav = nav.replace('href="blog-en.html"', 'href="../blog-en.html"')
        nav = nav.replace('href="index.html#booking"', 'href="../index.html#booking"')
        
        mobile = mobile.replace('href="en.html"', 'href="../en.html"')
        mobile = mobile.replace('href="about-en.html"', 'href="../about-en.html"')
        mobile = mobile.replace('href="menu-en.html"', 'href="../menu-en.html"')
        mobile = mobile.replace('href="about-us-en.html"', 'href="../about-us-en.html"')
        mobile = mobile.replace('href="blog-en.html"', 'href="../blog-en.html"')
        mobile = mobile.replace('href="index.html#booking"', 'href="../index.html#booking"')
        
        footer = footer.replace('href="en.html"', 'href="../en.html"')
        footer = footer.replace('href="about-en.html"', 'href="../about-en.html"')
        footer = footer.replace('href="menu-en.html"', 'href="../menu-en.html"')
        footer = footer.replace('href="about-us-en.html"', 'href="../about-us-en.html"')
        footer = footer.replace('href="blog-en.html"', 'href="../blog-en.html"')
        footer = footer.replace('href="index.html#booking"', 'href="../index.html#booking"')
        footer = footer.replace('src="js/', 'src="../js/')
        footer = footer.replace('src="css/', 'src="../css/')
    
    # Replace navbar
    old_nav_start = content.find('<!-- NAVBAR -->')
    old_nav_end = content.find('</nav>', old_nav_start) + len('</nav>')
    if old_nav_start != -1 and old_nav_end > old_nav_start:
        content = content[:old_nav_start] + nav + content[old_nav_end:]
    
    # Replace mobile menu
    old_mobile_start = content.find('<!-- MOBILE MENU OVERLAY -->')
    if old_mobile_start == -1:
        old_mobile_start = content.find('<!-- MOBILE MENU')
    if old_mobile_start != -1:
        # Find the end of mobile menu - it's followed by empty lines then main content
        # Look for the closing pattern
        old_mobile_end = content.find('</div>\r\n\r\n', old_mobile_start + 100)
        if old_mobile_end == -1:
            old_mobile_end = content.find('</div>\n\n', old_mobile_start + 100)
        if old_mobile_end != -1:
            old_mobile_end += len('</div>')
            content = content[:old_mobile_start] + mobile + content[old_mobile_end:]
    
    # Replace footer
    old_footer_start = content.find('<!-- FOOTER -->')
    old_footer_end = content.find('</footer>', old_footer_start) + len('</footer>')
    if old_footer_start != -1 and old_footer_end > old_footer_start:
        content = content[:old_footer_start] + footer + content[old_footer_end:]
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Process main EN pages
count = 0
for fn in ['about-en.html', 'about-us-en.html', 'menu-en.html', 'blog-en.html']:
    if os.path.exists(fn):
        if sync_file(fn, is_blog=False):
            count += 1
            print(f"  Synced: {fn}")

# Process blog EN pages
blog_dir = 'blog'
for fn in sorted(os.listdir(blog_dir)):
    if fn.endswith('-en.html'):
        fp = os.path.join(blog_dir, fn)
        if sync_file(fp, is_blog=True):
            count += 1
            print(f"  Synced: blog/{fn}")

print(f"\nDone! Synced header/footer on {count} EN files.")
