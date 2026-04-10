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
        
        new_content = content
        
        # Update old cache versions to v12
        for old_v in ['?v1', '?v2', '?v3', '?v4', '?v5', '?v6', '?v7', '?v8', '?v9', '?v10', '?v11']:
            # Only replace in CSS/JS link tags, not in URLs
            new_content = new_content.replace(f'tailwind-output.css{old_v}', 'tailwind-output.css?v12')
            new_content = new_content.replace(f'style.css{old_v}', 'style.css?v12')
            new_content = new_content.replace(f'main.js{old_v}', 'main.js?v12')
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as fh:
                fh.write(new_content)
            count += 1

print(f"Updated cache versions in {count} files.")
