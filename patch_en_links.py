import os
import re
import glob

# Gather all English files in root and blog
files = glob.glob('*-en.html') + glob.glob('blog/*-en.html') + ['en.html']

for fname in list(set(files)):
    if not os.path.exists(fname): continue
    
    with open(fname, 'r', encoding='utf-8') as f:
        html = f.read()

    # We want to find all href="blog/XXXX.html" or href="../blog/XXXX.html"
    # and replace with href="blog/XXXX-en.html" if it doesn't already end with -en.html
    
    # Custom replace function
    def replace_blog_link(match):
        prefix = match.group(1) # href="
        path = match.group(2)   # (../)?blog/...
        if path.endswith('-en.html'):
            return match.group(0) # unchanged
        elif path.endswith('.html'):
            new_path = path[:-5] + '-en.html'
            return prefix + new_path + '"'
        return match.group(0)

    # regex to match href that points to blog directory
    new_html = re.sub(r'(href=")((\.\./)?blog/[^"]+\.html)"', replace_blog_link, html)

    if new_html != html:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(new_html)
        print(f"Patched links in {fname}")

print("Done patching English blog links.")
