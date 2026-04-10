import os
import re

MAPS_BLOCK = '''
    <!-- Google Maps in Footer -->
    <div class="relative group">
      <!-- Map Container -->
      <div class="relative w-full h-[220px] md:h-[300px] overflow-hidden">
        <!-- Overlays for luxury blending -->
        <div class="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-surface via-transparent to-surface/90"></div>
        <div class="absolute inset-0 z-10 pointer-events-none mix-blend-color bg-primary/5"></div>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d160!2d108.4944158!3d11.9543314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317113a6b8038e99%3A0x9af7f31f3d40f19f!2zVGnhu4dtIE7GsOG7m25nICYgQ2hpbGwgWMOzbSBMw6hv!5e0!3m2!1sen!2s!4v1775574489541!5m2!1sen!2s"
          width="100%" height="100%" style="border: 0" allowfullscreen loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          class="grayscale-[40%] contrast-110 opacity-80 transition-all duration-1000 group-hover:grayscale-0 group-hover:opacity-100 scale-105"></iframe>
      </div>
      <!-- Map Label -->
      <div class="absolute bottom-4 left-0 right-0 z-20 flex justify-center">
        <a href="https://maps.app.goo.gl/YourLink" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-2 bg-surface/90 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold text-primary hover:bg-primary hover:text-background transition-all duration-300 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          Xem \u0111\u01b0\u1eddng \u0111i
        </a>
      </div>
    </div>
'''

root_dir = r'e:\tiemnuongchillxomleo\project\static-html-version'
skip_file = 'index.html'  # Already has the map

html_files = []
for dirpath, dirs, files in os.walk(root_dir):
    for f in files:
        if f.endswith('.html'):
            full = os.path.join(dirpath, f)
            html_files.append(full)

count = 0
for filepath in html_files:
    basename = os.path.basename(filepath)
    if basename == skip_file and os.path.dirname(filepath) == root_dir:
        continue
    
    with open(filepath, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    # Skip if already has the map
    if 'Google Maps in Footer' in content:
        continue
    
    # Find the footer tag and insert map right after it
    # Pattern: look for the <!-- FOOTER --> comment followed by <footer ...>
    # Replace footer opening to include map block
    
    old_pattern = '<!-- FOOTER -->\n  <footer class="relative bg-surface text-foreground pt-16 pb-8 border-t border-white/5 font-sans">\n    <div class="container max-w-[1050px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-12">'
    
    new_replacement = '<!-- FOOTER -->\n  <footer class="relative bg-surface text-foreground border-t border-white/5 font-sans">' + MAPS_BLOCK + '\n    <!-- Footer Content -->\n    <div class="container max-w-[1050px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pt-14 pb-12">'
    
    if old_pattern in content:
        new_content = content.replace(old_pattern, new_replacement)
        with open(filepath, 'w', encoding='utf-8') as fh:
            fh.write(new_content)
        count += 1
        print(f"Updated: {filepath}")
    else:
        # Try with \r\n line endings
        old_pattern_rn = old_pattern.replace('\n', '\r\n')
        new_replacement_rn = new_replacement.replace('\n', '\r\n')
        if old_pattern_rn in content:
            new_content = content.replace(old_pattern_rn, new_replacement_rn)
            with open(filepath, 'w', encoding='utf-8') as fh:
                fh.write(new_content)
            count += 1
            print(f"Updated: {filepath}")
        else:
            print(f"SKIPPED (pattern not found): {filepath}")

print(f"\nDone! Updated {count} files.")
