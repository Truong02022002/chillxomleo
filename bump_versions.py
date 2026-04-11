import os
import re
import glob

# Search in current dir and blog dir
files = glob.glob('*.html') + glob.glob('blog/*.html')

for fname in files:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update CSS versions (handle relative too like ../css/)
    content = re.sub(r'css/tailwind-output\.css\?v\w+', 'css/tailwind-output.css?v209', content)
    content = re.sub(r'css/style\.css\?v\w+', 'css/style.css?v209', content)
    
    # Update JS versions
    content = re.sub(r'js/main\.js\?v\w+', 'js/main.js?v209', content)
    
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Updated all cache busters to v209 globally.")
