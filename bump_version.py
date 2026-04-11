import os
for root, _, files in os.walk('.'):
    for file in files:
        if file.endswith('.html') or file.endswith('.css'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if '?v209' in content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content.replace('?v209', '?v210'))
                print(f'Updated {filepath}')
