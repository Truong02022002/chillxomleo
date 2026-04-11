"""Check header/footer consistency across all EN pages."""
import os, re

def extract_section(content, start_marker, end_marker):
    s = content.find(start_marker)
    e = content.find(end_marker, s)
    if s == -1 or e == -1:
        return None
    return content[s:e+len(end_marker)]

def get_nav_links(content):
    """Extract nav link texts from desktop menu."""
    pattern = r'class="[^"]*text-foreground/70[^"]*">(.*?)</a>'
    return re.findall(pattern, content)

def get_mobile_links(content):
    """Extract mobile menu link texts."""
    mobile = extract_section(content, '<!-- MOBILE MENU', '</div>\r\n\r\n')
    if not mobile:
        mobile = extract_section(content, '<!-- MOBILE MENU', '</div>\n\n')
    if mobile:
        return re.findall(r'class="transition-colors text-foreground/70">(.*?)</a>', mobile)
    return []

def get_footer_links(content):
    """Extract footer nav link texts."""  
    pattern = r'class="hover:text-primary transition-colors">(.*?)</a>'
    return re.findall(pattern, content)

def get_footer_labels(content):
    """Extract footer section labels."""
    # Look for footer h4 texts
    pattern = r'<h4[^>]*>(.*?)</h4>'
    return re.findall(pattern, content)

def check_cta_button(content):
    """Check footer CTA button text."""
    pattern = r'Reserve.*?Book.*?Table|Book.*?Table|BOOK NOW'
    return re.findall(pattern, content)

def check_directions(content):
    """Check Get Directions text."""
    return 'Get Directions' in content

def check_opening(content):
    """Check opening hours label."""
    return 'Opening Hours' in content or 'opening hours' in content.lower()

def check_address(content):
    """Check address label."""
    # In footer, should say Address not Địa chỉ
    footer = extract_section(content, '<!-- FOOTER', '</footer>')
    if footer:
        return 'Address' in footer and 'Địa chỉ' not in footer
    return True

root = '.'
en_files = []
for dirpath, _, filenames in os.walk(root):
    for fn in filenames:
        if fn.endswith('-en.html') or fn == 'en.html':
            en_files.append(os.path.join(dirpath, fn))

en_files.sort()
main_pages = [f for f in en_files if not f.startswith('.\\blog')]
blog_pages = [f for f in en_files if f.startswith('.\\blog')]

# Use en.html as reference
with open('en.html', 'r', encoding='utf-8') as f:
    ref = f.read()

ref_nav = get_nav_links(ref)
ref_mobile = get_mobile_links(ref)
ref_footer_links = get_footer_links(ref)
ref_footer_labels = get_footer_labels(ref)

print("=== REFERENCE (en.html) ===")
print(f"  Nav links: {ref_nav}")
print(f"  Mobile links: {ref_mobile}")
print(f"  Footer links: {ref_footer_links}")
print(f"  Footer labels: {ref_footer_labels}")
print(f"  Has Get Directions: {check_directions(ref)}")
print(f"  Has Opening Hours: {check_opening(ref)}")
print(f"  Footer Address OK: {check_address(ref)}")
print()

issues = []
for filepath in en_files:
    if filepath == '.\\en.html':
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    fn = os.path.basename(filepath)
    file_issues = []
    
    nav = get_nav_links(content)
    if nav and nav != ref_nav:
        file_issues.append(f"Nav mismatch: {nav}")
    
    mobile = get_mobile_links(content)
    if mobile and mobile != ref_mobile:
        file_issues.append(f"Mobile mismatch: {mobile}")
    
    if not check_directions(content):
        file_issues.append("Missing 'Get Directions'")
    
    if not check_opening(content):
        file_issues.append("Missing 'Opening Hours'")
    
    if not check_address(content):
        file_issues.append("Footer still has Vietnamese 'Địa chỉ'")
    
    # Check footer has English labels
    labels = get_footer_labels(content)
    if labels:
        for label in labels:
            if any(c in label for c in 'àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ'):
                file_issues.append(f"Vietnamese in footer label: {label}")
    
    if file_issues:
        issues.append((fn, file_issues))

if issues:
    print(f"=== ISSUES FOUND ({len(issues)} files) ===")
    for fn, fi in issues[:20]:
        print(f"\n  {fn}:")
        for i in fi:
            print(f"    - {i}")
else:
    print("=== ALL CLEAR! Header/Footer consistent across all EN files ===")
