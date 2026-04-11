"""Fix html lang='vi' to lang='en' on all English pages."""
import os

root = '.'
count = 0
for dirpath, _, filenames in os.walk(root):
    for fn in filenames:
        if fn.endswith('-en.html') or fn == 'en.html':
            filepath = os.path.join(dirpath, fn)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'lang="vi"' in content:
                content = content.replace('lang="vi"', 'lang="en"', 1)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1
                print(f"  Fixed lang: {fn}")

print(f"\nFixed html lang on {count} files.")
