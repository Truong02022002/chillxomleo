// --- Tracking Traffic Source ---
function captureTrafficSource() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('utm_source')) {
    return urlParams.get('utm_source') + (urlParams.get('utm_medium') ? ` / ${urlParams.get('utm_medium')}` : '');
  }

  const referrer = document.referrer;
  if (!referrer) return 'Zalo / Gõ URL trực tiếp';

  const host = new URL(referrer).hostname.toLowerCase();
  if (host.includes('facebook') || host.includes('fb.')) return 'Facebook';
  if (host.includes('tiktok.com')) return 'TikTok';
  if (host.includes('google.')) return 'Google Search';
  if (host.includes('instagram.com')) return 'Instagram';

  return 'Web khác: ' + host;
}

// Lưu nguồn truy cập ngay khi load trang vào session
if (!sessionStorage.getItem('xomleo_traffic_source')) {
  sessionStorage.setItem('xomleo_traffic_source', captureTrafficSource());
}

document.addEventListener('DOMContentLoaded', () => {
  // --- Mobile Menu Toggle ---
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isClosed = mobileMenu.classList.contains('translate-x-full');
      if (isClosed) {
        mobileMenu.classList.remove('translate-x-full');
        mobileMenuBtn.innerHTML = `<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
      } else {
        mobileMenu.classList.add('translate-x-full');
        mobileMenuBtn.innerHTML = `<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>`;
      }
    });

    // Close menu when clicking a link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('translate-x-full');
        mobileMenuBtn.innerHTML = `<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>`;
      });
    });
  }

  // --- Dynamic Active Nav Highlighting ---
  function highlightActiveNav() {
    let currentPath = window.location.pathname.split('/').pop();
    if (!currentPath || currentPath === '') currentPath = 'index.html';
    
    // Exact mapping for root or alias paths
    if (currentPath === '/' || currentPath === '') currentPath = 'index.html';

    const desktopNavLinks = document.querySelectorAll('.hidden.lg\\:flex.items-center.space-x-8 a');
    desktopNavLinks.forEach(link => {
      const href = link.getAttribute('href');
      // If href matches currentPath (or en.html for en.html)
      if (href === currentPath) {
        link.className = 'transition-all duration-300 relative py-1 px-3 rounded-full bg-white/10 text-foreground';
      } else {
        link.className = 'transition-all duration-300 relative py-1 px-3 rounded-full text-foreground/70 hover:text-foreground';
      }
    });

    const mobileNavLinks = document.querySelectorAll('#mobile-menu .flex-col.gap-6.text-2xl a');
    mobileNavLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath) {
        link.className = 'transition-colors text-primary pl-4 border-l-2 border-primary';
      } else {
        link.className = 'transition-colors text-foreground/70 pl-4 border-l-2 border-transparent';
      }
    });
  }
  highlightActiveNav();


  // --- Language Switcher UI Toggle ---
  const langSwitchers = document.querySelectorAll('.lang-switcher');
  
  let currentFileInitial = window.location.pathname.split('/').pop() || 'index.html';
  const isEnPageInitial = currentFileInitial.endsWith('-en.html') || currentFileInitial === 'en.html';
  
  let currentLang = localStorage.getItem('xomleo_lang') || 'vn';
  
  // Override if URL explicitly indicates language
  if (isEnPageInitial) currentLang = 'en';
  else if (!isEnPageInitial && currentFileInitial !== '') currentLang = 'vn';

  function updateLangUI(lang) {
    langSwitchers.forEach(switcher => {
      const btnVN = switcher.querySelector('.data-lang-vn');
      const btnEN = switcher.querySelector('.data-lang-en');
      if (!btnVN || !btnEN) return;
      
      if (lang === 'en') {
        btnEN.classList.add('text-primary', 'pointer-events-none');
        btnEN.classList.remove('hover:text-primary');
        btnVN.classList.remove('text-primary', 'pointer-events-none');
        btnVN.classList.add('hover:text-primary');
      } else {
        btnVN.classList.add('text-primary', 'pointer-events-none');
        btnVN.classList.remove('hover:text-primary');
        btnEN.classList.remove('text-primary', 'pointer-events-none');
        btnEN.classList.add('hover:text-primary');
      }
    });
  }

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('xomleo_lang', lang);
    updateLangUI(lang);
    
    // Page mapping between VN and EN
    const pageMap = {
      'index.html': 'en.html',
      'about.html': 'about-en.html',
      'menu.html': 'menu-en.html',
      've-chung-toi.html': 'about-us-en.html',
      'blog.html': 'blog-en.html',
      '': 'en.html' // handle root domain
    };

    // Reverse mapping for EN to VN
    const reverseMap = {};
    for (const [vn, en] of Object.entries(pageMap)) {
      if (vn !== '') reverseMap[en] = vn;
    }

    // Get current filename
    let currentPath = window.location.pathname;
    let currentFile = currentPath.split('/').pop() || '';
    
    // Default to index.html if no file specified
    if (Object.keys(pageMap).includes(currentFile) && currentFile === '') {
       currentFile = 'index.html';
    }

    if (lang === 'en') {
      // If we are on a VN page, redirect to EN page
      if (pageMap[currentFile]) {
        window.location.href = pageMap[currentFile] + window.location.hash;
      } else if (!currentFile.endsWith('-en.html') && currentFile.endsWith('.html')) {
        window.location.href = currentFile.replace('.html', '-en.html') + window.location.hash;
      }
    } else if (lang === 'vn') {
      // If we are on an EN page, redirect to VN page
      if (reverseMap[currentFile]) {
        window.location.href = reverseMap[currentFile] + window.location.hash;
      } else if (currentFile.endsWith('-en.html')) {
        window.location.href = currentFile.replace('-en.html', '.html') + window.location.hash;
      }
    }
  }

  updateLangUI(currentLang);

  langSwitchers.forEach(switcher => {
    const btnVN = switcher.querySelector('.data-lang-vn');
    const btnEN = switcher.querySelector('.data-lang-en');
    if (btnVN) btnVN.addEventListener('click', (e) => { e.preventDefault(); setLanguage('vn'); });
    if (btnEN) btnEN.addEventListener('click', (e) => { e.preventDefault(); setLanguage('en'); });
  });

  // --- Glassmorphism Navbar on Scroll ---
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => {
      if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load to set initial state
  }

  // --- Cinematic Pre-loader ---
  const preloader = document.getElementById('preloader');
  const brandMain = document.querySelector('.preloader-brand-main');
  const brandContainer = document.querySelector('.preloader-brand');

  if (preloader) {
    // Split brand text into characters for cinematic reveal
    if (brandMain) {
      const text = brandMain.textContent.trim();
      brandMain.innerHTML = text.split('').map((char, i) =>
        `<span style="transition-delay: ${0.4 + (i * 0.08)}s">${char === ' ' ? '&nbsp;' : char}</span>`
      ).join('');

      // Trigger reveal animation after a slight delay
      setTimeout(() => {
        if (brandContainer) brandContainer.classList.add('active');
      }, 100);
    }

    // Hide preloader after 2.8s OR when page is loaded (whichever is later, max 3.5s)
    const hidePreloader = () => {
      preloader.classList.add('hide');
      // Remove from DOM after transition ends
      setTimeout(() => {
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 900);
    };

    const minShowTime = 3200; // minimum display time in ms (increased for cinematic effect)
    const startTime = Date.now();

    const tryHide = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minShowTime - elapsed);
      setTimeout(hidePreloader, remaining);
    };

    if (document.readyState === 'complete') {
      tryHide();
    } else {
      window.addEventListener('load', tryHide, { once: true });
      // Failsafe: always hide after 3.5s
      setTimeout(hidePreloader, 3500);
    }
  }

  // --- Scroll Reveal (IntersectionObserver) ---
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Unobserve after reveal to free up resources
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -60px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback: show all if no IntersectionObserver support
    revealElements.forEach(el => el.classList.add('visible'));
  }

  // --- Zalo Booking Form Submit ---
  const zaloForm = document.getElementById('zaloBookingForm');
  if (zaloForm) {
    zaloForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isEnglish = window.location.pathname.includes('-en.html') || window.location.pathname.endsWith('/en.html') || localStorage.getItem('xomleo_lang') === 'en';
      const submitBtn = zaloForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.innerText = isEnglish ? 'PROCESSING...' : 'ĐANG XỬ LÝ...';
      submitBtn.disabled = true;

      const name = document.getElementById('book_name').value;
      const phone = document.getElementById('book_phone').value;
      const date = document.getElementById('book_date').value;
      const time = document.getElementById('book_time').value;
      const guests = document.getElementById('book_guests').value;
      const occasion = document.getElementById('book_occasion') ? document.getElementById('book_occasion').value : (isEnglish ? 'None' : 'Không có');
      const note = document.getElementById('book_note').value;
      const source = sessionStorage.getItem('xomleo_traffic_source') || 'Không rõ';

      // Google Apps Script (handles Sheets + Telegram server-side)
      const scriptURL = 'https://script.google.com/macros/s/AKfycbz1NADZyRLgg7CzZLkV9GpJBZkGnA0QuVJ9Zg2mOM0fxYQSqEAxigyVrRKhrHeOiHV0/exec';

      try {
        const formData = new URLSearchParams({
          name, phone, date, time, guests, occasion, note, source
        });
        await fetch(scriptURL, { method: 'POST', body: formData, mode: 'no-cors' });
      } catch (err) {
        console.error("Lỗi gửi đặt bàn:", err);
      }

      // Format ngày (từ YYYY-MM-DD sang DD/MM)
      let formattedDate = date;
      if (date && date.includes('-')) {
        const parts = date.split('-');
        formattedDate = `${parts[2]}/${parts[1]}`;
      }

      // Xây dựng tin nhắn theo văn phong giao tiếp tự nhiên
      let message = isEnglish
        ? `Hello Tiệm Nướng & Chill Xóm Lèo, I am ${name} (${phone}).\nI want to book a table on ${formattedDate} for ${guests} people at ${time}.`
        : `Chào Tiệm Nướng & Chill Xóm Lèo, mình là ${name} (${phone}).\nMình muốn đặt bàn ngày ${formattedDate} cho ${guests} người lúc ${time}.`;
      
      if (occasion && occasion !== 'Không có' && occasion !== 'None') {
        message += isEnglish ? ` Occasion: ${occasion}.` : ` tiệc ${occasion.toLowerCase()}.`;
      }
      if (note) {
        message += isEnglish ? ` Note: ${note}` : ` ghi chú: ${note}`;
      }

      try {
        // Copy to clipboard for phòng hờ
        await navigator.clipboard.writeText(message);

        // Tạo popup thông báo sang trọng (Toast notification)
        const toastTitle = isEnglish ? 'Booking successful!' : 'Đã lên đơn thành công!';
        const toastDesc = isEnglish
          ? `The system has saved the message to your device. When Zalo opens, please press <strong class="text-primary tracking-wide uppercase">"PASTE"</strong> to send your booking info to us!`
          : `Hệ thống đã lưu tin nhắn vào máy bạn. Khi Zalo mở lên, vui lòng bấm <strong class="text-primary tracking-wide uppercase">"Dán" (Paste)</strong> để gửi thông tin cho quán nhé!`;

        const toast = document.createElement('div');
        toast.className = 'fixed top-10 left-1/2 -translate-x-1/2 bg-surface border border-primary/30 p-6 rounded-lg shadow-[0_10px_40px_rgba(197,160,89,0.15)] z-[9999] flex flex-col items-center text-center animate-fade-in max-w-sm w-11/12';
        toast.innerHTML = `
          <div class="w-12 h-12 rounded-full bg-primary/10 flex flex-col items-center justify-center text-primary mb-4">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h4 class="text-lg font-serif text-primary mb-2">${toastTitle}</h4>
          <p class="text-sm text-foreground/80 font-light mb-4 leading-relaxed">${toastDesc}</p>
          <div class="w-full bg-muted/20 h-1 mt-2 relative overflow-hidden rounded"><div class="absolute top-0 left-0 h-full bg-primary animate-progress" style="width: 100%; transition: width 3s linear;"></div></div>
        `;
        document.body.appendChild(toast);

        // Hiệu ứng thanh chạy
        setTimeout(() => { toast.querySelector('.animate-progress').style.width = '0%'; }, 50);

        // Cập nhật lại Text nút submit
        submitBtn.innerText = isEnglish ? 'BOOKED! OPENING ZALO...' : 'ĐÃ LÊN ĐƠN! ĐANG MỞ ZALO...';

        // Mở Zalo sau 3 giây để khách kịp đọc thông báo
        setTimeout(() => {
          document.body.removeChild(toast);
          window.open(`https://zalo.me/0764527336?text=${encodeURIComponent(message)}`, '_blank');
          zaloForm.reset();
          submitBtn.innerText = originalText;
          submitBtn.disabled = false;
        }, 3000);

      } catch (err) {
        console.error('Failed to copy text: ', err);
        const alertMsg = isEnglish
          ? `Please manually copy the following message and send it to Zalo:\n\n${message}`
          : `Vui lòng copy thủ công tin nhắn sau và gửi cho Zalo Xóm Lèo:\n\n${message}`;
        alert(alertMsg);
        window.open(`https://zalo.me/0764527336?text=${encodeURIComponent(message)}`, '_blank');
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // --- TOC Smooth Scroll without Hash Update ---
  const tocLinks = document.querySelectorAll('.blog-toc a[href^="#"]');
  if (tocLinks.length > 0) {
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        // Ngăn trình duyệt tự động append #id vào URL
        e.preventDefault();

        const targetId = decodeURIComponent(link.getAttribute('href').substring(1));
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          // Tính toán vị trí cuộn có trừ hao cho fixed navbar
          const yOffset = -100;
          const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;

          window.scrollTo({
            top: y,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // --- Floating Contact Buttons Injection ---
  if (!document.querySelector('.floating-contact')) {
    const floatingHTML = `
      <div class="floating-contact">
                <a href="tel:0764527336" class="floating-btn btn-call" data-tooltip="Gọi ngay">
          <svg viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        </a>
        <a href="https://zalo.me/0764527336" target="_blank" class="floating-btn btn-zalo" data-tooltip="Chat Zalo">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.49 10.272v-.45h-.886v3.39h.886v-1.86c0-.675.27-1.08.81-1.08h.54v-.9h-.63c-.36 0-.585.18-.72.45zm-3.96.45c-.36 0-.63.27-.63.63s.27.63.63.63.63-.27.63-.63-.27-.63-.63-.63zm0 1.71c-.585 0-1.08-.495-1.08-1.08s.495-1.08 1.08-1.08 1.08.495 1.08 1.08-.495 1.08-1.08 1.08zM12 1.5C6.21 1.5 1.5 5.888 1.5 11.272c0 2.378.892 4.567 2.37 6.276L2.5 21.5l4.164-1.457A11.252 11.252 0 0 0 12 21.045c5.79 0 10.5-4.388 10.5-9.773S17.79 1.5 12 1.5zM6.61 13.212h-.886v-3.39h-.886v-.81h2.658v.81h-.886v3.39zm4.95-4.2h.886v4.2h-.886v-.45c-.27.36-.585.54-.99.54-.765 0-1.35-.675-1.35-1.44s.585-1.44 1.35-1.44c.405 0 .72.18.99.54v-.45zm-.99 2.52c.36 0 .675-.315.675-.72s-.315-.72-.675-.72-.675.315-.675.72.315.72.675.72zm5.175-2.52h.886v4.2h-.886v-.45c-.27.36-.585.54-.99.54-.765 0-1.35-.675-1.35-1.44s.585-1.44 1.35-1.44c.405 0 .72.18.99.54v-.45zm-.99 2.52c.36 0 .675-.315.675-.72s-.315-.72-.675-.72-.675.315-.675.72.315.72.675.72z"/></svg>
        </a>
      </div>
      
      <!-- Scroll to Top (Positioned dynamically) -->
      <button id="scrollToTopBtn" onclick="window.scrollTo({top: 0, behavior: 'smooth'})"
        class="fixed left-[16px] md:left-[24px] bottom-[24px] md:bottom-[24px] w-[42.5px] h-[42.5px] md:w-14 md:h-14 bg-foreground text-background rounded-full flex items-center justify-center shadow-2xl hover:bg-primary transition-all duration-500 group z-50 opacity-0 pointer-events-none translate-y-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="group-hover:-translate-y-1 transition-transform">
          <path d="m18 15-6-6-6 6"></path>
        </svg>
      </button>
    `;
    document.body.insertAdjacentHTML('beforeend', floatingHTML);
  }

  // --- Scroll to Top Button Visibility ---
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollToTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
        scrollToTopBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
      } else {
        scrollToTopBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10');
        scrollToTopBtn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
      }
    });
  }

  // --- Đoàn tàu chạy viền form (từng toa riêng + dây xích) ---
  const trainTrack = document.getElementById('train-track');
  if (trainTrack) {
    const loco = trainTrack.querySelector('.bt-loco');
    const wagons = Array.from(trainTrack.querySelectorAll('.bt-wagon'));
    wagons.sort((a, b) => Number(a.dataset.car) - Number(b.dataset.car));
    const allCars = [loco, ...wagons].filter(Boolean);
    const chains = Array.from(trainTrack.querySelectorAll('.bt-chain'));
    chains.sort((a, b) => Number(a.dataset.chain) - Number(b.dataset.chain));

    if (allCars.length > 0) {
      const SPEED = 80;
      const CAR_SPACING = 50;
      const OFFSET = 14;
      const CORNER_R = 64;        // khớp CSS border-radius 64px

      let headDist = 0;
      let lastTime = null;

      function getRoundedPerimeter(w, h, r) {
        return 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
      }

      function perimeterToPos(dist, w, h, r) {
        const sW = w - 2 * r;
        const sH = h - 2 * r;
        const arcLen = Math.PI * r / 2;
        const perimeter = 2 * sW + 2 * sH + 4 * arcLen;
        let d = ((dist % perimeter) + perimeter) % perimeter;

        if (d <= sW) return { x: r + d, y: -OFFSET, a: 0 };
        d -= sW;
        if (d <= arcLen) {
          const t = -Math.PI/2 + (d/arcLen) * (Math.PI/2);
          return { x: (w-r) + (r+OFFSET)*Math.cos(t), y: r + (r+OFFSET)*Math.sin(t), a: (t+Math.PI/2)*180/Math.PI };
        }
        d -= arcLen;
        if (d <= sH) return { x: w + OFFSET, y: r + d, a: 90 };
        d -= sH;
        if (d <= arcLen) {
          const t = (d/arcLen) * (Math.PI/2);
          return { x: (w-r) + (r+OFFSET)*Math.cos(t), y: (h-r) + (r+OFFSET)*Math.sin(t), a: (t+Math.PI/2)*180/Math.PI };
        }
        d -= arcLen;
        if (d <= sW) return { x: (w-r) - d, y: h + OFFSET, a: 180 };
        d -= sW;
        if (d <= arcLen) {
          const t = Math.PI/2 + (d/arcLen) * (Math.PI/2);
          return { x: r + (r+OFFSET)*Math.cos(t), y: (h-r) + (r+OFFSET)*Math.sin(t), a: (t+Math.PI/2)*180/Math.PI };
        }
        d -= arcLen;
        if (d <= sH) return { x: -OFFSET, y: (h-r) - d, a: 270 };
        d -= sH;
        const t = Math.PI + (d/arcLen) * (Math.PI/2);
        return { x: r + (r+OFFSET)*Math.cos(t), y: r + (r+OFFSET)*Math.sin(t), a: (t+Math.PI/2)*180/Math.PI };
      }

      function tick(ts) {
        if (!lastTime) lastTime = ts;
        const dt = (ts - lastTime) / 1000;
        lastTime = ts;

        const rect = trainTrack.getBoundingClientRect();
        const w = rect.width, h = rect.height, r = CORNER_R;
        const peri = getRoundedPerimeter(w, h, r);

        headDist = (headDist + SPEED * dt) % peri;

        // Tính vị trí từng toa
        const carPositions = [];
        allCars.forEach((car, i) => {
          const pos = perimeterToPos(headDist - i * CAR_SPACING, w, h, r);
          const cw = car === loco ? 44 : 38;
          const ch = car === loco ? 28 : 24;
          car.style.left = (pos.x - cw/2) + 'px';
          car.style.top = (pos.y - ch/2) + 'px';
          car.style.transform = 'rotate(' + pos.a + 'deg)';
          carPositions.push(pos);
        });

        // Vẽ dây xích ở giữa 2 toa liền kề
        chains.forEach((chain, i) => {
          if (i < carPositions.length - 1) {
            const p1 = carPositions[i];     // toa trước
            const p2 = carPositions[i + 1]; // toa sau
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
            chain.style.left = (mx - 7) + 'px';
            chain.style.top = (my - 3) + 'px';
            chain.style.transform = 'rotate(' + angle + 'deg)';
          }
        });

        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }
});

