import re

filepath = r'e:\tiemnuongchillxomleo\project\static-html-version\index.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the entire footer section
old_footer_pattern = r'  <!-- FOOTER -->.*?</footer>'
new_footer = '''  <!-- FOOTER -->
  <footer class="relative bg-surface text-foreground border-t border-white/5 font-sans">

    <!-- Footer Content -->
    <div class="container max-w-[1200px] mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 pt-12 pb-10">

      <!-- Brand Column -->
      <div class="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
        <a href="index.html" class="flex flex-col items-center lg:items-start leading-none group">
          <span class="font-script text-3xl text-primary group-hover:text-foreground transition-colors">
            Ti\u1ec7m N\u01b0\u1edbng &amp; Chill X\u00f3m L\u00e8o
          </span>
        </a>
        <p class="max-w-sm text-foreground/50 text-[13px] leading-relaxed font-light">
          \u1ea8n m\u00ecnh gi\u1eefa \u0111\u1ed3i th\u00f4ng xanh ng\u00e1t \u2014 ch\u1ed1n d\u1eebng ch\u00e2n c\u1ee7a nh\u1eefng t\u00e2m h\u1ed3n t\u00ecm ki\u1ebfm s\u1ef1 b\u00ecnh y\u00ean gi\u1eefa c\u00e1i l\u1ea1nh \u0110\u00e0 L\u1ea1t.
        </p>
        <div class="flex items-center justify-center lg:justify-start gap-3">
          <a href="https://www.facebook.com/nuongxomleo" target="_blank" rel="noopener noreferrer"
            class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-foreground/60 hover:bg-primary hover:text-[#090807] transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          </a>
          <a href="#"
            class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-foreground/60 hover:bg-primary hover:text-[#090807] transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg>
          </a>
          <a href="#"
            class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-foreground/60 hover:bg-primary hover:text-[#090807] transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </a>
        </div>
        <a href="index.html#booking" class="mt-1 inline-flex items-center justify-center bg-primary text-background px-6 py-2.5 rounded-[2px] text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(197,160,89,0.3)] hover:-translate-y-0.5 w-max">
          Gi\u1eef Ch\u1ed7 / \u0110\u1eb7t B\u00e0n
        </a>
      </div>

      <!-- Links Column -->
      <div class="lg:col-span-2 lg:col-start-5 flex flex-col items-center lg:items-start text-center lg:text-left gap-3">
        <h4 class="text-[13px] font-bold uppercase tracking-[0.2em] text-foreground">Li\u00ean k\u1ebft</h4>
        <nav class="flex flex-col gap-2.5 text-[13px] text-foreground/40 font-medium">
          <a href="index.html" class="hover:text-primary transition-colors">Trang ch\u1ee7</a>
          <a href="about.html" class="hover:text-primary transition-colors">Tr\u1ea3i nghi\u1ec7m</a>
          <a href="menu.html" class="hover:text-primary transition-colors">Th\u1ef1c \u0110\u01a1n</a>
          <a href="ve-chung-toi.html" class="hover:text-primary transition-colors">V\u1ec1 ch\u00fang t\u00f4i</a>
          <a href="blog.html" class="hover:text-primary transition-colors">Blog</a>
          <a href="index.html#booking" class="hover:text-primary transition-colors">\u0110\u1eb7t b\u00e0n</a>
        </nav>
      </div>

      <!-- Contact Column -->
      <div class="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-left gap-3">
        <h4 class="text-[13px] font-bold uppercase tracking-[0.2em] text-foreground">Li\u00ean h\u1ec7</h4>
        <div class="flex flex-col gap-3 text-[13px] text-foreground/50 leading-relaxed font-light">
          <a href="tel:0764527336" class="text-foreground/80 font-bold text-base hover:text-primary transition-colors">076 452 7336</a>
          <p>
            <span class="block text-foreground/70 font-medium mb-0.5 uppercase text-[10px] tracking-widest">Th\u1eddi gian m\u1edf c\u1eeda</span>
            15:00 \u2013 23:00 h\u00e0ng ng\u00e0y
          </p>
          <p class="max-w-[260px]">
            <span class="block text-foreground/70 font-medium mb-0.5 uppercase text-[10px] tracking-widest">\u0110\u1ecba ch\u1ec9</span>
            113 Hu\u1ef3nh T\u1ea5n Ph\u00e1t, P11, \u0110\u00e0 L\u1ea1t (Khu v\u1ef1c X\u00f3m L\u00e8o)
          </p>
        </div>
      </div>

      <!-- Map Column -->
      <div class="lg:col-span-3 flex flex-col items-center lg:items-end gap-3">
        <h4 class="text-[13px] font-bold uppercase tracking-[0.2em] text-foreground">B\u1ea3n \u0111\u1ed3</h4>
        <div class="relative group w-full max-w-[300px] lg:max-w-none">
          <div class="relative h-[160px] lg:h-[180px] w-full rounded-xl overflow-hidden border border-white/10 shadow-lg">
            <div class="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-surface/20 via-transparent to-transparent"></div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d160!2d108.4944158!3d11.9543314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317113a6b8038e99%3A0x9af7f31f3d40f19f!2zVGnhu4dtIE7GsOG7m25nICYgQ2hpbGwgWMOzbSBMw6hv!5e0!3m2!1sen!2s!4v1775574489541!5m2!1sen!2s"
              width="100%" height="100%" style="border: 0" allowfullscreen loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              class="grayscale-[30%] contrast-110 opacity-85 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100"></iframe>
          </div>
          <a href="https://maps.app.goo.gl/YourLink" target="_blank" rel="noopener noreferrer"
            class="mt-2 w-full inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-[10px] uppercase tracking-[0.2em] font-bold text-primary hover:bg-primary hover:text-background transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Xem \u0111\u01b0\u1eddng \u0111i
          </a>
        </div>
      </div>

    </div>

    <!-- Decorative Bottom Bar -->
    <div class="border-t border-white/5 py-4 container mx-auto px-6 relative">
      <div class="flex justify-center items-center">
        <p class="text-[10px] uppercase tracking-[0.3em] text-foreground/20 font-medium">
          \u00a9 2026 Ti\u1ec7m N\u01b0\u1edbng &amp; Chill X\u00f3m L\u00e8o. \u0110\u00e0 L\u1ea1t, Vi\u1ec7t Nam.
        </p>
      </div>
    </div>
  </footer>'''

new_content = re.sub(old_footer_pattern, new_footer, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done! Footer redesigned in index.html")
