import os

root_dir = r'e:\tiemnuongchillxomleo\project\static-html-version'

count = 0
for dirpath, dirs, files in os.walk(root_dir):
    for f in files:
        if not f.endswith('.html'):
            continue
        
        filepath = os.path.join(dirpath, f)
        with open(filepath, 'r', encoding='utf-8') as fh:
            content = fh.read()
        
        # Fix 1: Double >> on og:title meta tags  (e.g.  content="...">>) 
        new_content = content.replace('">>', '">')
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as fh:
                fh.write(new_content)
            count += 1
            print(f"Fixed double >>: {os.path.basename(filepath)}")

print(f"\nDone! Fixed {count} files.")
