import os
import re
import glob

files = glob.glob('*-en.html')

for fname in files:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update CSS versions
    content = re.sub(r'css/tailwind-output\.css\?v\w+', 'css/tailwind-output.css?v208', content)
    content = re.sub(r'css/style\.css\?v\w+', 'css/style.css?v208', content)
    
    # Update JS versions
    content = re.sub(r'js/main\.js\?v\w+', 'js/main.js?v208', content)
    
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Updated all cache busters to v208.")
