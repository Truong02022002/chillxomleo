import os
import re
import glob

# 1. Update main.js for dynamic language routing
main_js_path = 'js/main.js'
with open(main_js_path, 'r', encoding='utf-8') as f:
    main_js = f.read()

# Instead of hardcoded routing merely, we patch it
if "else if (!currentFile.endsWith('-en.html')" not in main_js:
    # Inject dynamic routing for EN
    main_js = main_js.replace("if (pageMap[currentFile]) {\n        window.location.href = pageMap[currentFile] + window.location.hash;\n      }",
                              "if (pageMap[currentFile]) {\n        window.location.href = pageMap[currentFile] + window.location.hash;\n      } else if (!currentFile.endsWith('-en.html') && currentFile.endsWith('.html')) {\n        window.location.href = currentFile.replace('.html', '-en.html') + window.location.hash;\n      }")
    
    # Inject dynamic routing for VN
    main_js = main_js.replace("if (reverseMap[currentFile]) {\n        window.location.href = reverseMap[currentFile] + window.location.hash;\n      }",
                              "if (reverseMap[currentFile]) {\n        window.location.href = reverseMap[currentFile] + window.location.hash;\n      } else if (currentFile.endsWith('-en.html')) {\n        window.location.href = currentFile.replace('-en.html', '.html') + window.location.hash;\n      }")
    
    with open(main_js_path, 'w', encoding='utf-8') as f:
        f.write(main_js)
    print("Updated js/main.js lang routing")

# 2. Extract templates from root
def extract_section(filepath, start_pattern, end_pattern):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    match = re.search(start_pattern + r'.*?' + end_pattern, html, re.DOTALL)
    if not match:
        raise ValueError(f"Could not find section in {filepath}")
    return match.group(0)

# The navbar plus the mobile menu overlay:
nav_start = r'<!-- NAVBAR -->\s*<nav id="navbar"'
nav_end = r'<div id="mobile-menu"[^>]*>.*?</div>\s*</div>' # Wait, '</div>' x2 because of the mobile menu structure inside.
# Actually, it's safer to extract from <!-- NAVBAR --> to </nav>, and then <!-- MOBILE MENU OVERLAY --> to </div>...
# Let's just do it by specific exact tags
def exact_extract_header(html):
    start = html.find('<!-- NAVBAR -->')
    end = html.find('<main')
    return html[start:end]

def exact_extract_footer(html):
    start = html.find('<!-- FOOTER -->')
    end = html.find('<script src=')
    return html[start:end]

with open('blog.html', 'r', encoding='utf-8') as f:
    vi_html = f.read()
with open('blog-en.html', 'r', encoding='utf-8') as f:
    en_html = f.read()

v_head = exact_extract_header(vi_html)
v_foot = exact_extract_footer(vi_html)
e_head = exact_extract_header(en_html)
e_foot = exact_extract_footer(en_html)

# Adjust relative paths in the headers and footers since they will be placed in blog/ folder.
def make_relative(html_chunk):
    # href="index.html" -> href="../index.html"
    html_chunk = re.sub(r'href="(index\.html|about\.html|menu\.html|ve-chung-toi\.html|blog\.html|en\.html|about-en\.html|menu-en\.html|about-us-en\.html|blog-en\.html)(#[^"]*)?"', r'href="../\1\2"', html_chunk)
    # src="uploads -> src="../uploads
    html_chunk = html_chunk.replace('src="uploads', 'src="../uploads')
    return html_chunk

v_head = make_relative(v_head)
v_foot = make_relative(v_foot)
e_head = make_relative(e_head)
e_foot = make_relative(e_foot)

blog_dir = 'blog'
files = glob.glob(os.path.join(blog_dir, '*.html'))

for filepath in files:
    if filepath.endswith('-en.html'):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
        
    start_main = html.find('<main')
    end_main = html.find('<!-- FOOTER -->')
    if end_main == -1: end_main = html.find('<footer')
    
    # Extract the main content of the blog post
    if start_main != -1 and end_main != -1:
        main_content = html[start_main:end_main]
        top_part = html[:html.find('<!-- NAVBAR -->')]
        if top_part == "": top_part = html[:html.find('<nav')]
        bottom_part = html[html.find('<script src='):]
        
        # Adjust top_part to ensure correct css paths
        top_part = re.sub(r'href="\.\./css/tailwind-output\.css\?v\w+"', 'href="../css/tailwind-output.css?v209"', top_part)
        top_part = re.sub(r'href="\.\./css/style\.css\?v\w+"', 'href="../css/style.css?v209"', top_part)
        
        bottom_part = re.sub(r'src="\.\./js/main\.js\?v\w+"', 'src="../js/main.js?v209"', bottom_part)
        
        # VI VERSION
        vi_full = top_part + v_head + main_content + v_foot + bottom_part
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(vi_full)
            
        # EN VERSION (Keep VN content but use EN header/footer)
        # Also need to replace the breadcrumb back link to point to blog-en.html
        # <a href="../blog.html" ... Quay lại thẻ bài gốc -> <a href="../blog-en.html" ... Back to Blog
        # Change <html lang="vi"> to <html lang="en">
        en_top = top_part.replace('<html lang="vi"', '<html lang="en"').replace('<html lang="vn"', '<html lang="en"')
        en_main = main_content.replace('href="../blog.html"', 'href="../blog-en.html"').replace('Quay lại thẻ bài gốc', 'Back to Blog')
        
        en_full = en_top + e_head + en_main + e_foot + bottom_part
        en_filepath = filepath.replace('.html', '-en.html')
        with open(en_filepath, 'w', encoding='utf-8') as f:
            f.write(en_full)
            
print(f"Processed blogs and created -en.html versions.")
