"""
Audit English pages for remaining Vietnamese text.
Checks all *-en.html and en.html files for Vietnamese UI strings.
"""
import os
import re
from html.parser import HTMLParser

# Vietnamese UI strings that should NOT appear in English pages
VN_STRINGS = [
    'Trang chủ', 'Trải nghiệm', 'Về chúng tôi', 'Đặt bàn', 'Đặt Bàn',
    'ĐẶT BÀN', 'Thực Đơn', 'Tin Tức', 'Mục lục bài viết',
    'Quay lại Blog', 'Đọc Bài Viết', 'Liên kết', 'Liên hệ',
    'Thời gian mở cửa', 'Địa chỉ', 'Bản đồ', 'Xem đường đi',
    'Giữ Chỗ', 'ĐANG XỬ LÝ', 'ĐÃ LÊN ĐƠN', 'Hotline',
    'hàng ngày', 'Quay lại thẻ bài gốc',
    # Form labels
    'TÊN CỦA BẠN', 'SỐ ĐIỆN THOẠI', 'NGÀY ĐẾN', 'GIỜ ĐẾN',
    'SỐ KHÁCH', 'DỊP ĐẶC BIỆT', 'GHI CHÚ THÊM', 'ADDITIONAL NOTES',
    'Sinh nhật', 'Kỷ niệm', 'Họp mặt', 'Khác',
    # Booking section
    'Đặt Bàn Trước', 'Giữ chỗ ngay', 'để có trải nghiệm tốt nhất',
    # Footer
    'Ẩn mình giữa đồi thông',
    # Other UI
    'Xem thêm', 'Gọi ngay',
]

# Strings that are OK to keep in Vietnamese (brand names, addresses, etc.)
EXCEPTIONS = [
    'Tiệm Nướng', 'Chill Xóm Lèo', 'Xóm Lèo', 'Đà Lạt',
    'Huỳnh Tấn Phát', 'Phường 11', 'Việt Nam',
    'Chào Tiệm Nướng',  # in Zalo message template
    'xomleo.vn',
]

def is_exception(line, match):
    """Check if the match is part of an allowed exception."""
    for exc in EXCEPTIONS:
        if exc in line and match in exc:
            return True
    return False

def audit_file(filepath):
    issues = []
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines, 1):
        # Skip JSON-LD, meta tags, comments
        stripped = line.strip()
        if stripped.startswith('<!--') or '"@context"' in line or '"@type"' in line:
            continue
        
        for vn_str in VN_STRINGS:
            if vn_str in line:
                # Check if it's in a script/json block or an exception
                if not is_exception(line, vn_str):
                    issues.append({
                        'line': i,
                        'match': vn_str,
                        'content': stripped[:120]
                    })
    
    return issues

def main():
    root = '.'
    en_files = []
    
    # Collect all English HTML files
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn.endswith('-en.html') or fn == 'en.html':
                en_files.append(os.path.join(dirpath, fn))
    
    en_files.sort()
    
    print(f"=== ENGLISH PAGE AUDIT ===")
    print(f"Found {len(en_files)} English HTML files\n")
    
    total_issues = 0
    files_with_issues = 0
    
    # Group: Main pages first, then blog
    main_pages = [f for f in en_files if not f.startswith('.\\blog')]
    blog_pages = [f for f in en_files if f.startswith('.\\blog')]
    
    print("--- MAIN PAGES ---")
    for filepath in main_pages:
        issues = audit_file(filepath)
        if issues:
            files_with_issues += 1
            total_issues += len(issues)
            print(f"\n[FAIL] {filepath} ({len(issues)} issues)")
            seen = set()
            for issue in issues:
                key = (issue['match'], issue['line'])
                if key not in seen:
                    seen.add(key)
                    print(f"   Line {issue['line']}: [{issue['match']}] → {issue['content'][:80]}")
        else:
            print(f"  [OK] {filepath}")
    
    print("\n--- BLOG PAGES ---")
    blog_issues_count = 0
    blog_common_issues = {}
    
    for filepath in blog_pages:
        issues = audit_file(filepath)
        if issues:
            blog_issues_count += 1
            total_issues += len(issues)
            # Collect common patterns
            for issue in issues:
                key = issue['match']
                if key not in blog_common_issues:
                    blog_common_issues[key] = {'count': 0, 'example_line': issue['content'][:80], 'files': []}
                blog_common_issues[key]['count'] += 1
                if len(blog_common_issues[key]['files']) < 3:
                    blog_common_issues[key]['files'].append(os.path.basename(filepath))
    
    if blog_common_issues:
        print(f"\n[FAIL] {blog_issues_count}/{len(blog_pages)} blog files have Vietnamese text")
        print(f"\nCommon Vietnamese strings found in blog -en.html files:")
        for vn_str, info in sorted(blog_common_issues.items(), key=lambda x: -x[1]['count']):
            example_files = ', '.join(info['files'])
            print(f"   [{vn_str}] → found in {info['count']} files (e.g. {example_files})")
            print(f"      Example: {info['example_line']}")
    else:
        print(f"  [OK] All {len(blog_pages)} blog files are clean")
    
    print(f"\n=== SUMMARY ===")
    print(f"Total issues: {total_issues}")
    print(f"Files with issues: {files_with_issues + blog_issues_count}/{len(en_files)}")

if __name__ == '__main__':
    main()