// Language Switcher Logic
document.addEventListener("DOMContentLoaded", () => {
    const langSwitchers = document.querySelectorAll('.lang-switcher');
    
    if (langSwitchers.length > 0) {
        // Find current language base on URL path
        const currentPath = window.location.pathname;
        // Also check if pathname has '-en'
        const isEnglish = currentPath === '/en' || currentPath === '/en/' || currentPath.includes('-en/') || currentPath.endsWith('-en');
        
        langSwitchers.forEach(switcher => {
            const btnVn = switcher.querySelector('.data-lang-vn');
            const btnEn = switcher.querySelector('.data-lang-en');
            
            if (btnVn && btnEn) {
                // Set UI state based on current language
                if (isEnglish) {
                    btnEn.classList.add('text-primary', 'pointer-events-none');
                    btnEn.classList.remove('hover:text-primary');
                    
                    btnVn.classList.remove('text-primary', 'pointer-events-none');
                    btnVn.classList.add('hover:text-primary');
                } else {
                    btnVn.classList.add('text-primary', 'pointer-events-none');
                    btnVn.classList.remove('hover:text-primary');
                    
                    btnEn.classList.remove('text-primary', 'pointer-events-none');
                    btnEn.classList.add('hover:text-primary');
                }

                // Add click events for redirecting
                btnEn.addEventListener('click', function() {
                    let newPath = currentPath;
                    
                    // Already English
                    if (isEnglish) return;
                    
                    if (currentPath === '/' || currentPath === '/index.html' || currentPath === '') {
                        newPath = '/en/';
                    } else {
                        // Remove trailing slash if exists
                        let path = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
                        // Remove /index.html if exists
                        if (path.endsWith('/index.html')) {
                            path = path.slice(0, -11);
                        }
                        newPath = path + '-en/';
                    }
                    window.location.href = newPath;
                });

                btnVn.addEventListener('click', function() {
                    let newPath = currentPath;
                    
                    // Already Vietnamese
                    if (!isEnglish) return;
                    
                    if (currentPath === '/en' || currentPath === '/en/' || currentPath === '/en/index.html') {
                        newPath = '/';
                    } else if (currentPath.includes('-en/')) {
                        newPath = currentPath.replace('-en/', '/');
                    } else if (currentPath.endsWith('-en')) {
                        newPath = currentPath.replace('-en', '/');
                    }
                    
                    window.location.href = newPath;
                });
            }
        });
    }
});
