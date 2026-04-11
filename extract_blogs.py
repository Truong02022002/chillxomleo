"""
Extract body content from Vietnamese blog HTML files (strip HTML tags),
then save as raw text for translation.
"""
import os, re
from html.parser import HTMLParser

class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.result = []
        self.skip = False
        self.skip_tags = {'script', 'style', 'nav', 'footer', 'head'}
        self.current_tag = ''
        self.block_tags = {'h1','h2','h3','h4','h5','h6','p','li','div','figcaption','details','summary'}
        
    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.skip = True
        self.current_tag = tag
        attrs_dict = dict(attrs)
        
        # Add markers for headings
        if tag == 'h1':
            self.result.append('\n# ')
        elif tag == 'h2':
            self.result.append('\n## ')
        elif tag == 'h3':
            self.result.append('\n### ')
        elif tag == 'h4':
            self.result.append('\n#### ')
        elif tag == 'p':
            self.result.append('\n')
        elif tag == 'li':
            self.result.append('\n- ')
        elif tag == 'br':
            self.result.append('\n')
        elif tag == 'a':
            href = attrs_dict.get('href', '')
            if href:
                self.result.append('[')
        elif tag == 'img':
            alt = attrs_dict.get('alt', '')
            if alt:
                self.result.append(f'\n![{alt}]\n')
        elif tag == 'strong' or tag == 'b':
            self.result.append('**')
        elif tag == 'em' or tag == 'i':
            self.result.append('*')
            
    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self.skip = False
        if tag in ('h1','h2','h3','h4'):
            self.result.append('\n')
        elif tag == 'p':
            self.result.append('\n')
        elif tag == 'a':
            self.result.append(']')
        elif tag == 'strong' or tag == 'b':
            self.result.append('**')
        elif tag == 'em' or tag == 'i':
            self.result.append('*')
        elif tag == 'ul' or tag == 'ol':
            self.result.append('\n')
            
    def handle_data(self, data):
        if not self.skip:
            self.result.append(data)
    
    def get_text(self):
        return ''.join(self.result)

def extract_article(html_content):
    """Extract article body content between <main> or <article> tags."""
    # Find article or main content
    article_start = html_content.find('<article')
    if article_start == -1:
        article_start = html_content.find('<main')
    article_end = html_content.find('</article>')
    if article_end == -1:
        article_end = html_content.find('</main>')
    
    if article_start == -1 or article_end == -1:
        return None
    
    article_html = html_content[article_start:article_end]
    
    # Remove the "Back to Blog" link section
    article_html = re.sub(r'<a[^>]*>.*?(?:Quay lại Blog|Back to Blog).*?</a>', '', article_html, flags=re.DOTALL)
    
    # Remove TOC
    article_html = re.sub(r'<details class="blog-toc"[^>]*>.*?</details>', '', article_html, flags=re.DOTALL)
    
    # Remove FAQ schema scripts
    article_html = re.sub(r'<script[^>]*>.*?</script>', '', article_html, flags=re.DOTALL)
    
    extractor = HTMLTextExtractor()
    extractor.feed(article_html)
    text = extractor.get_text()
    
    # Clean up
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = text.strip()
    
    return text

def main():
    blog_dir = 'blog'
    output_dir = 'blog-translations'
    os.makedirs(output_dir, exist_ok=True)
    
    # Get VN blog files (the originals, not -en versions)
    vn_files = []
    for fn in sorted(os.listdir(blog_dir)):
        if fn.endswith('.html') and not fn.endswith('-en.html'):
            vn_files.append(fn)
    
    print(f"Found {len(vn_files)} Vietnamese blog files")
    
    for fn in vn_files:
        filepath = os.path.join(blog_dir, fn)
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
        
        # Extract title
        title_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
        title = ''
        if title_match:
            title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
        
        text = extract_article(html)
        if text:
            md_name = fn.replace('.html', '.md')
            md_path = os.path.join(output_dir, md_name)
            
            with open(md_path, 'w', encoding='utf-8') as f:
                f.write(text)
            
            word_count = len(text.split())
            print(f"  Extracted: {md_name[:55]:55s} ({word_count} words)")
    
    print(f"\nDone! Extracted {len(vn_files)} articles to {output_dir}/")

if __name__ == '__main__':
    main()
