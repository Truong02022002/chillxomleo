import os
import re

root_dir = r'e:\tiemnuongchillxomleo\project\static-html-version'

# Pattern to match the inline strong/em tags that shouldn't be in title/meta/JSON-LD
# e.g. <strong><em class="text-[#f5f2eb]/90 italic font-bold">text</em></strong>
pattern = re.compile(r'<strong><em class="text-\[#f5f2eb\]/90 italic font-bold">(.*?)</em></strong>', re.DOTALL)

count = 0
for dirpath, dirs, files in os.walk(root_dir):
    for f in files:
        if not f.endswith('.html'):
            continue
        
        filepath = os.path.join(dirpath, f)
        with open(filepath, 'r', encoding='utf-8') as fh:
            content = fh.read()
        
        if 'text-[#f5f2eb]/90 italic font-bold' not in content:
            continue
        
        # Replace ALL occurrences - just keep the inner text
        new_content = pattern.sub(r'\1', content)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as fh:
                fh.write(new_content)
            
            matches_before = len(pattern.findall(content))
            count += 1
            print(f"Fixed {matches_before} occurrences in: {os.path.basename(filepath)}")

print(f"\nDone! Fixed {count} files.")
