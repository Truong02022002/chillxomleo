// --- Tracking Traffic Source ---
function captureTrafficSource() {
  const urlParams = new URLSearchParams(window.location.search);
  const ua = navigator.userAgent || '';

  // Trợ lý AI: nhận cả tên miền referrer lẫn giá trị utm_source mà nền tảng tự gắn
  // (ChatGPT gắn utm_source=chatgpt.com vào link). Chung tiền tố "AI: " để lọc một lần.
  // AI Overviews / AI Mode gửi referrer google.com nên vẫn tính là "Google Search".
  const aiAssistant = (value) => {
    const v = String(value || '').toLowerCase().replace(/^www\./, '');
    if (!v) return '';
    for (const [name, hosts] of [
      ['ChatGPT',    ['chatgpt.com', 'chat.openai.com']],
      ['Gemini',     ['gemini.google.com', 'bard.google.com']],
      ['NotebookLM', ['notebooklm.google.com']],
      ['Perplexity', ['perplexity.ai']],
      ['Claude',     ['claude.ai']],
      ['Copilot',    ['copilot.microsoft.com']],
      ['DeepSeek',   ['deepseek.com']],
      ['Grok',       ['grok.com']],
      ['Meta AI',    ['meta.ai']],
      ['Mistral',    ['chat.mistral.ai']],
      ['Qwen',       ['chat.qwen.ai']],
      ['Kimi',       ['kimi.com', 'kimi.moonshot.cn']],
    ]) {
      if (v === name.toLowerCase() || hosts.some((h) => v === h || v.endsWith('.' + h))) return 'AI: ' + name;
    }
    return '';
  };

  // Trang khách vào đầu tiên, gom về bộ từ cố định (xem nhánh UTM bên dưới).
  const trangVao = (duong) => {
    const p = String(duong || '/').toLowerCase().replace(/index\.html$/, '');
    if (p === '/' || p === '/en/' || p === '/en') return 'trang_chu';
    if (p.startsWith('/menu')) return 'menu';
    if (p.startsWith('/duong-di') || p.startsWith('/en/directions')) return 'duong_di';
    if (p.startsWith('/blog')) return 'blog';
    if (/^\/(ve-chung-toi|about)/.test(p)) return 'gioi_thieu';
    return 'bai_viet';
  };

  // 1. UTM Parameters (highest priority — campaign tag chủ động)
  if (urlParams.get('utm_source')) {
    if (urlParams.get('utm_medium'))   sessionStorage.setItem('xomleo_utm_medium',   urlParams.get('utm_medium'));
    if (urlParams.get('utm_campaign')) sessionStorage.setItem('xomleo_utm_campaign', urlParams.get('utm_campaign'));
    if (urlParams.get('utm_term'))     sessionStorage.setItem('xomleo_utm_term',     urlParams.get('utm_term'));
    if (urlParams.get('utm_content'))  sessionStorage.setItem('xomleo_utm_content',  urlParams.get('utm_content'));
    const aiUtm = aiAssistant(urlParams.get('utm_source'));
    if (aiUtm) return aiUtm;
    // "<trang vào>/<utm_source>", ví dụ "menu/google_maps": GBP có 3 nút cùng một
    // UTM (Trang web, Thực đơn, Đặt chỗ) nên phải biết khách bấm nút nào. KHÔNG ghép
    // medium vào đây — medium đã có cột riêng, trước 19-09-2026 ghép vào thì Apps
    // Script nối thêm lần nữa thành "organic / organic". Tên trang lấy từ bộ từ cố
    // định, không lấy slug bài hay utm_content: hệ thống quản lý quán gom nguồn bằng
    // regex trên cả chuỗi (facebook|tiktok|google...), chữ tự do lọt vào sẽ xếp sai nhóm.
    return trangVao(window.location.pathname) + '/' + urlParams.get('utm_source');
  }

  // 2. Click-ID parameters (link qua tracker/redirect thường mất referrer nhưng giữ click-id)
  // KHÔNG có fbclid ở đây: Facebook gắn fbclid vào MỌI link đi ra (bài đăng thường
  // của Fanpage, Messenger, Instagram), không riêng quảng cáo. Trước 19-09-2026 nó
  // bị ghi thành 'Facebook Ads' nên cột nguồn trong sheet đặt bàn thổi phồng quảng
  // cáo. Muốn tách quảng cáo Facebook thì gắn UTM cho link quảng cáo (tools/do-luong.md).
  if (urlParams.get('ttclid'))  return 'TikTok Ads';
  if (urlParams.get('gclid') || urlParams.get('gbraid') || urlParams.get('wbraid')) return 'Google Ads';
  if (urlParams.get('msclkid')) return 'Bing Ads';
  if (urlParams.get('zarsrc') || urlParams.get('zalo_source')) return 'Zalo';

  // 3. In-app browser detection (UA-based — referrer thường rỗng nên phải bắt trước)
  if (/musical_ly|trill|bytedance|ttwebview|aweme|tiktok/i.test(ua)) return 'TikTok (in-app)';
  if (/fban|fbav|fb_iab|fb4a|fbios/i.test(ua)) {
    return /messenger/i.test(ua) ? 'Messenger (in-app)' : 'Facebook (in-app)';
  }
  if (/instagram/i.test(ua))                return 'Instagram (in-app)';
  if (/barcelona/i.test(ua))                return 'Threads (in-app)';
  if (/zalo/i.test(ua))                     return 'Zalo (in-app)';
  if (/twitterandroid|twitter for/i.test(ua)) return 'Twitter / X (in-app)';
  if (/linkedinapp/i.test(ua))              return 'LinkedIn (in-app)';
  if (/pinterest/i.test(ua))                return 'Pinterest (in-app)';
  if (/snapchat/i.test(ua))                 return 'Snapchat (in-app)';
  if (/line\//i.test(ua))                   return 'LINE (in-app)';

  // 4. Referrer-based detection
  const referrer = document.referrer;
  if (!referrer) return urlParams.get('fbclid') ? 'Facebook' : 'Trực tiếp (Gõ URL / Bookmark)';

  try {
    const refUrl = new URL(referrer);
    const host = refUrl.hostname.toLowerCase();
    const path = refUrl.pathname.toLowerCase();

    // Internal trước (rút ngắn flow)
    if (host.includes('xomleo.vn')) return 'Nội bộ';

    // Trợ lý AI phải xét TRƯỚC nhóm Google: gemini.google.com chứa 'google.' nên
    // trước 14-09-2026 bị ghi nhầm thành 'Google Search'.
    const aiRef = aiAssistant(host);
    if (aiRef) return aiRef;

    // Subdomain Google specific (PHẢI check trước host.includes('google.'))
    if (host === 'mail.google.com')  return 'Gmail';
    if (host === 'meet.google.com')  return 'Google Meet';
    if (host === 'chat.google.com')  return 'Google Chat';
    if (host === 'lens.google.com')  return 'Google Lens';
    if (host === 'play.google.com')  return 'Google Play';
    if (host.startsWith('news.google.')) return 'Google News';
    if (host.startsWith('maps.google.') || (host.includes('google.') && path.startsWith('/maps'))) return 'Google Maps';

    // Mạng xã hội (kể cả subdomain redirect: l.facebook.com, lm.facebook.com, m.facebook.com, l.instagram.com)
    if (host.endsWith('facebook.com') || host === 'fb.com' || host === 'fb.me' || host.endsWith('.fb.com')) return 'Facebook';
    if (host.endsWith('messenger.com')) return 'Messenger';
    if (host.endsWith('instagram.com') || host === 'l.instagram.com') return 'Instagram';
    if (host.endsWith('tiktok.com') || host === 'vt.tiktok.com' || host === 'vm.tiktok.com') return 'TikTok';
    if (host.endsWith('youtube.com') || host === 'youtu.be' || host === 'm.youtube.com') return 'YouTube';
    if (host === 't.co' || host.endsWith('twitter.com') || host.endsWith('x.com')) return 'Twitter / X';
    if (host.endsWith('threads.net')) return 'Threads';
    if (host.endsWith('pinterest.com') || host === 'pin.it') return 'Pinterest';
    if (host.endsWith('linkedin.com') || host === 'lnkd.in') return 'LinkedIn';
    if (host.endsWith('reddit.com')) return 'Reddit';
    if (host.endsWith('snapchat.com')) return 'Snapchat';
    if (host === 't.me' || host.endsWith('telegram.org') || host.endsWith('telegram.me')) return 'Telegram';
    if (host.endsWith('discord.com') || host.endsWith('discord.gg')) return 'Discord';

    // Search engines (sau khi đã loại trừ subdomain Google specific ở trên)
    if (host.includes('google.'))      return 'Google Search';
    if (host.includes('bing.com'))     return 'Bing';
    if (host.includes('coccoc.com'))   return 'Cốc Cốc';
    if (host.includes('yahoo.'))       return 'Yahoo';
    if (host.includes('duckduckgo.com')) return 'DuckDuckGo';
    if (host.includes('yandex.'))      return 'Yandex';

    // Apps Vietnam
    if (host.includes('zalo.me') || host.includes('zaloapp.com') || host.includes('chat.zalo')) return 'Zalo';
    if (host.includes('shopee.vn'))    return 'Shopee';
    if (host.includes('grab.com'))     return 'Grab';
    if (host.includes('foody.vn') || host.includes('shopeefood')) return 'ShopeeFood / Foody';

    // Travel & Review
    if (host.includes('tripadvisor.')) return 'TripAdvisor';
    if (host.includes('booking.com'))  return 'Booking.com';
    if (host.includes('agoda.com'))    return 'Agoda';
    if (host.includes('traveloka.com')) return 'Traveloka';

    return 'Web khác: ' + host;
  } catch (e) {
    return 'Web khác';
  }
}

// Persist source: nếu URL hiện tại có UTM/click-id thì LUÔN ghi đè (campaign mới override),
// không có thì chỉ ghi nếu chưa có (giữ first-touch trong session).
(function persistTrafficSource() {
  try {
    const p = new URLSearchParams(window.location.search);
    const hasUtm     = !!p.get('utm_source');
    const hasClickId = !!(p.get('ttclid') || p.get('fbclid') || p.get('gclid') ||
                          p.get('gbraid') || p.get('wbraid') || p.get('msclkid'));
    const stored = sessionStorage.getItem('xomleo_traffic_source');
    if (!stored || hasUtm || hasClickId) {
      sessionStorage.setItem('xomleo_traffic_source', captureTrafficSource());
      sessionStorage.setItem('xomleo_landing_page', window.location.pathname + window.location.search);
      sessionStorage.setItem('xomleo_landing_referrer', document.referrer || '');
    }
  } catch (e) { /* sessionStorage có thể bị tắt — bỏ qua */ }
})();

// --- Đo lường GA4: sự kiện hành vi có giá trị ---
// Trước 16-09-2026 site chỉ có page_view: không biết khách gọi điện, nhắn Zalo,
// bấm chỉ đường hay gửi form từ trang nào, nên không đánh giá được bài viết nào
// thật sự ra khách (mục 247-250, 253 của cẩm nang).
//
// Ba nguyên tắc khi sửa khối này:
//  1. MỘT thao tác chỉ bắn MỘT event — bộ lắng nghe uỷ quyền bên dưới `return`
//     ngay sau lần khớp đầu tiên; đừng gắn thêm listener riêng cho từng nút.
//  2. KHÔNG gửi dữ liệu nhận dạng cá nhân vào GA4 (tên, số điện thoại, ghi chú
//     của khách). Chỉ gửi ngữ cảnh: loại trang, vị trí nút, số khách, dịp.
//  3. Event tuỳ chỉnh viết snake_case và bắt đầu bằng động từ; ưu tiên tên
//     khuyến nghị của GA4 khi có (form đặt bàn dùng `generate_lead`).
//
// ⚠ GIỚI HẠN ĐÃ BIẾT của số liệu GA4 site này (đo 16-09-2026, chủ site đã chốt
// giữ nguyên để không mất điểm PSI): khách KHÔNG chạm/cuộn thì gtag/js chỉ được
// tải sau 5,0-8,1 giây (máy nhanh 6757ms; CPU x4 + 4G chậm 4999ms; CPU x6 + 3G
// chậm 5919ms; bài viết + 4G chậm 8094ms) vì script nội tuyến đợi FCP rồi đợi lúc
// CPU rảnh. Ai rời trang trước mốc đó thì GA4 không nhận được gì — mất cả
// page_view lẫn phiên. Hệ quả khi đọc báo cáo: phiên ngắn bị thiếu có hệ thống,
// nên mọi tỉ lệ chuyển đổi (lead / phiên) ĐẸP HƠN thực tế. Đừng coi đây là lỗi đo
// lường: đó là đánh đổi cố ý, xem commit dad65de0.
//
// gtag() do script nội tuyến trong <head> khai báo; nó đẩy vào dataLayer nên gọi
// được cả trước lúc gtag/js tải xong. Thứ tự vẫn đúng vì gtag/js được nạp ở
// `pointerdown`/`keydown`/`touchstart` — tức là TRƯỚC sự kiện `click` mà khối này
// nghe, nên lệnh `config` luôn nằm trước `event` trong hàng đợi.
const XL_DO = (function () {
  const duongDan = (window.location.pathname || '/').toLowerCase().replace(/index\.html$/, '');

  // page_type: nhóm trang để báo cáo Landing Page → Key Events (mục 253) đọc được
  // ngay, khỏi phải tự gom 123 URL bằng tay trong Explorations.
  function loaiTrang() {
    if (duongDan === '/' || duongDan === '/en/' || duongDan === '/en') return 'home';
    if (duongDan.startsWith('/menu')) return 'menu';
    if (duongDan.startsWith('/blog')) return 'blog_index';
    if (duongDan.startsWith('/duong-di')) return 'directions';
    if (duongDan.startsWith('/chinh-sach-bao-mat') || duongDan.startsWith('/dieu-khoan-su-dung')) return 'policy';
    if (/^\/(about|ve-chung-toi)/.test(duongDan)) return 'about';
    if (document.querySelector('article')) return 'blog_post';
    return 'other';
  }

  // intent_stage: giai đoạn của TRANG nơi hành vi xảy ra, không phải của hành vi
  // (mọi hành vi đo ở đây đều là "action" nên gán theo hành vi sẽ thành hằng số
  // vô dụng). Nhờ vậy trả lời được "bao nhiêu cuộc gọi đến từ bài du lịch chung".
  function giaiDoan(loai) {
    if (loai === 'directions' || loai === 'menu') return 'action';
    if (loai === 'home' || /xom-leo|tiem-nuong|quan-nuong|dat-tiec/.test(duongDan)) return 'consideration';
    return 'awareness';
  }

  const LOAI_TRANG = loaiTrang();
  const GIAI_DOAN = giaiDoan(LOAI_TRANG);

  // cta_position: đọc từ DOM lúc bấm. Site không có class riêng cho từng khối CTA
  // nên bám vào landmark có thật (.floating-contact, #mobile-menu, header, footer,
  // #booking, aside giữa bài) — xem `tools/` nếu đổi cấu trúc các khối này.
  function viTri(el) {
    const bang = [
      ['[role="status"]', 'toast'],
      ['[role="alert"]', 'toast'],  // thông báo gửi đặt bàn thất bại
      ['.floating-contact', 'floating'],
      ['#mobile-menu', 'mobile_menu'],
      // Thanh điều hướng trên cùng là <nav id="navbar">, KHÔNG phải <header>:
      // trang chủ/menu/blog không có thẻ <header> nào, còn trong bài viết thì
      // <header> là phần tiêu đề bài. Bắt bằng 'header' sẽ gán sai vị trí.
      ['#navbar', 'navbar'],
      ['footer', 'footer'],
      ['#booking', 'booking_form'],
      // Chỉ section hero thật. Đừng nới thành [class*="hero"]: <body> trang chủ
      // mang class 'home-hero-dark' nên mọi nút trên trang sẽ thành 'hero'.
      ['.hero-cinematic', 'hero'],
      ['aside', 'article_aside'],   // khối phụ cuối bài (bài liên quan, nguồn tham khảo)
      ['article', 'article_body'],  // CTA chèn giữa thân bài
      ['main', 'main'],
    ];
    for (const [chon, ten] of bang) {
      try { if (el.closest(chon)) return ten; } catch (e) { /* selector không hợp lệ trên trình duyệt cũ */ }
    }
    return 'other';
  }

  function gui(ten, thamSo) {
    try {
      const payload = Object.assign({
        page_type: LOAI_TRANG,
        intent_stage: GIAI_DOAN,
        page_language: document.documentElement.lang || 'vi',
      }, thamSo || {});
      if (typeof window.gtag === 'function') {
        window.gtag('event', ten, payload);
      } else {
        // Stub chuyển hướng và trang không có thẻ GA: giữ lệnh trong hàng đợi,
        // gtag/js xử lý nếu có; không có thì cũng không văng lỗi.
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(['event', ten, payload]);
      }
    } catch (e) { /* chặn quảng cáo / gtag bị chặn — không được làm hỏng nút bấm */ }
  }

  // Bắt ở pha capture để một handler khác gọi stopPropagation cũng không làm mất
  // số liệu (khối nhúng iframe và mục lục đều preventDefault ở pha bubble).
  document.addEventListener('click', function (e) {
    const el = e.target;
    if (!el || typeof el.closest !== 'function') return;
    const a = el.closest('a[href]');
    if (!a) return;

    const href = a.getAttribute('href') || '';
    const viTriNut = viTri(a);

    if (/^tel:/i.test(href)) {
      return gui('click_call', { cta_position: viTriNut, contact_method: 'phone' });
    }
    if (/^(https?:)?\/\/(www\.)?zalo\.me\//i.test(href) || /^https?:\/\/zalo\.me/i.test(href)) {
      return gui('chat_open', { cta_position: viTriNut, chat_channel: 'zalo' });
    }
    if (/^https?:\/\/(www\.)?(m\.me|messenger\.com)\//i.test(href)) {
      return gui('chat_open', { cta_position: viTriNut, chat_channel: 'messenger' });
    }
    if (/^https?:\/\/([a-z0-9.-]*\.)?(google\.[a-z.]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/i.test(href)) {
      return gui('click_directions', { cta_position: viTriNut, map_target: 'google_maps' });
    }
    if (/(^|\/)#booking$/.test(href)) {
      // Bấm nút "Đặt bàn" mới chỉ là ý định, KHÔNG phải khách hàng tiềm năng.
      // Để đo tỉ lệ hoàn tất form, đừng đánh dấu event này là Key Event.
      return gui('click_booking_cta', { cta_position: viTriNut });
    }
  }, true);

  return { gui: gui, loaiTrang: LOAI_TRANG, giaiDoan: GIAI_DOAN, viTri: viTri };
})();

document.addEventListener('DOMContentLoaded', () => {
  // --- Mobile Menu Toggle ---
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    const ICON_MO = `<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
    const ICON_DONG = `<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>`;

    // Panel chi bi day ra ngoai bang transform nen khi "dong" no van nam trong
    // cay tieu diem: nguoi dung ban phim/screen reader van Tab vao 8 muc vo hinh.
    // `inert` go han no khoi cay tieu diem lan cay tro nang.
    const datTrangThai = (mo) => {
      mobileMenu.classList.toggle('translate-x-full', !mo);
      mobileMenu.inert = !mo;
      mobileMenuBtn.setAttribute('aria-expanded', mo ? 'true' : 'false');
      mobileMenuBtn.innerHTML = mo ? ICON_MO : ICON_DONG;
    };

    datTrangThai(!mobileMenu.classList.contains('translate-x-full'));

    mobileMenuBtn.addEventListener('click', () => {
      datTrangThai(mobileMenu.classList.contains('translate-x-full'));
    });

    // Close menu when clicking a link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => datTrangThai(false));
    });

    // Escape dong menu va tra tieu diem ve nut
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (mobileMenu.classList.contains('translate-x-full')) return;
      datTrangThai(false);
      mobileMenuBtn.focus();
    });
  }

  // --- Dynamic Active Nav Highlighting ---
  function highlightActiveNav() {
    const path = window.location.pathname;
    const desktopNavLinks = document.querySelectorAll('.hidden.lg\\:flex.items-center.space-x-8 a');
    const mobileNavLinks = document.querySelectorAll('#mobile-menu .flex-col.gap-6.text-2xl a');

    function isMatch(href, currentPath) {
      if (!href) return false;
      // Normalize both paths for comparison
      const normHref = href.endsWith('/') ? href.slice(0, -1) : href;
      const normPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;

      if (normHref === normPath) return true;
      if (normHref === '' && (normPath === '/' || normPath === '/index.html' || normPath === '/en' || normPath === '/en/index.html')) return true;
      if (normHref === '/en' && (normPath === '/en/' || normPath === '/en/index.html')) return true;
      return false;
    }

    desktopNavLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (isMatch(href, path)) {
        link.className = 'transition-all duration-300 relative py-1 px-3 rounded-full bg-white/10 text-foreground';
        link.setAttribute('aria-current', 'page');
      } else {
        link.className = 'transition-all duration-300 relative py-1 px-3 rounded-full text-foreground/70 hover:text-foreground';
        link.removeAttribute('aria-current');
      }
    });

    mobileNavLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (isMatch(href, path)) {
        link.className = 'transition-colors text-primary pl-4 border-l-2 border-primary';
        link.setAttribute('aria-current', 'page');
      } else {
        link.className = 'transition-colors text-foreground/70 pl-4 border-l-2 border-transparent';
        link.removeAttribute('aria-current');
      }
    });
  }
  highlightActiveNav();


  // --- Language Switcher UI Toggle ---
  const langSwitchers = document.querySelectorAll('.lang-switcher');

  let currentPathForInit = window.location.pathname;
  if (currentPathForInit.endsWith('/index.html')) currentPathForInit = currentPathForInit.replace('/index.html', '');
  if (currentPathForInit.endsWith('/')) currentPathForInit = currentPathForInit.slice(0, -1);
  const pathSegment = currentPathForInit.split('/').pop() || '';

  const isEnPageInitial = pathSegment === 'en' || pathSegment.endsWith('-en') || currentPathForInit.endsWith('-en.html') || currentPathForInit.endsWith('en.html') || currentPathForInit.startsWith('/en/');

  let currentLang = localStorage.getItem('xomleo_lang') || 'vn';

  // Override if URL explicitly indicates language
  if (isEnPageInitial) currentLang = 'en';
  else if (!isEnPageInitial && currentPathForInit !== '') currentLang = 'vn';

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

    let path = window.location.pathname;
    try { path = decodeURIComponent(path); } catch (e) { }

    // Normalize path: lowercase, remove index.html, remove trailing slash
    path = path.toLowerCase().replace(/\/index\.html$/, '').replace(/\/$/, '');
    if (!path) path = '/';

    const pageMap = {
      'vn_to_en': {
        '/': '/en/',
        '/about': '/about-en/',
        '/menu': '/menu-en/',
        '/ve-chung-toi': '/about-us-en/',
        '/blog': '/blog-en/',
        '/chinh-sach-bao-mat': '/en/privacy-policy/',
        '/dieu-khoan-su-dung': '/en/terms-of-use/',
        '/duong-di': '/en/directions/'
      },
      'en_to_vn': {
        '/en': '/',
        '/about-en': '/about/',
        '/menu-en': '/menu/',
        '/about-us-en': '/ve-chung-toi/',
        '/blog-en': '/blog/',
        '/en/privacy-policy': '/chinh-sach-bao-mat/',
        '/en/terms-of-use': '/dieu-khoan-su-dung/',
        '/en/directions': '/duong-di/'
      }
    };

    let newPath = '';

    if (lang === 'en') {
      if (pageMap.vn_to_en[path]) {
        newPath = pageMap.vn_to_en[path];
      } else if (!path.endsWith('-en') && !path.startsWith('/en')) {
        newPath = path + '-en/';
      }
    } else if (lang === 'vn') {
      if (pageMap.en_to_vn[path]) {
        newPath = pageMap.en_to_vn[path];
      } else if (path.endsWith('-en')) {
        newPath = path.substring(0, path.length - 3) + '/';
      } else if (path.startsWith('/en')) {
        newPath = path.replace('/en', '') + '/';
      }
    }

    // Final cleanup of newPath
    if (newPath) {
      if (!newPath.startsWith('/')) newPath = '/' + newPath;
      // Ensure specific mapped paths keep their trailing slash if intended, 
      // but blog posts already get it from the logic above.

      if (newPath !== window.location.pathname) {
        window.location.href = newPath;
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
    let navTicking = false;
    let lastScrolled = null;
    const onScroll = () => {
      if (navTicking) return;
      navTicking = true;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY > 60;
        if (scrolled !== lastScrolled) {
          navbar.classList.toggle('scrolled', scrolled);
          lastScrolled = scrolled;
        }
        navTicking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- Cinematic Pre-loader ---
  const preloader = document.getElementById('preloader');
  const brandMain = document.querySelector('.preloader-brand-main');
  const brandContainer = document.querySelector('.preloader-brand');

  // Mobile: remove preloader DOM entirely (CSS already hidden via media query, this cleans up the work)
  if (preloader && window.matchMedia('(max-width: 768px)').matches) {
    if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
  } else if (preloader) {
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

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const minShowTime = isMobile ? 400 : 1200;
    const startTime = Date.now();

    // Truoc day cho mot stylesheet ten 'tailwind-output'. File do da duoc gop vao
    // site.css tu commit d88d2d5 nen dieu kien khong bao gio dung -> vong poll chay
    // het timeout va preloader khoa man hinh 5,6s thay vi 1,2s.
    // site.css la render-blocking trong <head> nen luc script nay chay CSS chac chan
    // da parse xong; chi can doi 'load' roi ha preloader.
    const tryHide = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minShowTime - elapsed);
      setTimeout(hidePreloader, remaining);
    };

    if (document.readyState === 'complete') {
      tryHide();
    } else {
      window.addEventListener('load', tryHide, { once: true });
      // Hard failsafe at 5s — absolute last resort
      setTimeout(() => {
        if (preloader && !preloader.classList.contains('hide')) hidePreloader();
      }, 5000);
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

  // --- HTML Escape (XSS Prevention) ---
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Input Validation ---
  function validateBookingInput(name, phone, guests, note, date, time, isEnglish) {
    const errors = [];
    // Name: 1-50 chars, no dangerous chars
    if (!name || name.trim().length === 0) {
      errors.push(isEnglish ? 'Please enter your name' : 'Vui lòng nhập tên');
    } else if (name.length > 50) {
      errors.push(isEnglish ? 'Name must be under 50 characters' : 'Tên không quá 50 ký tự');
    } else if (/[<>{}\[\]\\]/.test(name)) {
      errors.push(isEnglish ? 'Name contains invalid characters' : 'Tên chứa ký tự không hợp lệ');
    }
    // Phone: Vietnamese format
    const phoneClean = phone.replace(/[\s\-\.]/g, '');
    if (!/^(\+?\d{1,4})?\d{6,15}$/.test(phoneClean)) {
      errors.push(isEnglish ? 'Please enter a valid phone number (6-15 digits)' : 'Số điện thoại không hợp lệ (6-15 chữ số)');
    }
    // Guests: 1-50
    const guestsNum = parseInt(guests);
    if (isNaN(guestsNum) || guestsNum < 1 || guestsNum > 50) {
      errors.push(isEnglish ? 'Number of guests must be 1-50' : 'Số khách phải từ 1-50');
    }
    // Note: max 200 chars
    if (note && note.length > 200) {
      errors.push(isEnglish ? 'Notes must be under 200 characters' : 'Ghi chú không quá 200 ký tự');
    }
    // Date + Time: không cho đặt quá khứ. Nếu hôm nay, time phải >= now + 30min (đủ để NV nhắn Zalo xác nhận trước khi khách tới).
    if (date) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const [yy, mm, dd] = date.split('-').map(Number);
      const picked = new Date(yy, (mm || 1) - 1, dd || 1);
      if (isNaN(picked.getTime())) {
        errors.push(isEnglish ? 'Invalid date' : 'Ngày không hợp lệ');
      } else if (picked < today) {
        errors.push(isEnglish ? 'Booking date cannot be in the past' : 'Không thể đặt bàn cho ngày trong quá khứ');
      } else if (picked.getTime() === today.getTime() && time) {
        const [hh, mi] = time.split(':').map(Number);
        const pickedDateTime = new Date(yy, mm - 1, dd, hh || 0, mi || 0);
        const minLeadTime = new Date(now.getTime() + 30 * 60 * 1000); // +30 phút
        if (pickedDateTime < minLeadTime) {
          errors.push(isEnglish
            ? 'Please book at least 30 minutes in advance so our staff can confirm via Zalo'
            : 'Vui lòng đặt trước ít nhất 30 phút để nhân viên kịp xác nhận qua Zalo');
        }
      }
    }
    return errors;
  }

  // --- Rate Limiting (30s cooldown) ---
  function canSubmitForm() {
    const lastSubmit = sessionStorage.getItem('xomleo_last_booking');
    if (lastSubmit) {
      const elapsed = Date.now() - parseInt(lastSubmit);
      if (elapsed < 30000) return Math.ceil((30000 - elapsed) / 1000);
    }
    return 0;
  }
  function markFormSubmitted() {
    sessionStorage.setItem('xomleo_last_booking', Date.now().toString());
  }

  // Gửi đặt bàn thất bại: nói thật là quán CHƯA nhận được, đưa hai đường giữ bàn
  // ngay. Không tự ẩn như thông báo thành công — khách phải kịp đọc số điện thoại.
  function hienLoiDatBan(isEnglish) {
    const cu = document.getElementById('booking-error-toast');
    if (cu) cu.remove();
    const toast = document.createElement('div');
    toast.id = 'booking-error-toast';
    toast.className = 'fixed top-10 left-1/2 -translate-x-1/2 bg-surface border border-primary/30 p-6 rounded-lg shadow-[0_10px_40px_rgba(160,63,0,0.15)] z-[9999] flex flex-col items-center text-center animate-fade-in max-w-sm w-11/12';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <button type="button" data-toast-close class="absolute top-2 right-2 p-2 text-foreground/50 hover:text-foreground transition-colors" aria-label="${isEnglish ? 'Close notification' : 'Đóng thông báo'}">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      <h4 class="text-lg font-serif text-primary mb-2">${isEnglish ? 'Your booking was not sent' : 'Chưa gửi được thông tin đặt bàn'}</h4>
      <p class="text-sm text-foreground/80 font-light mb-4 leading-relaxed">${isEnglish
        ? 'The connection failed, so the restaurant has not received your request. Your details are still in the form — try again, or call or Zalo us to hold a table right away.'
        : 'Đường truyền trục trặc nên quán chưa nhận được yêu cầu của bạn. Thông tin bạn nhập vẫn còn nguyên — bạn thử gửi lại, hoặc gọi/nhắn Zalo để quán giữ bàn ngay nhé.'}</p>
      <div class="flex flex-wrap justify-center gap-3">
        <a href="tel:0764527336" class="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider">${isEnglish ? 'Call +84 76 452 7336' : 'Gọi 076 452 7336'}</a>
        <a href="https://zalo.me/0764527336" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-[#0068FF] hover:bg-[#0055DD] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider">${isEnglish ? 'Chat via Zalo' : 'Nhắn qua Zalo'}</a>
      </div>
    `;
    document.body.appendChild(toast);
    const dong = () => { document.removeEventListener('keydown', bamEsc); toast.remove(); };
    const bamEsc = (e) => { if (e.key === 'Escape') dong(); };
    toast.querySelector('[data-toast-close]').addEventListener('click', dong);
    document.addEventListener('keydown', bamEsc);
  }

  // --- Zalo Booking Form Submit ---
  const zaloForm = document.getElementById('zaloBookingForm');
  if (zaloForm) {
    // Chặn chọn ngày quá khứ ở native date picker
    const dateInput = document.getElementById('book_date');
    if (dateInput) {
      const todayISO = new Date().toISOString().split('T')[0];
      dateInput.min = todayISO;
      if (!dateInput.value) dateInput.value = todayISO; // default là hôm nay
    }

    zaloForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Anti-spam honeypot check
      const honeypot = document.getElementById('book_honeypot');
      if (honeypot && honeypot.value) {
        // Bot detected — silently ignore
        return;
      }

      const isEnglish = window.location.pathname.includes('/en/') || window.location.pathname.includes('/en.');

      // Rate limiting check
      const cooldown = canSubmitForm();
      if (cooldown > 0) {
        alert(isEnglish
          ? `Please wait ${cooldown} seconds before submitting again.`
          : `Vui lòng đợi ${cooldown} giây trước khi gửi lại.`);
        return;
      }

      const nameVal = document.getElementById('book_name').value;
      const phoneVal = document.getElementById('book_phone').value;
      const guestsVal = document.getElementById('book_guests').value;
      const noteVal = document.getElementById('book_note').value;
      const dateVal = document.getElementById('book_date').value;
      const timeVal = document.getElementById('book_time').value;

      // Input validation
      const validationErrors = validateBookingInput(nameVal, phoneVal, guestsVal, noteVal, dateVal, timeVal, isEnglish);
      if (validationErrors.length > 0) {
        alert(validationErrors.join('\n'));
        return;
      }

      const submitBtn = zaloForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.innerText = isEnglish ? 'PROCESSING...' : 'ĐANG XỬ LÝ...';
      submitBtn.disabled = true;

      // Mark rate limit
      markFormSubmitted();

      const name = nameVal;
      const phone = phoneVal;
      const date = document.getElementById('book_date').value;
      const time = document.getElementById('book_time').value;
      const guests = guestsVal;
      const occasion = document.getElementById('book_occasion') ? document.getElementById('book_occasion').value : (isEnglish ? 'None' : 'Không có');
      const note = noteVal;
      const source = sessionStorage.getItem('xomleo_traffic_source') || 'Không rõ';
      const medium = sessionStorage.getItem('xomleo_utm_medium') || '';
      const campaign = sessionStorage.getItem('xomleo_utm_campaign') || '';
      const term = sessionStorage.getItem('xomleo_utm_term') || '';
      const content = sessionStorage.getItem('xomleo_utm_content') || '';

      // Google Apps Script (obfuscated endpoint)
      const _0x = 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6dmNCVk1VVTU1RWlsTHEtV2VLZ3d1b0RfcF8yQTIzWC1CY3R5eklRdzI4NEhuT3ZLRHZ0b3hIcjc5dzBtc0psenRQdy9leGVj';
      const scriptURL = atob(_0x);

      const formData = new URLSearchParams({
        name, phone, date, time, guests, occasion, note,
        source, medium, campaign, term, content,
        landing_page:     sessionStorage.getItem('xomleo_landing_page')     || window.location.pathname,
        landing_referrer: sessionStorage.getItem('xomleo_landing_referrer') || document.referrer || '',
        submit_page:      window.location.pathname,
        brand: 'xomleo'
      });

      // Kết quả gửi (mục 279 — chỉ tính lead khi hệ thống XÁC NHẬN):
      //  'xac_nhan'  Apps Script trả JSON không báo lỗi → generate_lead + báo đã gửi.
      //  'khong_ro'  đơn đi được nhưng không đọc được trả lời → báo đã gửi, KHÔNG tính lead.
      //  'loi'       mất mạng, hoặc Apps Script trả lỗi → báo lỗi, giữ nguyên dữ liệu.
      // Trước 19-09-2026 fetch dùng `mode:'no-cors'`, không đọc được gì: Apps Script
      // trả 500 hay bị gỡ triển khai thì khách VẪN thấy "Đã gửi" và event VẪN bắn;
      // mất mạng thì event không bắn nhưng khách cũng VẪN thấy "Đã gửi" → mất đơn
      // mà khách tưởng đã đặt được bàn.
      // Đọc được vì webhook trả JSON kèm `Access-Control-Allow-Origin: *` (doGet trả
      // {"status":"ok",...}, kiểm 19-09-2026). Body URLSearchParams là "simple
      // request" nên không có preflight OPTIONS — thứ Apps Script không xử lý được.
      let ketQua = 'loi';
      try {
        const res = await fetch(scriptURL, { method: 'POST', body: formData });
        const text = await res.text();
        let data = null;
        try { data = JSON.parse(text); } catch (e) { /* không phải JSON */ }
        if (!res.ok) ketQua = 'loi';
        else if (!data || typeof data !== 'object') ketQua = 'khong_ro';
        else ketQua = /err|fail|invalid/i.test(String(data.status || data.result || '')) ? 'loi' : 'xac_nhan';
      } catch (err) {
        // TypeError có hai nghĩa: mất mạng, HOẶC đơn đã tới Apps Script nhưng trình
        // duyệt không cho đọc trả lời. Hỏi lại chính webhook bằng GET: trả lời được
        // thì mạng vẫn thông, đơn nhiều khả năng đã tới — đừng báo lỗi kẻo khách gửi
        // lại thành đơn trùng.
        try { if ((await fetch(scriptURL)).ok) ketQua = 'khong_ro'; } catch (e) { /* mất mạng thật */ }
        if (ketQua === 'loi') console.error('Lỗi gửi đặt bàn:', err);
      }

      if (ketQua === 'loi') {
        hienLoiDatBan(isEnglish);
        // Mở khoá để khách gửi lại được ngay: đơn này chưa tới quán.
        try { sessionStorage.removeItem('xomleo_last_booking'); } catch (e) { /* bỏ qua */ }
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        return;
      }

      // Honeypot, rate limit và lỗi nhập liệu đều đã `return` phía trên nên không
      // lọt vào đây. KHÔNG gửi tên/số điện thoại/ghi chú của khách vào GA4.
      if (ketQua === 'xac_nhan') {
        const DIP = {
          'Không có': 'none', 'None': 'none',
          'Sinh nhật': 'birthday', 'Birthday': 'birthday',
          'Kỉ niệm': 'anniversary', 'Anniversary': 'anniversary',
          'Cầu Hôn': 'proposal', 'Proposal': 'proposal',
        };
        XL_DO.gui('generate_lead', {
          form_id: 'zaloBookingForm',
          lead_type: 'booking_form',
          cta_position: 'booking_form',
          guests: Number(guests) || undefined,
          occasion: DIP[occasion] || 'other',
        });
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

      // Tạo popup thông báo cảm ơn sang trọng
      // Sanitize user input to prevent XSS
      const safeName = escapeHTML(name);
      const safePhone = escapeHTML(phone);
      const safeGuests = escapeHTML(guests);

      const toastTitle = isEnglish ? '✨ Booking Request Sent!' : '✨ Đã gửi thông tin đặt bàn';
      const toastDesc = isEnglish
        ? `Thank you <strong class="text-primary">${safeName}</strong> for your reservation!<br>Our staff will contact you shortly at <strong class="text-primary">${safePhone}</strong> to confirm your booking.<br><span class="text-foreground/50 text-xs mt-1 block">📅 ${formattedDate} • 🕐 ${time} • 👥 ${safeGuests} guests</span>`
        : `Cảm ơn <strong class="text-primary">${safeName}</strong> đã gửi thông tin đặt bàn!<br>Nhân viên của Tiệm Nướng & Chill Xóm Lèo sẽ sớm liên hệ lại qua số <strong class="text-primary">${safePhone}</strong> để xác nhận cho bạn nhé.<br><span class="text-foreground/50 text-xs mt-1 block">📅 ${formattedDate} • 🕐 ${time} • 👥 ${safeGuests} khách</span>`;

      const toast = document.createElement('div');
      toast.className = 'fixed top-10 left-1/2 -translate-x-1/2 bg-surface border border-primary/30 p-6 rounded-lg shadow-[0_10px_40px_rgba(160,63,0,0.15)] z-[9999] flex flex-col items-center text-center animate-fade-in max-w-sm w-11/12';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.innerHTML = `
        <button type="button" data-toast-close class="absolute top-2 right-2 p-2 text-foreground/50 hover:text-foreground transition-colors" aria-label="${isEnglish ? 'Close notification' : 'Đóng thông báo'}">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <div class="w-14 h-14 rounded-full bg-primary/10 flex flex-col items-center justify-center text-primary mb-4">
          <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h4 class="text-lg font-serif text-primary mb-2">${toastTitle}</h4>
        <p class="text-sm text-foreground/80 font-light mb-4 leading-relaxed">${toastDesc}</p>
        <a href="https://zalo.me/0764527336" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-[#0068FF] hover:bg-[#0055DD] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 mb-3 shadow-lg hover:shadow-[#0068FF]/30 hover:-translate-y-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
          ${isEnglish ? 'Chat via Zalo' : 'Nhắn qua Zalo'}
        </a>
        <div class="w-full bg-muted/20 h-1 mt-2 relative overflow-hidden rounded"><div class="absolute top-0 left-0 h-full bg-primary animate-progress" style="width: 100%; transition: width 5s linear;"></div></div>
      `;
      document.body.appendChild(toast);

      // Hiệu ứng thanh chạy
      setTimeout(() => { toast.querySelector('.animate-progress').style.width = '0%'; }, 50);

      // Cập nhật lại Text nút submit
      submitBtn.innerText = isEnglish ? '✓ BOOKING SENT!' : '✓ ĐÃ GỬI ĐẶT BÀN!';

      // Dong toast: dung chung cho nut X va cho bo dem 5 giay, de du dong bang
      // cach nao thi form van duoc mo khoa lai (khong de nguoi dung ket o trang
      // thai nut submit disabled).
      let daDong = false;
      let hetGio;
      const bamEsc = (e) => { if (e.key === 'Escape') dongToast(); };
      const dongToast = () => {
        if (daDong) return;
        daDong = true;
        clearTimeout(hetGio);
        document.removeEventListener('keydown', bamEsc);
        if (document.body.contains(toast)) {
          toast.style.opacity = '0';
          toast.style.transform = 'translate(-50%, -20px)';
          toast.style.transition = 'opacity 0.5s, transform 0.5s';
          setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast); }, 500);
        }
        zaloForm.reset();
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      };

      toast.querySelector('[data-toast-close]').addEventListener('click', dongToast);
      document.addEventListener('keydown', bamEsc);

      // Tự động ẩn popup sau 5 giây
      hetGio = setTimeout(dongToast, 5000);
    });
  }

  // --- TOC Smooth Scroll without Hash Update ---
  const tocLinks = document.querySelectorAll('.blog-toc a[href^="#"]');
  if (tocLinks.length > 0) {
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = decodeURIComponent(link.getAttribute('href').substring(1));
        const targetElement = document.getElementById(targetId);

        // Không có phần tử đích thì để nguyên hành vi mặc định của trình duyệt.
        // Nếu preventDefault ở đây, link hỏng sẽ im lặng hoàn toàn và khách tưởng
        // trang bị lỗi — đúng cái đã xảy ra với 613 link mục lục trên bản EN.
        if (!targetElement) return;

        // Ngăn trình duyệt tự động append #id vào URL
        e.preventDefault();

        // Tính toán vị trí cuộn có trừ hao cho fixed navbar
        const yOffset = -100;
        const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        window.scrollTo({
          top: y,
          behavior: reduce ? 'auto' : 'smooth'
        });
      });
    });
  }

  // --- Floating Contact Buttons Injection ---
  if (!document.querySelector('.floating-contact')) {
    // Khoi nay truoc day hard-code tieng Viet nen tren ban EN nguoi dung tro nang
    // nghe nhan tieng Viet. Doc thang <html lang> chu KHONG dung cach
    // `pathname.includes('/en/')` nhu khoi dat ban: bai viet ban EN nam o duong
    // dan dang `/thien-vien-truc-lam-en/`, khong co '/en/' nen se doan sai.
    const enTrang = document.documentElement.lang === 'en';
    const nhan = enTrang
      ? { vung: 'Quick contact', goi: 'Call', goiDay: 'Call 076 452 7336', zalo: 'Chat on Zalo', zaloDay: 'Chat on Zalo 076 452 7336', len: 'Back to top' }
      : { vung: 'Liên hệ nhanh', goi: 'Gọi ngay', goiDay: 'Gọi điện 076 452 7336', zalo: 'Chat Zalo', zaloDay: 'Chat Zalo 076 452 7336', len: 'Cuộn lên đầu trang' };
    const floatingHTML = `
      <div class="floating-contact" role="complementary" aria-label="${nhan.vung}">
                <a href="tel:0764527336" class="floating-btn btn-call" data-tooltip="${nhan.goi}" aria-label="${nhan.goiDay}">
          <svg viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        </a>
        <a href="https://zalo.me/0764527336" target="_blank" rel="noopener noreferrer" class="floating-btn btn-zalo" data-tooltip="${nhan.zalo}" aria-label="${nhan.zaloDay}">
          <svg viewBox="0 7.4 24 9.2" fill="currentColor" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z"/></svg>
        </a>
      </div>
      
      <!-- Scroll to Top (Positioned dynamically) -->
      <button id="scrollToTopBtn" type="button" aria-label="${nhan.len}"
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

  // --- Scroll to Top Button Visibility (optimized with rAF to prevent forced reflow) ---
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  if (scrollToTopBtn) {
    // Truoc day nut dung onclick="..." noi tuyen. CSP cua site (script-src khong co
    // 'unsafe-hashes') CHAN moi handler noi tuyen nen bam khong cuon — do tren live
    // 14-09-2026: console bao vi pham CSP, scrollY dung yen. Gan qua addEventListener.
    scrollToTopBtn.addEventListener('click', () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          if (window.scrollY > 300) {
            scrollToTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
            scrollToTopBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
          } else {
            scrollToTopBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10');
            scrollToTopBtn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
          }
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });
  }

  // --- Nhung iframe ben thu ba khi BAM (ban do chan trang, video trang Duong di) ---
  // Truoc day la <iframe loading="lazy">: ban do Google o chan trang tai 470–560 KB /
  // 26–29 request moi khi khach cuon toi, con /duong-di/ tai 1,24 MB ngay luc vao vi video
  // va ban do nam trong nguong lazy (do 14-09-2026). Nay HTML chi co the <a> tro sang
  // Google Maps / YouTube — tat JS van mo duoc — va bam vao thi thay bang iframe tai cho.
  document.querySelectorAll('a[data-nhung-iframe]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // mo tab moi thi de nguyen
      e.preventDefault();
      const f = document.createElement('iframe');
      f.src = a.dataset.nhungIframe;
      f.title = a.dataset.nhungTitle || '';
      f.setAttribute('allowfullscreen', '');
      if (a.dataset.nhungAllow) f.setAttribute('allow', a.dataset.nhungAllow);
      if (a.dataset.nhungReferrer) f.setAttribute('referrerpolicy', a.dataset.nhungReferrer);
      if (a.dataset.nhungClass) f.className = a.dataset.nhungClass;
      f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0';
      a.replaceWith(f);
      f.focus();
    });
  });

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
      const CORNER_R = 64;        // khớp CSS border-radius 64px
      const GAP = 6;              // khe giữa hai toa, thanh nối .bt-chain (8px) phủ qua
      // Kích thước khớp SVG trong #train-track (css .bt-loco / .bt-wagon).
      // off = khoảng từ viền form tới tâm toa: bánh xe vừa chạm viền như chạy trên ray.
      const SIZE = (car) => car === loco ? { w: 60, h: 34, off: 16 } : { w: 46, h: 30, off: 15 };
      const sizes = allCars.map(SIZE);
      // Quãng đường lùi của từng toa so với đầu tàu: nửa toa trước + khe + nửa toa sau
      const lag = [0];
      for (let i = 1; i < sizes.length; i++) lag.push(lag[i - 1] + sizes[i - 1].w / 2 + GAP + sizes[i].w / 2);
      const CHAIN_OFF = 7.5;      // thanh nối nằm ngang tầm khung gầm, không phải giữa thân toa

      let headDist = 0;
      let lastTime = null;

      function getRoundedPerimeter(w, h, r) {
        return 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
      }

      function perimeterToPos(dist, w, h, r, OFFSET) {
        const sW = w - 2 * r;
        const sH = h - 2 * r;
        const arcLen = Math.PI * r / 2;
        const perimeter = 2 * sW + 2 * sH + 4 * arcLen;
        let d = ((dist % perimeter) + perimeter) % perimeter;

        if (d <= sW) return { x: r + d, y: -OFFSET, a: 0 };
        d -= sW;
        if (d <= arcLen) {
          const t = -Math.PI / 2 + (d / arcLen) * (Math.PI / 2);
          return { x: (w - r) + (r + OFFSET) * Math.cos(t), y: r + (r + OFFSET) * Math.sin(t), a: (t + Math.PI / 2) * 180 / Math.PI };
        }
        d -= arcLen;
        if (d <= sH) return { x: w + OFFSET, y: r + d, a: 90 };
        d -= sH;
        if (d <= arcLen) {
          const t = (d / arcLen) * (Math.PI / 2);
          return { x: (w - r) + (r + OFFSET) * Math.cos(t), y: (h - r) + (r + OFFSET) * Math.sin(t), a: (t + Math.PI / 2) * 180 / Math.PI };
        }
        d -= arcLen;
        if (d <= sW) return { x: (w - r) - d, y: h + OFFSET, a: 180 };
        d -= sW;
        if (d <= arcLen) {
          const t = Math.PI / 2 + (d / arcLen) * (Math.PI / 2);
          return { x: r + (r + OFFSET) * Math.cos(t), y: (h - r) + (r + OFFSET) * Math.sin(t), a: (t + Math.PI / 2) * 180 / Math.PI };
        }
        d -= arcLen;
        if (d <= sH) return { x: -OFFSET, y: (h - r) - d, a: 270 };
        d -= sH;
        const t = Math.PI + (d / arcLen) * (Math.PI / 2);
        return { x: r + (r + OFFSET) * Math.cos(t), y: r + (r + OFFSET) * Math.sin(t), a: (t + Math.PI / 2) * 180 / Math.PI };
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
        allCars.forEach((car, i) => {
          const pos = perimeterToPos(headDist - lag[i], w, h, r, sizes[i].off);
          const cw = sizes[i].w;
          const ch = sizes[i].h;
          // Chay bang transform chu KHONG phai left/top. left/top la thuoc tinh bo cuc
          // nen moi khung hinh Chrome ghi mot layout shift; Cloudflare Web Analytics
          // 29-08-2026 chi dich danh #train-track>div.bt-loco la nguon CLS lon nhat trang
          // chu (3 lan/6 gio). Probe tu dong khong bat duoc vi tau nam cuoi trang, ngoai
          // khung nhin — CLS chi dem phan tu TRONG khung nhin, ma khach thi cuon xuong.
          car.style.transform = 'translate(' + (pos.x - cw / 2) + 'px,' + (pos.y - ch / 2) + 'px) rotate(' + pos.a + 'deg)';
        });

        // Thanh nối đặt ở giữa khe hai toa liền kề, bám theo đường ray (kể cả ở góc bo)
        chains.forEach((chain, i) => {
          if (i < allCars.length - 1) {
            const mid = headDist - (lag[i] + sizes[i].w / 2 + GAP / 2);
            const p = perimeterToPos(mid, w, h, r, CHAIN_OFF);
            chain.style.transform = 'translate(' + (p.x - 4) + 'px,' + (p.y - 1) + 'px) rotate(' + p.a + 'deg)';
          }
        });

        if (trainVisible) requestAnimationFrame(tick);
      }
      let trainVisible = false;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          const wasVisible = trainVisible;
          trainVisible = entries[0].isIntersecting;
          // bánh xe quay + khói (CSS) chỉ chạy khi tàu đang hiện trên màn hình
          trainTrack.classList.toggle('dang-chay', trainVisible);
          if (trainVisible && !wasVisible) { lastTime = null; requestAnimationFrame(tick); }
        }, { threshold: 0.1 }).observe(trainTrack);
      } else {
        trainVisible = true;
        trainTrack.classList.add('dang-chay');
        requestAnimationFrame(tick);
      }
    }
  }
});
