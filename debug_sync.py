import re
with open('index.html', 'r', encoding='utf-8') as f: source = f.read()
import urllib.parse
with open('about.html', 'r', encoding='utf-8') as f: content = f.read()

nav_block = re.search(r'<nav id="navbar".*?</nav>', source, re.DOTALL)
if nav_block:
    print("Found nav block length:", len(nav_block.group(0)))
else:
    print("NO NAV BLOCK FOUND IN INDEX")

old_nav = re.search(r'<nav id="navbar".*?</nav>', content, re.DOTALL)
if old_nav:
    print("Found old nav block length:", len(old_nav.group(0)))
else:
    print("NO NAV BLOCK FOUND IN ABOUT")
