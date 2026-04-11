import re
import glob

def sync_layout():
    with open('en.html', 'r', encoding='utf-8') as f:
        en_html = f.read()
        
    nav_match = re.search(r'(<nav id="navbar".*?</nav>)', en_html, re.DOTALL)
    mobile_menu_match = re.search(r'(<div id="mobile-menu".*?</div>)', en_html, re.DOTALL)
    footer_match = re.search(r'(<footer.*?</footer>)', en_html, re.DOTALL)
    
    if not nav_match or not mobile_menu_match or not footer_match:
        print('Error extracting blocks from en.html')
        return
        
    nav = nav_match.group(1)
    mobile_menu = mobile_menu_match.group(1)
    footer = footer_match.group(1)
    
    # Pre-calculate adjusted blocks for blog/
    nav_blog = nav.replace('href="en.html"', 'href="../en.html"')\
                  .replace('href="about-en.html"', 'href="../about-en.html"')\
                  .replace('href="menu-en.html"', 'href="../menu-en.html"')\
                  .replace('href="about-us-en.html"', 'href="../about-us-en.html"')\
                  .replace('href="blog-en.html"', 'href="../blog-en.html"')\
                  .replace('href="index.html#booking"', 'href="../index.html#booking"')\
                  .replace('lang-switcher"', 'lang-switcher cursor-pointer"') # safe defaults
                  
    mobile_menu_blog = mobile_menu.replace('href="en.html"', 'href="../en.html"')\
                  .replace('href="about-en.html"', 'href="../about-en.html"')\
                  .replace('href="menu-en.html"', 'href="../menu-en.html"')\
                  .replace('href="about-us-en.html"', 'href="../about-us-en.html"')\
                  .replace('href="blog-en.html"', 'href="../blog-en.html"')\
                  .replace('href="index.html#booking"', 'href="../index.html#booking"')
                  
    footer_blog = footer.replace('href="en.html"', 'href="../en.html"')\
                  .replace('href="about-en.html"', 'href="../about-en.html"')\
                  .replace('href="menu-en.html"', 'href="../menu-en.html"')\
                  .replace('href="about-us-en.html"', 'href="../about-us-en.html"')\
                  .replace('href="blog-en.html"', 'href="../blog-en.html"')\
                  .replace('href="index.html#booking"', 'href="../index.html#booking"')

    root_files = ['about-en.html', 'menu-en.html', 'about-us-en.html', 'blog-en.html']
    blog_files = glob.glob('blog/*-en.html')
    
    for f in root_files:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            
        content = re.sub(r'<nav id="navbar".*?</nav>', nav.replace('\\', r'\\'), content, flags=re.DOTALL)
        content = re.sub(r'<div id="mobile-menu".*?</div>', mobile_menu.replace('\\', r'\\'), content, flags=re.DOTALL)
        content = re.sub(r'<footer.*?</footer>', footer.replace('\\', r'\\'), content, flags=re.DOTALL)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print('Synced root file:', f)
        
    for f in blog_files:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            
        content = re.sub(r'<nav id="navbar".*?</nav>', nav_blog.replace('\\', r'\\'), content, flags=re.DOTALL)
        content = re.sub(r'<div id="mobile-menu".*?</div>', mobile_menu_blog.replace('\\', r'\\'), content, flags=re.DOTALL)
        content = re.sub(r'<footer.*?</footer>', footer_blog.replace('\\', r'\\'), content, flags=re.DOTALL)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
            
    print('Synced', len(blog_files), 'blog files.')

sync_layout()
