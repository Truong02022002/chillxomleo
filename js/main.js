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

      const submitBtn = zaloForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.innerText = 'ĐANG XỬ LÝ...';
      submitBtn.disabled = true;

      const name = document.getElementById('book_name').value;
      const phone = document.getElementById('book_phone').value;
      const date = document.getElementById('book_date').value;
      const time = document.getElementById('book_time').value;
      const guests = document.getElementById('book_guests').value;
      const occasion = document.getElementById('book_occasion') ? document.getElementById('book_occasion').value : 'Không có';
      const note = document.getElementById('book_note').value;
      const source = sessionStorage.getItem('xomleo_traffic_source') || 'Không rõ';

      // TODO: Replace with Real Google Apps Script URL later
      const scriptURL = 'https://script.google.com/macros/s/AKfycbylyRQTLSvTC1OLSKWYqWUWjVUjc3w5jSiHjaaRWnrYfnpKm74Kv5t5R7FDtKIC3tI/exec';

      if (scriptURL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
        try {
          const formData = new URLSearchParams({
            name, phone, date, time, guests, occasion, note, source
          });
          await fetch(scriptURL, { method: 'POST', body: formData, mode: 'no-cors' });
        } catch (err) {
          console.error("Lỗi đồng bộ Google Sheets:", err);
        }
      }

      // Format ngày (từ YYYY-MM-DD sang DD/MM)
      let formattedDate = date;
      if (date && date.includes('-')) {
        const parts = date.split('-');
        formattedDate = `${parts[2]}/${parts[1]}`;
      }

      // Xây dựng tin nhắn theo văn phong giao tiếp tự nhiên
      let message = `Chào Xóm Lèo, mình là ${name} (${phone}).\nMình muốn đặt bàn ngày ${formattedDate} cho ${guests} người lúc ${time}`;
      if (occasion && occasion !== 'Không có') {
        message += ` tiệc ${occasion.toLowerCase()}`;
      }
      if (note) {
        message += `, ghi chú: ${note}`;
      }

      try {
        // Copy to clipboard for phòng hờ
        await navigator.clipboard.writeText(message);

        // Tạo popup thông báo sang trọng (Toast notification)
        const toast = document.createElement('div');
        toast.className = 'fixed top-10 left-1/2 -translate-x-1/2 bg-surface border border-primary/30 p-6 rounded-lg shadow-[0_10px_40px_rgba(197,160,89,0.15)] z-[9999] flex flex-col items-center text-center animate-fade-in max-w-sm w-11/12';
        toast.innerHTML = `
          <div class="w-12 h-12 rounded-full bg-primary/10 flex flex-col items-center justify-center text-primary mb-4">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h4 class="text-lg font-serif text-primary mb-2">Đã lên đơn thành công!</h4>
          <p class="text-sm text-foreground/80 font-light mb-4 leading-relaxed">Hệ thống đã lưu tin nhắn vào máy bạn. Khi Zalo mở lên, vui lòng bấm <strong class="text-primary tracking-wide uppercase">"Dán" (Paste)</strong> để gửi thông tin cho quán nhé!</p>
          <div class="w-full bg-muted/20 h-1 mt-2 relative overflow-hidden rounded"><div class="absolute top-0 left-0 h-full bg-primary animate-progress" style="width: 100%; transition: width 3s linear;"></div></div>
        `;
        document.body.appendChild(toast);

        // Hiệu ứng thanh chạy
        setTimeout(() => { toast.querySelector('.animate-progress').style.width = '0%'; }, 50);

        // Cập nhật lại Text nút submit
        submitBtn.innerText = 'ĐÃ LÊN ĐƠN! ĐANG MỞ ZALO...';

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
        alert(`Vui lòng copy thủ công tin nhắn sau và gửi cho Zalo Xóm Lèo:\n\n${message}`);
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
          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Zalo</title><path d="M21.812 11.233c0-5.748-4.887-10.41-10.906-10.41-6.02 0-10.906 4.662-10.906 10.41 0 2.26.793 4.364 2.152 6.071l-1.393 4.296s-.096.388.243.342c.338-.046 4.398-1.579 4.398-1.579a11.026 11.026 0 0 0 5.506 1.48c6.02 0 10.906-4.662 10.906-10.41zM6.924 9.176h1.996s0 .25-.327.658c-1.393 1.76-1.558 1.956-1.558 1.956h1.885c.164 0 .327.246.327.574v.853c0 .246-.164.574-.327.574H5.37c-.164 0-.327-.246-.327-.574v-.853c0-.246.164-.574.327-.574.654-.74 1.88-2.134 1.88-2.134H5.37c-.164 0-.327-.246-.327-.574v-.853c0-.246.164-.574.327-.574zM11.666 12.02l-1.554-3.053c-.082-.164-.082-.246-.082-.328 0-.246.164-.574.328-.574h1.062c.164 0 .164.082.246.246l.898 1.724.897-1.724a.555.555 0 0 1 .246-.246h1.062c.164 0 .164.082.328.574 0 .082 0 .164-.082.328L13.5 12.02v1.205c0 .245-.164.573-.328.573h-1.18c-.164 0-.328-.246-.328-.573v-1.205zm6.549 1.127c-.246.408-.654.654-1.228.654h-.654A1.677 1.677 0 0 1 14.655 12.18c0-.98.818-1.716 1.677-1.716h.654c.574 0 .982.246 1.228.654.164.246.246.49.246.818 0 .327-.082.573-.246.818zm-.982-1.39c-.164-.164-.327-.246-.573-.246h-.41c-.49 0-.818.328-.818.818 0 .49.328.818.818.818h.41c.246 0 .41-.082.573-.246.082-.164.164-.327.164-.573 0-.243-.082-.408-.164-.571z"/></svg>
        </a>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', floatingHTML);
  }
});
