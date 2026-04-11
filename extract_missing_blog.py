import re
import json

with open('blog-en.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find all untranslated h2
h2_matches = re.findall(r'<h2 class="[^"]*line-clamp-2">(.*?)</h2>', html, re.DOTALL)
p_matches = re.findall(r'<p class="[^"]*line-clamp-3[^"]*">(.*?)</p>', html, re.DOTALL)

untranslated_h2 = [m.strip() for m in h2_matches if any(c in m for c in 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ')]
untranslated_p = [m.strip() for m in p_matches if any(c in m for c in 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ')]

results = {
    "h2": list(set(untranslated_h2)),
    "p": list(set(untranslated_p))
}

with open('missing_blog_strings.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("Saved missing strings.")
